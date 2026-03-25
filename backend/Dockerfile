FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY backend/package.json backend/package.json

# Install only the shared + backend workspace dependencies.
RUN npm ci --workspace=@advantage/shared --workspace=@advantage/backend

# Copy sources after dependency install.
COPY packages/shared/ packages/shared/
COPY backend/ backend/

# Generate Prisma client and compile the backend.
RUN cd backend && npx prisma generate
RUN npm run build --workspace=@advantage/shared
RUN npm run build --workspace=@advantage/backend

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Reuse the installed workspace node_modules from the builder to keep runtime behavior identical.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/backend ./backend

# Ensure ephemeral upload directories exist inside the container.
RUN mkdir -p /app/backend/uploads /app/backend/uploads/tmp

WORKDIR /app/backend

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "dist/app.js"]
