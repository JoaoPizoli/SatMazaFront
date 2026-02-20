import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Habilita tipagem estática para rotas (recomendado)
  typedRoutes: true,
  // Permite acesso de outros PCs na rede local durante desenvolvimento
  // Edite conforme o IP da sua máquina de desenvolvimento
  allowedDevOrigins: ['localhost'],
};

export default nextConfig;
