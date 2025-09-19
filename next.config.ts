import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    serverExternalPackages: ['knex', 'pino', 'pino-pretty'],
    typedRoutes: true,
};

export default nextConfig;
