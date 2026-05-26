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
echo "→ [1/4] Atualizando código (git pull)..."
git pull origin main

# 2. Carrega as variáveis de ambiente para o Docker build args
#    (NEXT_PUBLIC_* precisam estar disponíveis em tempo de build)
echo "→ [2/4] Construindo imagem Docker do Frontend..."
set -a
source .env.production
set +a
docker compose build frontend

# 3. Reinicia o container com a nova imagem
echo "→ [3/4] Reiniciando container..."
docker compose up -d

# 4. Purga o cache do Cloudflare
#    Evita 404 em chunks _next/static após o BUILD_ID mudar.
#    Requer CF_ZONE_ID e CF_API_TOKEN no .env.production.
echo "→ [4/4] Purgando cache do Cloudflare..."
if [ -n "$CF_ZONE_ID" ] && [ -n "$CF_API_TOKEN" ]; then
  CF_RESPONSE=$(curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}')

  if echo "$CF_RESPONSE" | grep -q '"success":true'; then
    echo "  ✓ Cache do Cloudflare purgado com sucesso."
  else
    echo "  ⚠ Falha ao purgar cache do Cloudflare:"
    echo "    $CF_RESPONSE"
  fi
else
  echo "  ⚠ CF_ZONE_ID ou CF_API_TOKEN não definidos em .env.production — pulando purge."
fi

echo ""
echo "✓ Deploy concluído com sucesso!"
echo ""
echo "  Status dos containers:"
docker compose ps
echo ""
echo "  Para acompanhar os logs do Frontend:"
echo "  docker compose logs frontend -f"
echo ""
