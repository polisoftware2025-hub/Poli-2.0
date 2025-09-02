
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // This pattern allows images from any domain.
      // Useful for development, but for production, it's recommended to be more specific.
      {
        protocol: 'https',
        hostname: '**',
      },
       {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
