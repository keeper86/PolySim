const nextRoutes = require('nextjs-routes/config');
const withRoutes = nextRoutes();

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    serverExternalPackages: ['knex', 'pino', 'pino-pretty'],
    reactStrictMode: true,
    trailingSlash: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.githubassets.com',
                pathname: '/images/modules/logos_page/GitHub-Mark.png',
            },
        ],
    },
    // just for hot reload in dev
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

module.exports = withRoutes(nextConfig);
