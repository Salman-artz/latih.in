# ==========================================
# latih.in - Production Multi-Stage Dockerfile
# Optimized for Next.js 15 Standalone + Prisma
# ==========================================

# 1. Base stage with Alpine & libc6-compat
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 2. Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy dependency manifests and prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies strictly
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & compile Next.js standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Dummy env for build-time validation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV JWT_SECRET="build-time-dummy-jwt-secret-key-min-48-chars-long"

RUN npx prisma generate
RUN npm run build

# 4. Runner stage (Production Image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Create non-root user & group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and engines for runtime migrations/queries
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
