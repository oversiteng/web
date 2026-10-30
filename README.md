# Oversite.ng Main Web

Production-ready Next.js (App Router) scaffold for AWS ECS Fargate.

## Included platform foundations

- **Next.js + TypeScript** App Router project configured for standalone output
- **Drizzle ORM** with PostgreSQL schema layout in `/db/schema.ts`
- **AWS modules** for:
  - S3 media upload/download signed URLs (`/lib/aws/s3.ts`)
  - SES outbound email dispatch (`/lib/aws/ses.ts`)
- **Redis real-time bridge** for websocket event fanout (`/lib/realtime/websocketHandlers.ts`)
- **Versioned external API tier** under `/api/v1/external/*` with:
  - API key auth (`bearer token`)
  - Rate limiting (Redis-backed with in-memory fallback)
- **Multi-stage Dockerfile** optimized for ECS Fargate
- Multi-stage Docker image configured for ECS Fargate

## External API endpoints

- `GET /api/v1/external/health`
- `POST /api/v1/external/media/presign`
- `POST /api/v1/external/notifications`
- `POST /api/v1/external/realtime/publish`

All endpoints require:

- Header: `bearer token: <api key>`
- Optional header for per-client rate bucket: `x-client-id`

## Local setup

```bash
npm install
npm run lint
npm run build
```

## Docker

Build and run the production image locally:

```bash
docker build -t oversite-web:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgres://..." \
  -e EXTERNAL_API_KEYS="local-development-key" \
  -e AWS_REGION="us-east-1" \
  -e AWS_S3_MEDIA_BUCKET="your-media-bucket" \
  -e AWS_SES_FROM_EMAIL="noreply@example.com" \
  oversite-web:local
```

The image listens on port `3000`, runs as a non-root user, and uses the Next.js
standalone server. Supply secrets through the ECS task definition or runtime
environment; do not bake them into the image.

## API Documentation & Mobile Integration

- **Exhaustive API Reference Manual:** [`docs/api_documentation.md`](docs/api_documentation.md) (covers all 80+ endpoints with full JSON request & response bodies, status codes, query parameters, and error envelopes)
- **Bruno Collection:** [`bruno-collection/Oversite V2026 Mobile API`](bruno-collection/Oversite%20V2026%20Mobile%20API) (native Bruno `.bru` requests ready to test)

## Drizzle commands

```bash
npm run db:generate
npm run db:push
npm run db:studio
```
