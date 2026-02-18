import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Habilita tipagem estática para rotas (recomendado)
  typedRoutes: true,
  // Permite acesso de outros PCs na rede local durante desenvolvimento
  allowedDevOrigins: ['192.168.101.35', '192.168.101.*', '192.168.1.*', '192.168.20.17'],
};

export default nextConfig;
