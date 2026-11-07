# ==========================================
# Stage 1: Install Dependencies (deps)
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# Stage 2: Local Development (Target for Compose)
# ==========================================
FROM deps AS development
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ==========================================
# Stage 3: Build Application (builder)
# ==========================================
FROM deps AS builder
WORKDIR /app
COPY . .
RUN rm -rf .next
ENV DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy"
ENV JWT_SECRET="dummy_secret_for_build"
RUN npm run build

# ==========================================
# Stage 4: Production Runtime (runner)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000

# Container healthcheck: pings http://127.0.0.1:3000/ every 30s using Node.js fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]

