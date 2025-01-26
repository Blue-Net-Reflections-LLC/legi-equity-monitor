/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.votesmart.org',
        pathname: '/canphoto/**',
        pathname: '/static/canphoto/**',
      },
    ],
  },
}

export default nextConfig 