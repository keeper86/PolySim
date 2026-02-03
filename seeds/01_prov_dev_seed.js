const fs = require('fs');
const path = require('path');
const getDevAdminUserFromInitialDevRealm = require('./00_upsert_keycloak_user').getDevAdminUserFromInitialDevRealm;

const fixtureDir = 'seeds/provDevSeedData';
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
    if (process.env.NODE_ENV === 'production') {
        console.error('Skipping prov upload seed in production. Something went wrong!');
        return;
    }
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
        const entitiesById = {};
        for (const entity of provInput.entities) {
            if (!entitiesById.hasOwnProperty(entity.id)) entitiesById[entity.id] = entity;
        }
        const entities = Object.values(entitiesById);

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

        const userId = (await getDevAdminUserFromInitialDevRealm()).id;

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
                await trx('used').insert(usedRows);
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

                const generatorActivityIds = new Set();
                wasGeneratedBy.forEach((wgb) => generatorActivityIds.add(wgb.activity_id));

                const informerRowsFromGenerators = Array.from(generatorActivityIds).map((generatorId) => ({
                    informed_id: activityRow.id, // current activity is informed by generatorId
                    informer_id: generatorId,
                }));

                const userActivityIds = new Set();
                wasUsed.forEach((used) => userActivityIds.add(used.activity_id));
                const informerRowsFromUsers = Array.from(userActivityIds).map((userId) => ({
                    informed_id: activityRow.id, // current activity is informed by userId
                    informer_id: userId,
                }));

                const totalInformerRows = informerRowsFromGenerators.concat(informerRowsFromUsers);
                if (totalInformerRows.length > 0) {
                    await trx('was_informed_by')
                        .insert(totalInformerRows)
                        .onConflict(['informed_id', 'informer_id'])
                        .ignore();
                }
                counts.wasInformedBy += totalInformerRows.length;
            }
        });
    }

    const absoluteCount = Object.values(counts).reduce((a, b) => a + b, 0);
    if (absoluteCount !== 0) {
        console.log('Seeded prov upload. Counts:', counts);
        return;
    }
};
