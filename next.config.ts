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
  },

  // Menonaktifkan linting selama build
  eslint: {
    ignoreDuringBuilds: true, // Nonaktifkan linting selama build
  },

  
  typescript: {
    ignoreBuildErrors: true, // Menonaktifkan pemeriksaan kesalahan tipe saat build
  },


};

export default nextConfig;
