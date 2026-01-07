const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) { 
  await knex('was_informed_by').del();
  await knex('was_associated_with').del();
  await knex('was_attributed_to').del();
  await knex('used').del();
  await knex('was_generated_by').del();
  await knex('activities').del();
  await knex('entities').del();
  await knex('agents').del();


  const agents = Array.from({ length: 5 }).map((_, i) => ({
    id: uuidv4(),
    label: `Agent ${i + 1}`,
    metadata: {
      type: i % 2 === 0 ? 'softwareAgent' : 'person',
      source: 'dev-seed'
    }
  }));

  await knex('agents').insert(agents);
 
  const now = Date.now();
  const activities = Array.from({ length: 20 }).map((_, i) => {
    const start = new Date(now - (i + 1) * 60_000);
    const end = new Date(start.getTime() + 30_000);

    return {
      id: `activity:${i + 1}`,
      label: [
        'Upload File',
        'Transform Data',
        'Validate Input',
        'Generate Report',
        'Store Artifact'
      ][i % 5],
      started_at: start,
      ended_at: end,
      metadata: {
        index: i,
        tool: 'polytrace',
        env: 'dev'
      }
    };
  });

  await knex('activities').insert(activities);

  
  const entities = Array.from({ length: 30 }).map((_, i) => ({
    id: `entity:${i + 1}`,
    label: `Entity ${i + 1}`,
    metadata: {
      format: i % 2 === 0 ? 'json' : 'txt',
      generatedInDev: true
    }
  }));

  await knex('entities').insert(entities);


  await knex('was_generated_by').insert(
    entities.slice(0, 20).map((e, i) => ({
      entity_id: e.id,
      activity_id: activities[i].id
    }))
  );

 
  await knex('used').insert(
    entities.slice(20).map((e, i) => ({
      entity_id: e.id,
      activity_id: activities[i % activities.length].id,
      role: i % 2 === 0 ? 'input' : 'config'
    }))
  );
 
  await knex('was_associated_with').insert(
    activities.map((a, i) => ({
      activity_id: a.id,
      agent_id: agents[i % agents.length].id,
      role: i % 2 === 0 ? 'executor' : 'observer'
    }))
  );
 
  await knex('was_attributed_to').insert(
    entities.slice(0, 10).map((e, i) => ({
      entity_id: e.id,
      agent_id: agents[i % agents.length].id
    }))
  );
 
  await knex('was_informed_by').insert(
    activities.slice(1).map((a, i) => ({
      informed_id: a.id,
      informer_id: activities[i].id
    }))
  );
};
