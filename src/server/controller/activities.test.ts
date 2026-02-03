import { createHash } from 'crypto';
import { getCaller, getDb } from 'tests/vitest/setupTestcontainer';
import { describe, it, expect } from 'vitest';

// Helper that builds an activity row with sensible defaults and allows overrides.
type ActivityOverrides = Partial<{
    id: string;
    suffix: string | number;
    label: string;
    started_at: Date;
    startedAtMs: number;
    startedAgoMs: number;
    ended_at: Date;
    endedAtMs: number;
    durationMs: number;
    metadata: Record<string, unknown> | null;
}>;

function buildActivity(now: number, overrides: ActivityOverrides = {}) {
    const defaultLabel = overrides.label ?? 'activity';
    if (overrides.id) {
        console.warn(`Skipped. Needs to be sha256 hash anyway.`);
    }
    const id = createHash('sha256')
        .update(defaultLabel + String(now) + (overrides.suffix ?? Math.random()))
        .digest('hex');

    const started_at =
        overrides.started_at ?? new Date(overrides.startedAtMs ?? now - (overrides.startedAgoMs ?? 1000 * 60 * 60));
    const ended_at =
        overrides.ended_at ?? new Date(overrides.endedAtMs ?? started_at.getTime() + (overrides.durationMs ?? 10000));

    return {
        id,
        label: defaultLabel,
        started_at,
        ended_at,
        metadata: overrides.metadata ?? null,
    };
}

