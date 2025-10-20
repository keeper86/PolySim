// The TypeScript definitions below are automatically generated.
// Do not touch them, or risk, your modifications being lost.

export enum Table {
    KnexMigrations = 'knex_migrations',
    KnexMigrationsLock = 'knex_migrations_lock',
    SkillsAssessmentHistory = 'skills_assessment_history',
    UserData = 'user_data',
}

export type Tables = {
    knex_migrations: KnexMigrations;
    knex_migrations_lock: KnexMigrationsLock;
    skills_assessment_history: SkillsAssessmentHistory;
    user_data: UserData;
};

export type KnexMigrations = {
    id: number;
    name: string | null;
    batch: number | null;
    migration_time: Date | null;
};

export type KnexMigrationsLock = {
    index: number;
    is_locked: number | null;
};

export type SkillsAssessmentHistory = {
    id: number;
    user_id: string;
    assessment_data: unknown;
    assessment_date: Date;
    created_at: Date;
};

export type UserData = {
    user_id: string;
    email: string;
    has_assessment_published: boolean;
    display_name: string | null;
};
