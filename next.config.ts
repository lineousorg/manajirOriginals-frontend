/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/dev',
  assetPrefix: '/dev/',
  trailingSlash: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
