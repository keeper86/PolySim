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
};

module.exports = withRoutes(nextConfig);
