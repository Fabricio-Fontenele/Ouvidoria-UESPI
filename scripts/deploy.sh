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
# VITE_API_BASE_URL é embutido no bundle em build time. O CI roda este script via
# SSH sem exportar a variável, então resolvemos do ambiente ou do .env da raiz e
# exigimos que bata EXATAMENTE com a origem pública de produção. Um valor errado
# faz o bundle chamar o host errado e o login quebra com "Unexpected token '<'"
# (recebe index.html no lugar de JSON). Override via EXPECTED_VITE_API_BASE_URL.
EXPECTED_VITE_API_BASE_URL="${EXPECTED_VITE_API_BASE_URL:-https://ouvidoria.fabriciofontenele.com.br}"
if [ -z "${VITE_API_BASE_URL:-}" ] && [ -f .env ]; then
  VITE_API_BASE_URL="$(grep -E '^VITE_API_BASE_URL=' .env | tail -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
fi
if [[ "${VITE_API_BASE_URL:-}" != "$EXPECTED_VITE_API_BASE_URL" ]]; then
  echo "ERRO: VITE_API_BASE_URL deve ser '$EXPECTED_VITE_API_BASE_URL' no deploy de produção (atual: '${VITE_API_BASE_URL:-<vazio>}')." >&2
  echo "      Defina-o no .env da raiz, ou exporte EXPECTED_VITE_API_BASE_URL para apontar outro destino." >&2
  exit 1
fi
echo "    VITE_API_BASE_URL=$VITE_API_BASE_URL"
# web é projeto standalone (fora do workspace pnpm) e usa npm.
(cd web && npm ci && VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build)
# -rlpt (sem -o/-g): não tenta preservar dono/grupo, evitando chgrp negado para não-root.
rsync -rlpt --delete web/dist/ "$WEB_ROOT/"

echo "==> ai-api: rebuild do container"
docker compose up -d --build ai-api

echo "==> Smoke test"
sleep 3
curl -fsS http://127.0.0.1:3333/health >/dev/null && echo "    backend /health OK"
curl -fsS http://127.0.0.1:4000/ready  >/dev/null && echo "    ai-api  /ready  OK"

echo "==> Deploy concluído com sucesso."
