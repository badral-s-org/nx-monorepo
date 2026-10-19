//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SECRET_MANAGER_SERVICE_URL: process.env.SECRET_MANAGER_SERVICE_URL,
  },
  // Next.js options go here

  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js
};

module.exports = nextConfig;
