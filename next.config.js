/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for now to test basic deployment
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig