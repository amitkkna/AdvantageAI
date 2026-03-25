# AdVantage AI on Google Cloud

This repo is set up to run on:

- `Cloud Run` for `advantage-backend`
- `Cloud Run` for `advantage-web`
- `Cloud SQL for PostgreSQL` for the database
- `Secret Manager` for secrets
- `Cloud Build` for CI/CD
- optional `Memorystore (Redis)` for cache

## What Was Prepared In This Repo

- [cloudbuild.yaml](./cloudbuild.yaml) now deploys the backend first, reads the backend Cloud Run URL automatically, then builds and deploys the web app with the correct `NEXT_PUBLIC_API_URL`.
- [backend/Dockerfile](./backend/Dockerfile) now uses a more reliable workspace runtime image for Cloud Run and Cloud Run Jobs.
- [packages/shared/package.json](./packages/shared/package.json) now points runtime imports at built JS in `dist`.
- [.gcloudignore](./.gcloudignore) excludes local junk from Cloud Build uploads.

## Important Production Notes

1. File uploads are still local-disk by default unless S3 credentials are configured.
   Cloud Run storage is ephemeral, so for production you should use the existing S3 upload flow in [backend/src/routes/upload.ts](./backend/src/routes/upload.ts).

2. Redis is optional.
   If you do not want Memorystore, leave `_REDIS_URL` empty in Cloud Build. The backend now runs without cache when `REDIS_URL` is unset.

3. The web app currently builds with `typescript.ignoreBuildErrors = true` in [web/next.config.js](./web/next.config.js).
   That is acceptable for deployment, but you should clean up the remaining UI typing issues later.

## Step 1: Set Your Project

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Step 2: Enable APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com
```

Optional if you want Redis:

```bash
gcloud services enable redis.googleapis.com
```

## Step 3: Create Cloud SQL

```bash
gcloud sql instances create advantage-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-south1 \
  --storage-size=10GB \
  --storage-auto-increase

gcloud sql users create advantage \
  --instance=advantage-db \
  --password=YOUR_DB_PASSWORD

gcloud sql databases create advantage_db \
  --instance=advantage-db
```

Get the instance connection name:

```bash
gcloud sql instances describe advantage-db \
  --format='value(connectionName)'
```

Expected format:

```text
YOUR_PROJECT_ID:asia-south1:advantage-db
```

## Step 4: Create Secrets

Database URL:

```bash
echo -n "postgresql://advantage:YOUR_DB_PASSWORD@/advantage_db?host=/cloudsql/YOUR_PROJECT_ID:asia-south1:advantage-db" | \
  gcloud secrets create advantage-database-url --data-file=-
```

JWT secrets:

```bash
openssl rand -base64 48 | gcloud secrets create advantage-jwt-secret --data-file=-
openssl rand -base64 48 | gcloud secrets create advantage-jwt-refresh-secret --data-file=-
```

API keys:

```bash
echo -n "your-anthropic-api-key" | \
  gcloud secrets create advantage-anthropic-key --data-file=-

echo -n "your-google-maps-api-key" | \
  gcloud secrets create advantage-google-maps-key --data-file=-
```

## Step 5: Optional Redis

If you want Redis:

```bash
gcloud redis instances create advantage-redis \
  --size=1 \
  --region=asia-south1 \
  --redis-version=redis_7_0 \
  --tier=basic

gcloud redis instances describe advantage-redis \
  --region=asia-south1 \
  --format='value(host)'
```

Use the resulting host to form:

```text
redis://REDIS_IP:6379
```

If you do not want Redis, skip Memorystore and keep `_REDIS_URL` empty in Cloud Build.

## Step 6: Grant IAM Permissions

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
```

Cloud Run service account access:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

Cloud Build deployment access:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

## Step 7: First Deploy With Cloud Build

From the repo root, run:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_REGION=asia-south1,_CLOUD_SQL_INSTANCE=YOUR_PROJECT_ID:asia-south1:advantage-db,_WEB_ORIGINS=https://YOUR_WEB_DOMAIN_OR_LEAVE_EMPTY,_REDIS_URL=redis://REDIS_IP:6379,_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
```

If you are not using Redis:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_REGION=asia-south1,_CLOUD_SQL_INSTANCE=YOUR_PROJECT_ID:asia-south1:advantage-db,_WEB_ORIGINS=https://YOUR_WEB_DOMAIN_OR_LEAVE_EMPTY,_REDIS_URL=,_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
```

What this pipeline does:

1. Builds and pushes the backend image
2. Runs `prisma migrate deploy` as a Cloud Run Job
3. Deploys the backend service
4. Reads the live backend URL
5. Builds the web image with `NEXT_PUBLIC_API_URL=<backend-url>/api`
6. Deploys the web service

## Step 8: Get URLs

Backend:

```bash
gcloud run services describe advantage-backend \
  --region asia-south1 \
  --format='value(status.url)'
```

Web:

```bash
gcloud run services describe advantage-web \
  --region asia-south1 \
  --format='value(status.url)'
```

## Step 9: Create CI/CD Trigger

In Cloud Build, create a GitHub trigger for branch `main` using [cloudbuild.yaml](./cloudbuild.yaml).

Use these substitutions:

- `_REGION=asia-south1`
- `_CLOUD_SQL_INSTANCE=YOUR_PROJECT_ID:asia-south1:advantage-db`
- `_WEB_ORIGINS=https://your-web-domain-or-cloud-run-url`
- `_REDIS_URL=redis://REDIS_IP:6379` or empty
- `_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key`

## Custom Domain

Web:

```bash
gcloud run domain-mappings create \
  --service advantage-web \
  --domain app.yourdomain.com \
  --region asia-south1
```

Backend:

```bash
gcloud run domain-mappings create \
  --service advantage-backend \
  --domain api.yourdomain.com \
  --region asia-south1
```

If you use a custom web domain, update `_WEB_ORIGINS` in Cloud Build to that exact origin.

## Useful Commands

Logs:

```bash
gcloud run services logs read advantage-backend --region asia-south1
gcloud run services logs read advantage-web --region asia-south1
```

Run migrations manually:

```bash
gcloud run jobs execute advantage-migrate --region asia-south1 --wait
```

Update backend allowed web origins:

```bash
gcloud run services update advantage-backend \
  --region asia-south1 \
  --update-env-vars CORS_ORIGINS=https://app.yourdomain.com
```

Scale to zero:

```bash
gcloud run services update advantage-backend --region asia-south1 --min-instances 0
gcloud run services update advantage-web --region asia-south1 --min-instances 0
```
