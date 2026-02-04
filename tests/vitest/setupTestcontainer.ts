import type { UserData } from '@/types/db_schemas';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import knex from 'knex';
import { afterAll, beforeAll } from 'vitest';

dotenvExpand.expand(dotenv.config());

export const testUsers: Record<string, UserData> = {
    testUser: {
        user_id: 'test-user',
        avatar: null,
        email: 'test-user@example.com',
        display_name: 'Test User',
        has_assessment_published: false,
    },
    otherUserUnpublished: {
        user_id: 'other-user-unpublished',
        avatar: null,
        email: 'other-user@example.com',
        display_name: 'Other User',
        has_assessment_published: false,
    },
    otherUserPublished: {
        user_id: 'other-user-published',
        avatar: null,
        email: 'other-user@example.com',
        display_name: 'Other User',
        has_assessment_published: true,
    },
};

let knexInstance: ReturnType<typeof knex> | undefined;
let container: StartedPostgreSqlContainer | undefined;
let appRouter: typeof import('@/server/router').appRouter | undefined;

export const getDb = () => {
    if (!knexInstance) {
        throw new Error('Knex instance not initialized yet. Call getKnexInstance after beforeAll hook.');
    }
    return knexInstance;
};

export const getAppRouter = () => {
    if (!appRouter) {
        throw new Error('App router not initialized yet. Call getAppRouter after beforeAll hook.');
    }
    return appRouter;
};

export const getCaller = (id: string = testUsers.testUser.user_id) => {
    return getAppRouter().createCaller({
        session: {
            type: 'next-auth',
            accessToken: 'test-token',
            user: { id, email: `${id}@example.com` },
            expires: new Date(Date.now() + 3600_000).toISOString(),
        },
    });
};

export const getPatCaller = (id: string = testUsers.testUser.user_id) => {
    return getAppRouter().createCaller({
        session: {
            type: 'pat-auth',
            patToken: 'test-pat-token',
            patId: 'test-pat-id',
            user: { id },
            expires: new Date(Date.now() + 3600_000).toISOString(),
        },
    });
};

export const getUnauthenticatedCaller = () => {
    return getAppRouter().createCaller({
        session: { type: 'no-auth', user: null },
    });
};

if (!process.env.POSTGRES_DB || !process.env.POSTGRES_USER || !process.env.POSTGRES_PASSWORD) {
    throw new Error(
        'Please set POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD environment variables for the test container setup.',
    );
}

async function getContainer(): Promise<StartedPostgreSqlContainer> {
    if (container) {
        return container;
    }

    container = await new PostgreSqlContainer('postgres:15-alpine')
        .withDatabase(process.env.POSTGRES_DB!)
        .withUsername(process.env.POSTGRES_USER!)
        .withPassword(process.env.POSTGRES_PASSWORD!)
        .start();

    const host = container.getHost();
    const port = container.getPort();

    process.env.DATABASE_URL = `postgresql://${container.getUsername()}:${container.getPassword()}@${host}:${port}/${container.getDatabase()}`;
    process.env.POSTGRES_DB = container.getDatabase();
    process.env.POSTGRES_USER = container.getUsername();
    process.env.POSTGRES_PASSWORD = container.getPassword();

    return container;
}

async function getKnexInstance(): Promise<ReturnType<typeof knex>> {
    if (knexInstance) {
        return knexInstance;
    }

    const c = await getContainer();
    const host = c.getHost();
    const port = c.getPort();

    knexInstance = knex({
        client: 'pg',
        connection: {
            host,
            user: c.getUsername(),
            password: c.getPassword(),
            database: c.getDatabase(),
            port,
        },
    });

    await knexInstance.migrate.latest();
    await knexInstance.seed.run();

    await knexInstance('user_data')
        .insert(Object.values(testUsers))
        .catch((err) => {
            console.error(`Error seeding test users: ${JSON.stringify(Object.values(testUsers))}`, err);
            throw err;
        });

    return knexInstance;
}

async function getRouter() {
    if (appRouter) {
        return appRouter;
    }
    await getKnexInstance();
    appRouter = (await import('@/server/router')).appRouter;
    return appRouter;
}

beforeAll(async () => {
    await getRouter();
    await getKnexInstance();
});

afterAll(async () => {
    if (knexInstance) {
        await knexInstance.destroy();
        knexInstance = undefined;
    }
    if (container) {
        await container.stop();
        container = undefined;
    }
    appRouter = undefined;
});
