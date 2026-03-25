/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@advantage/shared'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.run.app' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

module.exports = nextConfig;
