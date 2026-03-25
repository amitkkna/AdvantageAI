# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Copy package sources
COPY packages/shared/ packages/shared/
COPY backend/ backend/

# Install all dependencies (workspace-aware)
RUN npm ci --workspace=@advantage/shared --workspace=@advantage/backend

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build shared package
RUN npm run build --workspace=@advantage/shared

# Build backend
RUN npm run build --workspace=@advantage/backend

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy shared package (built)
COPY --from=builder /app/packages/shared/ packages/shared/

# Copy backend package.json and built files
COPY --from=builder /app/backend/package.json backend/
COPY --from=builder /app/backend/dist/ backend/dist/
COPY --from=builder /app/backend/prisma/ backend/prisma/

# Install production dependencies only
RUN npm ci --workspace=@advantage/shared --workspace=@advantage/backend --omit=dev

# Re-generate Prisma client for production
RUN cd backend && npx prisma generate

# Create uploads directory
RUN mkdir -p backend/uploads

WORKDIR /app/backend

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "dist/app.js"]
