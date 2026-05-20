FROM node:22-alpine

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ai-api/package.json ./ai-api/
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3333

CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm dev"]
