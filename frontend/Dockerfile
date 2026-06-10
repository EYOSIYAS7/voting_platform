# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build the standalone application
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time arguments for Next.js env variables (inlined in JS bundles)
ARG NEXT_PUBLIC_CONTRACT_ADDRESS="0x8c0c3B8f93d627519E7C2451e52B834Ae240598a"
ARG NEXT_PUBLIC_BESU_RPC_URL="http://172.27.3.251/rpc"
ARG NEXT_PUBLIC_BESU_WS_URL="ws://172.27.3.251/ws"
ARG NEXT_PUBLIC_BESU_CHAIN_ID="1337"
ARG NEXT_PUBLIC_BESU_CHAIN_NAME="Besu Network"

# Expose them as environment variables during build
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=$NEXT_PUBLIC_CONTRACT_ADDRESS
ENV NEXT_PUBLIC_BESU_RPC_URL=$NEXT_PUBLIC_BESU_RPC_URL
ENV NEXT_PUBLIC_BESU_WS_URL=$NEXT_PUBLIC_BESU_WS_URL
ENV NEXT_PUBLIC_BESU_CHAIN_ID=$NEXT_PUBLIC_BESU_CHAIN_ID
ENV NEXT_PUBLIC_BESU_CHAIN_NAME=$NEXT_PUBLIC_BESU_CHAIN_NAME

RUN pnpm build

# Stage 3: Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and public files
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
