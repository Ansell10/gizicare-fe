import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Menambahkan environment variable ke dalam konfigurasi Next.js
  env: {
    NEXT_PUBLIC_API_URL: process.env.APP_URL, // Mengambil nilai dari .env.local
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "akcdn.detik.net.id",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "awsimages.detik.net.id",
        port: "",
        pathname: "/**",
      },
      // kalau butuh domain lain, tambah objek serupa di sini

    ],
  }
};

export default nextConfig;
