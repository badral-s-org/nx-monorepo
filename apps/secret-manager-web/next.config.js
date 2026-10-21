//@ts-check
const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} = require('next/constants');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];

/** @type {(phase: string) => import('next').NextConfig} */
module.exports = (phase) => {
  // Local development always talks to `wrangler dev`.
  const serviceUrl =
    phase === PHASE_DEVELOPMENT_SERVER
      ? 'http://localhost:8787/api'
      : process.env.SECRET_MANAGER_SERVICE_URL;

  return {
    poweredByHeader: false,
    reactStrictMode: true,

    // The browser only talks to this app. /api is proxied to the service so the
    // auth cookies are first party and work in browsers that block third party cookies.
    async rewrites() {
      // Checked here rather than at load time: Nx loads this file to build its
      // project graph before the environment is available.
      if (!serviceUrl) {
        if (phase === PHASE_PRODUCTION_BUILD) {
          throw new Error(
            'SECRET_MANAGER_SERVICE_URL must be set for production builds',
          );
        }
        return [];
      }

      return [
        {
          source: '/api/:path*',
          destination: `${serviceUrl.replace(/\/$/, '')}/:path*`,
        },
      ];
    },

    async headers() {
      return [{ source: '/:path*', headers: securityHeaders }];
    },
  };
};
