/** @type {import('next').NextConfig} */

const MINI_SERVIDOR_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3307'

export const reactStrictMode = true;
export async function rewrites() {
    return [
        { source: '/mini/:path*', destination: `${MINI_SERVIDOR_URL}/:path*` },
        { source: 'api/:path*', destination: `` }
    ];
}