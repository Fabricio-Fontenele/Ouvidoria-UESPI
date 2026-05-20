FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ai-api/package.json ./ai-api/
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

COPY ai-api ./ai-api

WORKDIR /app/ai-api

EXPOSE 4000

CMD ["pnpm", "dev"]
