import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      // Add your WooCommerce store domain here
      'example-partner-store.com',
      // Optionally add placeholder image domains
      'via.placeholder.com'
    ],
  },
  // Add environment variables
  env: {
    WOO_API_URL: process.env.WOO_API_URL,
    WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY,
    WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET,
    AFFILIATE_ID: process.env.AFFILIATE_ID,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  },
};

export default nextConfig;
