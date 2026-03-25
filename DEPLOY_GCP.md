# AdVantage AI - Google Cloud Deployment Guide

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
2. A GCP project created
3. Billing enabled on the project
4. Docker installed locally (for testing)

## Step 1: Initial GCP Setup

```bash
# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com
```

## Step 2: Create Cloud SQL (PostgreSQL with PostGIS)

```bash
# Create PostgreSQL instance (db-f1-micro = cheapest, ~$8/mo)
gcloud sql instances create advantage-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-south1 \
  --storage-size=10GB \
  --storage-auto-increase

# Set password
gcloud sql users set-password postgres \
  --instance=advantage-db \
  --password=YOUR_STRONG_PASSWORD

# Create database user
gcloud sql users create advantage \
  --instance=advantage-db \
  --password=YOUR_STRONG_PASSWORD

# Create database
gcloud sql databases create advantage_db \
  --instance=advantage-db

# Enable PostGIS (connect via Cloud SQL proxy or console)
# Run this SQL: CREATE EXTENSION IF NOT EXISTS postgis;

# Get connection name (you'll need this)
gcloud sql instances describe advantage-db --format='value(connectionName)'
# Output: YOUR_PROJECT_ID:asia-south1:advantage-db
```

## Step 3: Create Memorystore (Redis)

```bash
# Create Redis instance (1GB basic = ~$35/mo)
gcloud redis instances create advantage-redis \
  --size=1 \
  --region=asia-south1 \
  --redis-version=redis_7_0 \
  --tier=basic

# Get the IP address
gcloud redis instances describe advantage-redis \
  --region=asia-south1 \
  --format='value(host)'
```

> **Cost-saving alternative**: Skip Memorystore and use in-memory caching in the backend. This saves ~$35/mo but loses cache persistence across restarts.

## Step 4: Store Secrets in Secret Manager

```bash
# Database URL (use Cloud SQL socket path)
echo -n "postgresql://advantage:YOUR_PASSWORD@/advantage_db?host=/cloudsql/YOUR_PROJECT_ID:asia-south1:advantage-db" | \
  gcloud secrets create advantage-database-url --data-file=-

# Redis URL
echo -n "redis://REDIS_IP:6379" | \
  gcloud secrets create advantage-redis-url --data-file=-

# JWT Secrets (generate strong ones!)
openssl rand -base64 48 | \
  gcloud secrets create advantage-jwt-secret --data-file=-

openssl rand -base64 48 | \
  gcloud secrets create advantage-jwt-refresh-secret --data-file=-

# API Keys
echo -n "your-anthropic-api-key" | \
  gcloud secrets create advantage-anthropic-key --data-file=-

echo -n "your-google-maps-api-key" | \
  gcloud secrets create advantage-google-maps-key --data-file=-
```

## Step 5: Grant Permissions

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# Grant Cloud Run access to secrets
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant Cloud Run access to Cloud SQL
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant Cloud Build permission to deploy to Cloud Run
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

## Step 6: Build & Deploy (Manual First Time)

```bash
# From the project root directory:

# Build and push backend image
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/advantage-backend \
  -f backend/Dockerfile .

# Build and push web image
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/advantage-web \
  --build-arg NEXT_PUBLIC_API_URL=https://advantage-backend-XXXXX-el.a.run.app \
  -f web/Dockerfile .

# Deploy backend to Cloud Run
gcloud run deploy advantage-backend \
  --image gcr.io/YOUR_PROJECT_ID/advantage-backend \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 5000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-secrets "DATABASE_URL=advantage-database-url:latest,REDIS_URL=advantage-redis-url:latest,JWT_SECRET=advantage-jwt-secret:latest,JWT_REFRESH_SECRET=advantage-jwt-refresh-secret:latest,ANTHROPIC_API_KEY=advantage-anthropic-key:latest,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=advantage-google-maps-key:latest" \
  --set-env-vars "NODE_ENV=production,PORT=5000,CORS_ORIGINS=https://advantage-web-XXXXX-el.a.run.app" \
  --add-cloudsql-instances YOUR_PROJECT_ID:asia-south1:advantage-db

# Get the backend URL
gcloud run services describe advantage-backend \
  --region asia-south1 \
  --format='value(status.url)'

# Now rebuild web with the actual backend URL, then deploy:
gcloud run deploy advantage-web \
  --image gcr.io/YOUR_PROJECT_ID/advantage-web \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "NODE_ENV=production"
```

## Step 7: Run Database Migrations & Seed

```bash
# Use Cloud SQL Auth Proxy locally to run migrations
# Install: https://cloud.google.com/sql/docs/postgres/connect-auth-proxy

# Start proxy (in another terminal)
cloud-sql-proxy YOUR_PROJECT_ID:asia-south1:advantage-db --port=5433

# Run migrations
DATABASE_URL="postgresql://advantage:YOUR_PASSWORD@localhost:5433/advantage_db" \
  npx prisma migrate deploy --schema=backend/prisma/schema.prisma

# Seed (optional - for demo data)
DATABASE_URL="postgresql://advantage:YOUR_PASSWORD@localhost:5433/advantage_db" \
  npm run db:seed
```

## Step 8: Set Up CI/CD (Optional)

```bash
# Connect your GitHub repo to Cloud Build
# Go to: https://console.cloud.google.com/cloud-build/triggers

# Create a trigger:
# - Source: your GitHub repo
# - Branch: main
# - Config: cloudbuild.yaml
# - Substitution variables:
#   _REGION=asia-south1
#   _API_URL=https://advantage-backend-XXXXX-el.a.run.app
#   _GOOGLE_MAPS_API_KEY=(your key)
#   _CLOUD_SQL_INSTANCE=YOUR_PROJECT_ID:asia-south1:advantage-db
```

## Step 9: Custom Domain (Optional)

```bash
# Map a custom domain to Cloud Run
gcloud run domain-mappings create \
  --service advantage-web \
  --domain app.yourdomain.com \
  --region asia-south1

gcloud run domain-mappings create \
  --service advantage-backend \
  --domain api.yourdomain.com \
  --region asia-south1

# Follow DNS instructions from the output
```

## Estimated Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| Cloud Run (backend) | 512Mi, 0-3 instances | ~$5-10 |
| Cloud Run (web) | 512Mi, 0-3 instances | ~$5-10 |
| Cloud SQL (PostgreSQL) | db-f1-micro, 10GB | ~$8-10 |
| Memorystore (Redis) | 1GB basic | ~$35 |
| Container Registry | Storage | ~$1-2 |
| **Total** | | **~$55-67/mo** |

> Cloud Run has a generous free tier: 2M requests/mo, 360K vCPU-seconds, 180K GiB-seconds free.

## Useful Commands

```bash
# View logs
gcloud run services logs read advantage-backend --region asia-south1
gcloud run services logs read advantage-web --region asia-south1

# View service status
gcloud run services describe advantage-backend --region asia-south1
gcloud run services describe advantage-web --region asia-south1

# Update environment variable
gcloud run services update advantage-backend \
  --region asia-south1 \
  --update-env-vars "KEY=VALUE"

# Scale to zero (cost savings when idle)
gcloud run services update advantage-backend \
  --region asia-south1 \
  --min-instances 0
```
