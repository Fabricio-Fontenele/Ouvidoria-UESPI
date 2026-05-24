#!/usr/bin/env bash
#
# Deploy da Ouvidoria UESPI na VM.
#
# Executado pelo workflow .github/workflows/ci.yml (job "deploy") via SSH,
# DEPOIS que o código já foi atualizado (git reset --hard origin/main).
# Também pode ser rodado manualmente na VM:
#
#   cd ~/projects/Ouvidoria-UESPI && bash scripts/deploy.sh
#
# Pré-requisitos na VM (ver docs/deploy.md):
#   - /var/www/ouvidoria gravável pelo usuário do deploy (sem sudo no rsync);
#   - usuário no grupo `docker` OU sudo liberado para `docker compose`;
#   - sudoers NOPASSWD para `systemctl restart ouvidoria-backend`;
#   - .env (raiz) e ai-api/.env presentes e legíveis.
#
# Rollback: git reset --hard <sha-anterior> && bash scripts/deploy.sh
set -euo pipefail

WEB_ROOT="${WEB_ROOT:-/var/www/ouvidoria}"
BACKEND_SERVICE="${BACKEND_SERVICE:-ouvidoria-backend}"

cd "$(dirname "$0")/.."

echo "==> Instalando dependências"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

echo "==> Backend: migrations + build + restart"
pnpm prisma migrate deploy
pnpm build
sudo systemctl restart "$BACKEND_SERVICE"

echo "==> Frontend: build + publicação em $WEB_ROOT"
# web é projeto standalone (fora do workspace pnpm) e usa npm.
(cd web && npm ci && npm run build)
# -rlpt (sem -o/-g): não tenta preservar dono/grupo, evitando chgrp negado para não-root.
rsync -rlpt --delete web/dist/ "$WEB_ROOT/"

echo "==> ai-api: rebuild do container"
docker compose up -d --build ai-api

echo "==> Smoke test"
sleep 3
curl -fsS http://127.0.0.1:3333/health >/dev/null && echo "    backend /health OK"
curl -fsS http://127.0.0.1:4000/ready  >/dev/null && echo "    ai-api  /ready  OK"

echo "==> Deploy concluído com sucesso."
