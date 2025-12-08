/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

const nextConfig = {
    experimental: {
        appDir: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
