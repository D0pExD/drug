/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  distDir: '../html',
  basePath: '',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
