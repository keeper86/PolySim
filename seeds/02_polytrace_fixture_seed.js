const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FIXTURE_DIR = path.resolve(__dirname, '../../tools/polytrace/test/fixtures/tmp/prov_upload_input');

exports.seed = async function (knex) {
    if (!fs.existsSync(FIXTURE_DIR)) {
        console.warn('⚠ polytrace fixture directory not found, skipping seed');
        return;
    }

    await knex('was_informed_by').del();
    await knex('was_associated_with').del();
    await knex('was_attributed_to').del();
    await knex('used').del();
    await knex('was_generated_by').del();
    await knex('activities').del();
    await knex('entities').del();
    await knex('agents').del();

    const files = fs.readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json'));

    const agents = new Map();
    const activities = new Map();
    const entities = new Map();

    const relations = {
        used: [],
        wasGeneratedBy: [],
        wasAssociatedWith: [],
        wasAttributedTo: [],
        wasInformedBy: [],
    };

    for (const file of files) {
        const raw = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8'));

        for (const [id, a] of Object.entries(raw.agent || {})) {
            if (!agents.has(id)) {
                agents.set(id, {
                    id: uuidv4(),
                    label: a['prov:label'] || id,
                    metadata: a,
                });
            }
        }

        for (const [id, act] of Object.entries(raw.activity || {})) {
            if (!activities.has(id)) {
                activities.set(id, {
                    id,
                    label: act['prov:label'] || '<Activity>',
                    started_at: new Date(act['prov:startTime']),
                    ended_at: new Date(act['prov:endTime']),
                    metadata: act,
                });
            }
        }

        for (const [id, e] of Object.entries(raw.entity || {})) {
            if (!entities.has(id)) {
                entities.set(id, {
                    id,
                    label: e['prov:label'] || id,
                    metadata: e,
                });
            }
        }

        (raw.wasGeneratedBy || []).forEach((r) =>
            relations.wasGeneratedBy.push({
                entity_id: r.entity,
                activity_id: r.activity,
            }),
        );

        (raw.used || []).forEach((r) =>
            relations.used.push({
                activity_id: r.activity,
                entity_id: r.entity,
                role: r.role || 'input',
            }),
        );

        (raw.wasAssociatedWith || []).forEach((r) =>
            relations.wasAssociatedWith.push({
                activity_id: r.activity,
                agent_id: agents.get(r.agent)?.id,
                role: r.role,
            }),
        );

        (raw.wasAttributedTo || []).forEach((r) =>
            relations.wasAttributedTo.push({
                entity_id: r.entity,
                agent_id: agents.get(r.agent)?.id,
            }),
        );

        (raw.wasInformedBy || []).forEach((r) =>
            relations.wasInformedBy.push({
                informed_id: r.informed,
                informer_id: r.informer,
            }),
        );
    }

    await knex('agents').insert([...agents.values()]);
    await knex('activities').insert([...activities.values()]);
    await knex('entities').insert([...entities.values()]);

    if (relations.wasGeneratedBy.length) await knex('was_generated_by').insert(relations.wasGeneratedBy);

    if (relations.used.length) await knex('used').insert(relations.used);

    if (relations.wasAssociatedWith.length) await knex('was_associated_with').insert(relations.wasAssociatedWith);

    if (relations.wasAttributedTo.length) await knex('was_attributed_to').insert(relations.wasAttributedTo);

    if (relations.wasInformedBy.length) await knex('was_informed_by').insert(relations.wasInformedBy);

    console.log(`Seeded ${activities.size} activities from polytrace fixtures`);
};
