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
  - API key auth (`x-api-key`)
  - Rate limiting (Redis-backed with in-memory fallback)
- **Multi-stage Dockerfile** optimized for ECS Fargate
- **GitHub Actions CI/CD** pipeline for lint/build + ECR image publish + ECS rollout

## External API endpoints

- `GET /api/v1/external/health`
- `POST /api/v1/external/media/presign`
- `POST /api/v1/external/notifications`
- `POST /api/v1/external/realtime/publish`

All endpoints require:

- Header: `x-api-key: <api key>`
- Optional header for per-client rate bucket: `x-client-id`

## Local setup

```bash
cp .env.example .env.local
npm install
npm run lint
npm run build
```

## Drizzle commands

```bash
npm run db:generate
npm run db:push
npm run db:studio
```
