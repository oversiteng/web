# ==========================================
# Stage 1: Install Dependencies (deps)
# ==========================================
# Use Node.js 20 on lightweight Alpine Linux as the base image for installing dependencies
FROM node:20-alpine AS deps

# Set the working directory inside the container to /app
WORKDIR /app

# Copy dependency definition files to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install exact dependencies listed in package-lock.json cleanly (reproducible build)
RUN npm ci

# ==========================================
# Stage 2: Build Application (builder)
# ==========================================
# Base image for building the Next.js production output
FROM node:20-alpine AS builder

# Set working directory to /app
WORKDIR /app

# Copy node_modules installed in the deps stage to avoid reinstalling
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application source code
COPY . .

# Run the Next.js build step (generates .next/standalone and .next/static)
RUN npm run build

# ==========================================
# Stage 3: Production Runtime (runner)
# ==========================================
# Final minimal image for running the production server
FROM node:20-alpine AS runner

# Set working directory inside container
WORKDIR /app

# Set environment variables for production server configuration
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root system group (nodejs) and user (nextjs) with GID/UID 1001 for security
RUN addgroup --system --gid 1001 nodejs \
  ++++&& adduser --system --uid 1001 nextjs

# Copy static public assets from builder stage
COPY --from=builder /app/public ./public

# Copy standalone server bundle from builder and assign ownership to nextjs user
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy compiled static assets from builder and assign ownership to nextjs user
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch from root user to unprivileged nextjs user for security
USER nextjs

# Document that the container listens on port 3000
EXPOSE 3000

# Container healthcheck: pings http://127.0.0.1:3000/ every 30s using Node.js fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

# Default command to start the Next.js standalone Node server
CMD ["node", "server.js"]
