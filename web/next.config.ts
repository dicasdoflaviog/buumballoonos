import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'teacvdvxxoizrwxruprg.supabase.co',
      }
    ]
  }
};

export default nextConfig;