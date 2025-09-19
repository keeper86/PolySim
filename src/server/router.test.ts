import { describe, expect, it } from 'vitest';
import { appRouter } from './router';
import { generateOpenApiDocument } from 'trpc-to-openapi';

describe('Route Consistency', () => {
    it('should have consistent routes between router and OpenAPI spec', () => {
        const routerPaths = Object.keys(appRouter._def.procedures).map((path) => `/${path.replace('.', '/')}`);

        const openApiDoc = generateOpenApiDocument(appRouter, {
            title: 'PolySim API',
            version: '1.0.0',
            baseUrl: 'http://localhost:3000/api',
        });
        const openApiPaths = Object.keys(openApiDoc.paths || {});

        routerPaths.forEach((path) => {
            expect(openApiPaths).toContain(path);
        });

        openApiPaths.forEach((path) => {
            expect(routerPaths).toContain(path);
        });
    });
});
