const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const fixtureDir = 'tools/polytrace/test/fixtures/tmp/prov_upload_input';
let provInputs = [];
if (fs.existsSync(fixtureDir)) {
    const stat = fs.statSync(fixtureDir);
    if (stat.isFile() && fixtureDir.endsWith('.json')) {
        try {
            const raw = fs.readFileSync(fixtureDir, 'utf8');
            provInputs.push(JSON.parse(raw));
        } catch (e) {
            console.warn('ABORT: Failed to parse fixture file:', e.message);
            process.exit(1);
        }
    } else if (stat.isDirectory()) {
        const files = fs.readdirSync(fixtureDir).filter((f) => f.endsWith('.json'));
        for (const f of files) {
            const filePath = path.join(fixtureDir, f);
            try {
                const raw = fs.readFileSync(filePath, 'utf8');
                provInputs.push(JSON.parse(raw));
            } catch (e) {
                console.warn(`Skipping fixture ${filePath}:`, e.message);
            }
        }
        if (provInputs.length === 0) {
            console.warn(`No valid .json fixtures found in ${fixtureDir}`);
            process.exit(1);
        }
    } else {
        console.warn(`Fixture path exists but is not a file or directory: ${fixtureDir}`);
        process.exit(1);
    }
} else {
    console.warn(`Fixture path does not exist: ${fixtureDir}`);
    process.exit(1);
}

exports.seed = async function (knex) {
    const counts = {
        entities: 0,
        activities: 0,
        wasAssociatedWith: 0,
        wasGeneratedBy: 0,
        used: 0,
        wasInformedBy: 0,
        wasAttributed: 0,
    };
    for (const provInput of provInputs) {
        const entitiesById = new Map();
        for (const e of provInput.entities) {
            if (!entitiesById.has(e.id)) entitiesById.set(e.id, e);
        }
        const entities = Array.from(entitiesById.values());

        const outputEntities = entities.filter((e) => e.role === 'output');
        if (outputEntities.length === 0) {
            continue;
        }
        const processes = entities.filter((e) => e.role === 'process');
        if (processes.length === 0) {
            continue;
        }
        const [process] = processes;
        const inputEntities = entities.filter((e) => e.role === 'input');

        const userId = uuidv4();

        await knex.transaction(async (trx) => {
            const activityRow = {
                id: provInput.activity.id,
                label: provInput.activity.label || `Run ${process.label}` || '<Activity>',
                started_at: new Date(provInput.activity.startedAt),
                ended_at: new Date(provInput.activity.endedAt),
                metadata: provInput.activity.metadata,
            };

            const existingActivity = await trx('activities').where({ id: activityRow.id }).first();
            if (existingActivity) {
                return;
            }

            await trx('activities').insert(activityRow);
            counts.activities += 1;

            await trx('agents')
                .insert({ id: userId, metadata: { autoCreated: true } })
                .onConflict('id')
                .ignore();

            await trx('was_associated_with').insert({ activity_id: activityRow.id, agent_id: userId });
            counts.wasAssociatedWith += 1;

            const allEntityIds = entities.map((e) => e.id);
            const existingEntities = await trx('entities').whereIn('id', allEntityIds);
            const existingEntityIds = existingEntities.map((e) => e.id);

            const newEntityRows = entities
                .filter((e) => !existingEntityIds.includes(e.id))
                .map((e) => ({
                    id: e.id,
                    metadata: e.metadata,
                    label: e.label,
                    created_at: e.createdAt ? new Date(e.createdAt) : undefined,
                }));

            if (newEntityRows.length > 0) {
                await trx('entities').insert(newEntityRows);
            }
            counts.entities += newEntityRows.length;

            const mapEntity = (ent) => ({ activity_id: activityRow.id, entity_id: ent.id });

            const usedRows = [
                ...inputEntities.map((inputEntity) => ({ ...mapEntity(inputEntity), role: inputEntity.role })),
                { ...mapEntity(process), role: process.role },
            ];
            if (usedRows.length > 0) {
                try {
                    await trx('used').insert(usedRows);
                } catch (err) {
                    for (const row of usedRows) {
                        try {
                            await trx('used').insert(row).onConflict(['activity_id', 'entity_id', 'role']).ignore();
                        } catch (e) {}
                    }
                }
            }
            counts.used += usedRows.length;

            const wasGeneratedByRows = outputEntities
                .filter((out) => !existingEntityIds.includes(out.id))
                .map((out) => mapEntity(out));
            if (wasGeneratedByRows.length > 0) {
                await trx('was_generated_by')
                    .insert(wasGeneratedByRows)
                    .onConflict(['entity_id', 'activity_id'])
                    .ignore();
            }
            counts.wasGeneratedBy += wasGeneratedByRows.length;

            const wasAttributedRows = outputEntities
                .filter((out) => !existingEntityIds.includes(out.id))
                .map((out) => ({ entity_id: out.id, agent_id: userId }));
            if (wasAttributedRows.length > 0) {
                await trx('was_attributed_to').insert(wasAttributedRows).onConflict(['entity_id', 'agent_id']).ignore();
            }
            counts.wasAttributed += wasAttributedRows.length;

            if (existingEntityIds.length > 0) {
                const wasGeneratedBy = await trx('was_generated_by').whereIn('entity_id', existingEntityIds);
                const wasUsed = await trx('used').whereIn('entity_id', existingEntityIds);

                const informedByActivityIds = new Set();
                wasGeneratedBy.forEach((wgb) => informedByActivityIds.add(wgb.activity_id));

                const informedByRows = Array.from(informedByActivityIds).map((informedId) => ({
                    informed_id: informedId,
                    informer_id: activityRow.id,
                }));

                const informerToActivityIds = new Set();
                wasUsed.forEach((used) => informerToActivityIds.add(used.activity_id));
                const usedInformedByRows = Array.from(informerToActivityIds).map((informedId) => ({
                    informed_id: informedId,
                    informer_id: activityRow.id,
                }));

                const totalInformedByRows = informedByRows.concat(usedInformedByRows);
                if (totalInformedByRows.length > 0) {
                    await trx('was_informed_by')
                        .insert(totalInformedByRows)
                        .onConflict(['informed_id', 'informer_id'])
                        .ignore();
                }
                counts.wasInformedBy += totalInformedByRows.length;
            }
        });
    }

    console.log('Seeded prov upload. Counts:', counts);
};