describe('getActivities controller (integration)', () => {
    it('searches full text and file hash and respects wall-time filter', async () => {
        const caller = getCaller();
        const db = getDb();

        const now = Date.now();

        // durations: a1 = 10s, a2 = 2s, a3 = 20s
        const a1 = buildActivity(now, {
            suffix: 'a1',
            label: 'upload file',
            startedAtMs: now - 1000 * 60 * 60,
            durationMs: 10000,
            metadata: { files: [{ hash: 'abc123' }], info: 'uploaded a file' },
        });

        const a2 = buildActivity(now, {
            suffix: 'a2',
            label: 'process data',
            startedAtMs: now - 1000 * 60 * 60 * 24,
            durationMs: 2000,
            metadata: { info: 'processing' },
        });

        const a3 = buildActivity(now, {
            suffix: 'a3',
            label: 'upload image',
            startedAtMs: now - 1000 * 60 * 30,
            durationMs: 20000,
            metadata: { files: [{ hash: 'def456' }], note: 'image upload' },
        });

        // Insert test rows directly
        await db('activities').insert([a1, a2, a3]);

        // 1) text search 'upload' should return a1 and a3
        const resText = await caller.getActivities({ limit: 10, offset: 0, query: 'upload' });
        const idsText = resText.activities.map((a) => a.id).sort();
        expect(idsText).toContain(a1.id);
        expect(idsText).toContain(a3.id);
        expect(idsText).not.toContain(a2.id);

        // 2) fileHash search for abc123 should return only a1
        const resHash = await caller.getActivities({ limit: 10, offset: 0, fileHash: 'abc123' });
        const idsHash = resHash.activities.map((a) => a.id);
        expect(idsHash).toContain(a1.id);
        expect(idsHash).not.toContain(a2.id);
        expect(idsHash).not.toContain(a3.id);

        // 3) minWallTimeMs: 9000ms should return a1 and a3 (10s and 20s), not a2
        const resWall = await caller.getActivities({ limit: 10, offset: 0, minWallTimeMs: 9000 });
        const idsWall = resWall.activities.map((a) => a.id);
        expect(idsWall).toContain(a1.id);
        expect(idsWall).toContain(a3.id);
        expect(idsWall).not.toContain(a2.id);
    });

    it('sorts by wallTime asc/desc and supports pagination + total', async () => {
        const caller = getCaller();
        const db = getDb();

        const now = Date.now();

        // Create 4 activities with durations 4000,1000,2000,3000 ms
        const a4000 = buildActivity(now, { suffix: 'a4000', label: 'act-4000', durationMs: 4000 });
        const a1000 = buildActivity(now, { suffix: 'a1000', label: 'act-1000', durationMs: 1000 });
        const a2000 = buildActivity(now, { suffix: 'a2000', label: 'act-2000', durationMs: 2000 });
        const a3000 = buildActivity(now, { suffix: 'a3000', label: 'act-3000', durationMs: 3000 });

        await db('activities').insert([a4000, a1000, a2000, a3000]);

        // Ascending order by wall time, filter to our inserted activities by label prefix
        const resAsc = await caller.getActivities({
            limit: 10,
            offset: 0,
            sortBy: 'wallTime',
            sortDir: 'asc',
            query: 'act-',
        });
        // compute durations for our inserted activities only
        type ActivityResult = { id: string; startedAt: number; endedAt: number };
        const mapDur = (list: ActivityResult[]) =>
            list.reduce<Record<string, number>>(
                (acc, a) => {
                    acc[a.id] = a.endedAt - a.startedAt;
                    return acc;
                },
                {} as Record<string, number>,
            );

        const durationsMapAsc = mapDur(resAsc.activities);
        const ourAscDurations = [a1000.id, a2000.id, a3000.id, a4000.id]
            .map((id) => durationsMapAsc[id])
            .sort((x, y) => x - y);
        expect(ourAscDurations).toEqual([1000, 2000, 3000, 4000]);
        expect(resAsc.total).toBe(4);

        // Descending order by wall time
        const resDesc = await caller.getActivities({
            limit: 10,
            offset: 0,
            sortBy: 'wallTime',
            sortDir: 'desc',
            query: 'act-',
        });
        const durationsMapDesc = mapDur(resDesc.activities);
        const ourDescDurations = [a4000.id, a3000.id, a2000.id, a1000.id].map((id) => durationsMapDesc[id]);
        expect(ourDescDurations).toEqual([4000, 3000, 2000, 1000]);

        // Pagination: limit 2 offset 1 on asc should return the 2nd and 3rd smallest for our filtered set
        const page = await caller.getActivities({
            limit: 2,
            offset: 1,
            sortBy: 'wallTime',
            sortDir: 'asc',
            query: 'act-',
        });
        const pageDurations = page.activities.map((a) => a.endedAt - a.startedAt);
        expect(pageDurations.sort((a, b) => a - b)).toEqual([2000, 3000]);
        // total should reflect the filtered dataset
        expect(page.total).toBe(4);
    });

    it('sorts by id asc/desc and supports pagination + total', async () => {
        const caller = getCaller();
        const db = getDb();

        const now = Date.now();

        const a1 = buildActivity(now, { id: 'id-a', suffix: 'a', label: 'id-act-a' });
        const a2 = buildActivity(now, { id: 'id-b', suffix: 'b', label: 'id-act-b' });
        const a3 = buildActivity(now, { id: 'id-c', suffix: 'c', label: 'id-act-c' });
        const a4 = buildActivity(now, { id: 'id-d', suffix: 'd', label: 'id-act-d' });

        await db('activities').insert([a1, a2, a3, a4]);

        // Ascending by id
        const resAsc = await caller.getActivities({
            limit: 10,
            offset: 0,
            sortBy: 'id',
            sortDir: 'asc',
            query: 'id-',
        });
        const ascIds = resAsc.activities.map((a) => a.id);
        expect(ascIds).toEqual([a1.id, a2.id, a3.id, a4.id].sort());
        expect(resAsc.total).toBe(4);

        // Descending by id
        const resDesc = await caller.getActivities({
            limit: 10,
            offset: 0,
            sortBy: 'id',
            sortDir: 'desc',
            query: 'id-',
        });
        expect(resDesc.activities.map((a) => a.id)).toEqual([a1.id, a2.id, a3.id, a4.id].sort().reverse());
        expect(resDesc.total).toBe(4);

        // Pagination: limit 2, offset 1 should return the 2nd and 3rd smallest ids
        const page = await caller.getActivities({
            limit: 2,
            offset: 1,
            sortBy: 'id',
            sortDir: 'asc',
            query: 'id-',
        });
        expect(page.activities.map((a) => a.id)).toEqual([a1.id, a2.id, a3.id, a4.id].sort().slice(1, 3));
        expect(page.total).toBe(4);
    });

    it('searches by entityName in label and metadata', async () => {
        const caller = getCaller();
        const db = getDb();

        const now = Date.now();

        const aAgent = buildActivity(now, {
            suffix: 'agent1',
            label: 'special entity upload',
            metadata: { agentName: 'Alice', details: 'some detail' },
        });

        const aOther = buildActivity(now, { suffix: 'other', label: 'other activity', metadata: { agentName: 'Bob' } });

        await db('activities').insert([aAgent, aOther]);

        const resByAgent = await caller.getActivities({ limit: 10, offset: 0, entityName: 'Alice' });
        const idsByAgent = resByAgent.activities.map((a) => a.id);
        expect(idsByAgent).toContain(aAgent.id);
        expect(idsByAgent).not.toContain(aOther.id);

        // Searching by a substring of the label should also find the activity
        const resByLabel = await caller.getActivities({ limit: 10, offset: 0, entityName: 'special' });
        const idsByLabel = resByLabel.activities.map((a) => a.id);
        expect(idsByLabel).toContain(aAgent.id);
    });

    it('filters by from/to started_at timestamps', async () => {
        const caller = getCaller();
        const db = getDb();

        const now = Date.now();
        const getDaysAgo = (days: number) => now - 1000 * 60 * 60 * 24 * days;

        const aOld = buildActivity(now, {
            suffix: 'old',
            label: 'time-old',
            startedAtMs: getDaysAgo(3),
        }); // 3 days ago
        const aMid = buildActivity(now, { suffix: 'mid', label: 'time-mid', startedAtMs: getDaysAgo(1) }); // 1 day ago
        const aRecent = buildActivity(now, {
            suffix: 'recent',
            label: 'time-recent',
            startedAtMs: now - 1000 * 60 * 60,
        }); // 1 hour ago

        await db('activities').insert([aOld, aMid, aRecent]);

        // from only: include mid and recent, exclude old
        const from = now - 1000 * 60 * 60 * 48; // 48 hours ago
        const resFrom = await caller.getActivities({ limit: 100, offset: 0, from });
        const idsFrom = resFrom.activities.map((a) => a.id);
        expect(idsFrom).toContain(aMid.id);
        expect(idsFrom).toContain(aRecent.id);
        expect(idsFrom).not.toContain(aOld.id);

        // from + to: narrow to mid only
        const to = now - 1000 * 60 * 60 * 2; // 2 hours ago
        const resRange = await caller.getActivities({ limit: 10, offset: 0, from, to });
        const idsRange = resRange.activities.map((a) => a.id);
        expect(idsRange).toContain(aMid.id);
        expect(idsRange).not.toContain(aRecent.id);
        expect(idsRange).not.toContain(aOld.id);
    });

    it('supports maxWallTimeMs filter', async () => {
        const caller = getCaller();
        const db = getDb();

        const now = Date.now();

        const s1 = buildActivity(now, { suffix: 's1', label: 'wt-5s', durationMs: 5000 });
        const s2 = buildActivity(now, { suffix: 's2', label: 'wt-10s', durationMs: 10000 });
        const s3 = buildActivity(now, { suffix: 's3', label: 'wt-20s', durationMs: 20000 });

        await db('activities').insert([s1, s2, s3]);

        const resMax = await caller.getActivities({ limit: 10, offset: 0, maxWallTimeMs: 9000, query: 'wt-' });
        const ids = resMax.activities.map((a) => a.id);
        expect(ids).toContain(s1.id);
        expect(ids).not.toContain(s2.id);
        expect(ids).not.toContain(s3.id);
    });
});
