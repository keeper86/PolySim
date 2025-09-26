import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    serverExternalPackages: ['knex', 'pino', 'pino-pretty'],
    reactStrictMode: true,
    typedRoutes: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.githubassets.com',
                pathname: '/images/modules/logos_page/GitHub-Mark.png',
            },
        ],
    },
    //@ts-expect-error just for hot reload in dev
    webpackDevMiddleware: (config) => {
        if (process.env.NODE_ENV === 'development') {
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }
        return config;
    },
};

export default nextConfig;
