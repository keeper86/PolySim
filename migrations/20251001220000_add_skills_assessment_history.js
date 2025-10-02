exports.up = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Add skills_assessment table.');
    }

    await knex.schema.createTable('skills_assessment_history', (table) => {
        table.increments('id').primary();
        table.string('user_id').notNullable().index();
        table.jsonb('assessment_data').notNullable().defaultTo('{}');
        table.date('assessment_date').notNullable().defaultTo(knex.fn.now());
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    });

    await knex.raw(
        'CREATE UNIQUE INDEX idx_skills_history_user_date ON skills_assessment_history(user_id, assessment_date)',
    );
};

exports.down = async function (knex) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Remove skills_assessment table.');
    }
    await knex.schema.dropTableIfExists('skills_assessment_history');
};
