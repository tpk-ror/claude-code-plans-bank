/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3847/api/:path*',
      },
    ];
  },
  // Disable strict mode for xterm.js compatibility
  reactStrictMode: false,
};

module.exports = nextConfig;
