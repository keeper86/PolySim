// The TypeScript definitions below are automatically generated.
// Do not touch them, or risk, your modifications being lost.

export enum Table {
    Activities = 'activities',
    Agents = 'agents',
    Entities = 'entities',
    KnexMigrations = 'knex_migrations',
    KnexMigrationsLock = 'knex_migrations_lock',
    PersonalAccessTokens = 'personal_access_tokens',
    PersonalAccessTokensLogs = 'personal_access_tokens_logs',
    SkillsAssessmentHistory = 'skills_assessment_history',
    Used = 'used',
    UserData = 'user_data',
    WasAssociatedWith = 'was_associated_with',
    WasAttributedTo = 'was_attributed_to',
    WasGeneratedBy = 'was_generated_by',
    WasInformedBy = 'was_informed_by',
}

export type Tables = {
    activities: Activities;
    agents: Agents;
    entities: Entities;
    knex_migrations: KnexMigrations;
    knex_migrations_lock: KnexMigrationsLock;
    personal_access_tokens: PersonalAccessTokens;
    personal_access_tokens_logs: PersonalAccessTokensLogs;
    skills_assessment_history: SkillsAssessmentHistory;
    used: Used;
    user_data: UserData;
    was_associated_with: WasAssociatedWith;
    was_attributed_to: WasAttributedTo;
    was_generated_by: WasGeneratedBy;
    was_informed_by: WasInformedBy;
};

export type Activities = {
    id: string;
    label: string;
    started_at: Date;
    ended_at: Date;
    metadata: Record<string, unknown> | null;
};

export type Agents = {
    id: string;
    label: string;
    metadata: Record<string, unknown> | null;
    created_at: Date | null;
};

export type Entities = {
    id: string;
    label: string | null;
    metadata: Record<string, unknown>;
    created_at: Date | null;
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

export type PersonalAccessTokens = {
    id: string;
    user_id: string;
    name: string;
    token_hash: string;
    expires_at: Date | null;
    created_at: Date;
};

export type PersonalAccessTokensLogs = {
    id: string;
    pat_id: string | null;
    used_at: Date;
    ip: string | null;
    user_agent: string | null;
};

export type SkillsAssessmentHistory = {
    id: number;
    user_id: string;
    assessment_data: Record<string, unknown>;
    assessment_date: Date;
    created_at: Date;
};

export type Used = {
    activity_id: string;
    entity_id: string;
    role: string;
};

export type UserData = {
    user_id: string;
    email: string;
    has_assessment_published: boolean;
    display_name: string | null;
};

export type WasAssociatedWith = {
    activity_id: string;
    agent_id: string;
    role: string | null;
};

export type WasAttributedTo = {
    entity_id: string;
    agent_id: string;
};

export type WasGeneratedBy = {
    entity_id: string;
    activity_id: string;
};

export type WasInformedBy = {
    informed_id: string;
    informer_id: string;
};
