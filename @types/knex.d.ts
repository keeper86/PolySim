import type { Tables as DBTables } from '@/types/db_schemas';
declare module 'knex/types/tables' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Tables extends DBTables {}
}
