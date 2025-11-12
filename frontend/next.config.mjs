/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false
  },
  webpack: (config) => config
};

export default nextConfig;
