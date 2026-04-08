import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection',       value: '1; mode=block' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  async headers() {
    return [
      // Security headers on all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // CORS for public read API endpoints — allow cross-origin reads
      {
        source: '/api/(games|rankings|players|accuracy|energy)/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
