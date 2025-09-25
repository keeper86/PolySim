import { NextResponse } from 'next/server';
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from '../../../server/router';

// Cannot be rpc because it depends on the router itself
export const GET = () => {
    const apiSpec = generateOpenApiDocument(appRouter, {
        title: 'PolySim API',
        version: '1.0.0',
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'baseUrl not set',
        description: 'This is the OpenAPI schema for the PolySim API',
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    });
    return NextResponse.json(apiSpec);
};
