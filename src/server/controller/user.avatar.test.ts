import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { getCaller, getDb } from 'tests/vitest/setupTestcontainer';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x4a, 0x46, 0x49, 0x46, 0x00]);

const ONE_MIB = 1 * 1024 * 1024;

function makePngBuffer(totalBytes: number): Buffer {
    const minSize = Math.max(totalBytes, PNG_SIGNATURE.length);
    const buf = Buffer.alloc(minSize, 0);
    PNG_SIGNATURE.copy(buf, 0);
    return buf;
}

function makeNonPngBuffer(totalBytes: number): Buffer {
    const size = Math.max(totalBytes, JPEG_SIGNATURE.length);
    const buf = Buffer.alloc(size, 0);
    JPEG_SIGNATURE.copy(buf, 0);
    return buf;
}

function toBase64(buf: Buffer): string {
    return buf.toString('base64');
}

async function createTestUser() {
    const userId = `avatar-user-${randomUUID()}`;
    const db = getDb();
    await db('user_data').insert({
        user_id: userId,
        avatar: null,
        email: `${userId}@example.com`,
        display_name: 'Avatar Test User',
        has_assessment_published: false,
    });
    const caller = getCaller(userId);
    return { userId, caller };
}

describe('user avatar update/get', () => {
    let userId: string;
    let caller: ReturnType<typeof getCaller>;

    beforeEach(async () => {
        ({ userId, caller } = await createTestUser());
    });

    describe('PNG cases', () => {
        it('accepts base64 PNG < 1MB and returns it on getUser', async () => {
            const pngSmall = makePngBuffer(10_000); // ~10 KB
            const b64 = toBase64(pngSmall);

            await caller.updateUser({ avatar: b64 });

            const got = await caller.getUser({ userId });

            expect(got.userId).toBe(userId);
            expect(got.displayName).toBe('Avatar Test User');
            expect(got.avatar).toBe(b64);
        });

        it('accepts data URL PNG < 1MB and returns raw base64 on getUser', async () => {
            const pngSmall = makePngBuffer(20_000);
            const b64 = toBase64(pngSmall);
            const dataUrl = `data:image/png;base64,${b64}`;

            await caller.updateUser({ avatar: dataUrl });
            const got = await caller.getUser({ userId });

            expect(got.avatar).toBe(b64);
        });

        it('treats empty string as null (removes avatar)', async () => {
            const pngSmall = makePngBuffer(8 + 5);
            const b64 = toBase64(pngSmall);
            await caller.updateUser({ avatar: b64 });
            await caller.updateUser({ avatar: '' });

            const got = await caller.getUser({ userId });

            expect(got.avatar).toBeUndefined();
        });

        it('set avatar (<1MB) then clear with whitespace string (nullify)', async () => {
            const pngSmall = makePngBuffer(50_000);
            const b64 = toBase64(pngSmall);

            await caller.updateUser({ avatar: b64 });
            let got = await caller.getUser({ userId });
            expect(got.avatar).toBe(b64);

            await caller.updateUser({ avatar: '   ' }); // whitespace becomes empty after trim
            got = await caller.getUser({ userId });
            expect(got.avatar).toBeUndefined();
        });

        it('keeps existing avatar if avatar field is omitted on update', async () => {
            const pngSmall = makePngBuffer(15_000);
            const b64 = toBase64(pngSmall);

            await caller.updateUser({ avatar: b64 });
            await caller.updateUser({ displayName: 'New Name' });

            const got = await caller.getUser({ userId });

            expect(got.avatar).toBe(b64);
            expect(got.displayName).toBe('New Name');
        });

        it('rejects base64 PNG > 1MB (by zod input size cap)', async () => {
            const big = makePngBuffer(ONE_MIB + 100_000);
            const bigB64 = toBase64(big);

            expect(bigB64.length).toBeGreaterThan(ONE_MIB);

            await expect(caller.updateUser({ avatar: bigB64 })).rejects.toThrow(/too large/i);
        });

        it('rejects data URL PNG > 1MB (by zod input size cap)', async () => {
            const big = makePngBuffer(ONE_MIB + 200_000);
            const bigB64 = toBase64(big);
            const dataUrl = `data:image/png;base64,${bigB64}`;

            await expect(caller.updateUser({ avatar: dataUrl })).rejects.toThrow(/too large/i);
        });
    });

    describe('non-PNG cases', () => {
        beforeEach(async () => {});

        it('rejects non-PNG base64 > 1MB by size (same size rule as PNG)', async () => {
            const big = makeNonPngBuffer(ONE_MIB + 300_000);
            const b64 = toBase64(big);

            await expect(caller.updateUser({ avatar: b64 })).rejects.toThrow(/too large/i);
        });

        it('rejects non-PNG data URL > 1MB by size (even if MIME says png)', async () => {
            const big = makeNonPngBuffer(ONE_MIB + 400_000);
            const b64 = toBase64(big);
            // pretend it's png in the data URL
            const dataUrl = `data:image/png;base64,${b64}`;

            await expect(caller.updateUser({ avatar: dataUrl })).rejects.toThrow(/too large/i);
        });

        it('rejects non-PNG base64 < 1MB by PNG signature check', async () => {
            const small = makeNonPngBuffer(400_000);
            const b64 = toBase64(small);

            // make the regex a bit looser so wording changes don’t break the test
            await expect(caller.updateUser({ avatar: b64 })).rejects.toThrow(/png images? are supported/i);
        });

        it('rejects non-PNG data URL < 1MB by PNG signature check (even if declared image/png)', async () => {
            const small = makeNonPngBuffer(300_000);
            const b64 = toBase64(small);
            const dataUrl = `data:image/png;base64,${b64}`;

            await expect(caller.updateUser({ avatar: dataUrl })).rejects.toThrow(/png images? are supported/i);
        });
    });
});
