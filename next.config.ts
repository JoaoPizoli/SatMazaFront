import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Habilita tipagem estática para rotas (recomendado)
  typedRoutes: true,
  async headers() {
    return [
      {
        // Assets em /_next/static/* têm hash no nome — imutáveis, cache longo
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // HTML e demais respostas não devem ser cacheadas por proxies (Cloudflare),
        // evita 404 em chunks após novo deploy mudar o BUILD_ID
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
