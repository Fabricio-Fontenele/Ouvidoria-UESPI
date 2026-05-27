# Deploy — CI/CD (GitHub Actions → VM)

Pipeline em `.github/workflows/ci.yml`. Em **todo push na `main`**, os três jobs de
validação rodam em paralelo (`backend`, `ai-api`, `web`); **só se os três passarem**
o job `deploy` conecta na VM por SSH e executa `scripts/deploy.sh`.

Em Pull Request, apenas a validação roda — o deploy é pulado.

```
push main ──▶ [backend] [ai-api] [web]  ──(todos verdes)──▶ [deploy → VM]
PR        ──▶ [backend] [ai-api] [web]  ──▶ (sem deploy)
```

## 1. Secrets do repositório (Settings → Secrets and variables → Actions)

| Secret        | Valor                                                        |
| ------------- | ------------------------------------------------------------ |
| `VM_HOST`     | IP público da VM (ou `ouvidoria.fabriciofontenele.com.br`)   |
| `VM_USER`     | usuário do deploy na VM (ex.: `fabricio`)                    |
| `VM_SSH_KEY`  | **chave privada** dedicada ao deploy (conteúdo do arquivo)   |
| `VM_SSH_PORT` | porta do SSH (`22`, ou a porta customizada que você definiu) |

## 2. Preparo da VM (uma vez)

### 2.1 Chave SSH dedicada ao deploy

No seu PC (ou na própria VM), gere um par **só para o CI** — não reutilize sua chave pessoal:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
```

- Conteúdo de `deploy_key` (privada) → secret `VM_SSH_KEY`.
- Conteúdo de `deploy_key.pub` (pública) → adicione ao `~/.ssh/authorized_keys` do `VM_USER` na VM.

### 2.2 Permissões sem senha para o deploy

Para o `deploy.sh` rodar sem prompt interativo:

```bash
# frontend: dono dos arquivos = usuário do deploy (rsync sem sudo)
sudo chown -R "$USER":"$USER" /var/www/ouvidoria

# docker sem sudo
sudo usermod -aG docker "$USER"   # requer relogin

# reiniciar o backend (systemd) sem senha — sudoers escopo mínimo
echo "$USER ALL=(root) NOPASSWD: /bin/systemctl restart ouvidoria-backend" \
  | sudo tee /etc/sudoers.d/ouvidoria-deploy
sudo chmod 440 /etc/sudoers.d/ouvidoria-deploy
```

### 2.3 Pré-condições

- Repositório clonado em `~/projects/Ouvidoria-UESPI` (caminho usado pelo workflow).
- `.env` (raiz) e `ai-api/.env` presentes, `chmod 600`, com os segredos de produção.
  O `.env` da raiz precisa conter `VITE_API_BASE_URL` (origem pública da API; em
  prod, o mesmo domínio do site) — o `deploy.sh` embute esse valor no bundle do
  front em build time e **aborta** se faltar.
- O proxy reverso (Caddy) precisa rotear **todas** as rotas de topo da API para
  `127.0.0.1:3333`: `/health /ready /catalog /me /sessions /users
/email-verification/* /password-reset* /manifestations* /admin/* /ai/*`
  (o backend serve na raiz, sem prefixo). Faltar uma faz aquela chamada cair no
  fallback do SPA e voltar `index.html` em vez de JSON.
- `pnpm`/`corepack`, `docker compose` e `rsync` disponíveis na VM.

## 3. O que o `scripts/deploy.sh` faz

1. `pnpm install --frozen-lockfile`
2. **backend**: `prisma migrate deploy` → `pnpm build` → `systemctl restart ouvidoria-backend`
3. **frontend** (npm, projeto standalone): resolve `VITE_API_BASE_URL` (do ambiente ou do `.env` da raiz, abortando se faltar) → `npm ci && VITE_API_BASE_URL=… npm run build` em `web/` → publica `web/dist/` em `/var/www/ouvidoria`
4. **ai-api**: `docker compose up -d --build ai-api`
5. **smoke test**: `curl /health` (backend) e `/ready` (ai-api) — falha o deploy se algum não responder

> A **re-ingestão do RAG não roda no deploy** (re-embedar custa tempo/$ e a base raramente muda).
> Quando alterar a base de conhecimento, rode na VM: `docker compose exec ai-api pnpm ingest:reset`.

## 4. Rollback

```bash
cd ~/projects/Ouvidoria-UESPI
git reset --hard <sha-anterior>   # ex.: git reset --hard HEAD~1
bash scripts/deploy.sh
```

## 5. Observações

- **Branch protection**: se houver checks obrigatórios configurados, os nomes mudaram para
  `Validar backend`, `Validar ai-api`, `Validar web` — atualize a regra para exigir esses.
- **Verificar o deploy**: a aba **Actions** mostra o job `Deploy (VM)`. Se o `deploy.sh`
  sair com erro (ex.: smoke test falhou), o job fica vermelho.
- **Acompanhar o backend na VM**: `journalctl -u ouvidoria-backend -f | grep '\[ai\]'`.
