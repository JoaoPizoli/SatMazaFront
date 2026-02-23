#!/bin/bash
# ──────────────────────────────────────────────
# Script de deploy — SatMaza Frontend
# Uso: ./deploy.sh
# Requer: git, docker, docker compose
# ──────────────────────────────────────────────
set -e

echo ""
echo "═══════════════════════════════════════════"
echo "  SatMaza — Deploy Frontend"
echo "═══════════════════════════════════════════"
echo ""

# 1. Atualiza o código
echo "→ [1/3] Atualizando código (git pull)..."
git pull origin main

# 2. Carrega as variáveis de ambiente para o Docker build args
#    (NEXT_PUBLIC_* precisam estar disponíveis em tempo de build)
echo "→ [2/3] Construindo imagem Docker do Frontend..."
set -a
source .env.production
set +a
docker compose build frontend

# 3. Reinicia o container com a nova imagem
echo "→ [3/3] Reiniciando container..."
docker compose up -d

echo ""
echo "✓ Deploy concluído com sucesso!"
echo ""
echo "  Status dos containers:"
docker compose ps
echo ""
echo "  Para acompanhar os logs do Frontend:"
echo "  docker compose logs frontend -f"
echo ""
