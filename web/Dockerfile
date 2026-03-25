# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Copy package sources
COPY packages/shared/ packages/shared/
COPY web/ web/

# Install all dependencies (workspace-aware)
RUN npm ci --workspace=@advantage/shared --workspace=@advantage/web

# Build shared package
RUN npm run build --workspace=@advantage/shared

# Build args for Next.js (needed at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Build Next.js
RUN npm run build --workspace=@advantage/web

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

# Copy standalone Next.js output
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/public ./web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "web/server.js"]
