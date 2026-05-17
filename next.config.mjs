import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "connect-src 'self' https://nominatim.openstreetmap.org https://challenges.cloudflare.com",
    "frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org https://challenges.cloudflare.com",
].join("; ");

const securityHeaders = [
    {
        key: "Content-Security-Policy",
        value: csp,
    },
    {
        key: "X-Frame-Options",
        value: "DENY",
    },
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
    },
];

const corsHeaders = [
    {
        key: "Access-Control-Allow-Origin",
        value: process.env.NEXT_PUBLIC_BASE_URL ?? "*",
    },
    {
        key: "Access-Control-Allow-Methods",
        value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
    {
        key: "Access-Control-Allow-Headers",
        value: "Content-Type, Authorization",
    },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cms.staging.ned-it.de",
                pathname: "/assets/**",
            },
            {
                protocol: "https",
                hostname: "cms.ned-it.de",
                pathname: "/assets/**",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8055",
                pathname: "/assets/**",
            },
        ],
    },

    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
            {
                source: "/api/:path*",
                headers: corsHeaders,
            },
        ];
    },
};

export default withNextIntl(nextConfig);