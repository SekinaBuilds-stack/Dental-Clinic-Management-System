# Dental Clinic Management System (DCMS)

A professional-grade, multi-tier Dental Clinic Management System built as a monorepo.

## Project Architecture

```text
dcms/
├── backend/          # NestJS API (Node.js / TypeScript / ESM)
├── frontend/         # Vite + React + TypeScript Dashboard
├── infrastructure/   # Docker compose configurations for backing services
├── docs/             # Project documentation and phase guides
└── scripts/          # Automation and helper scripts

## Infrastructure & Backing Services

The backing services run via Docker Compose, providing a persistent development environment for PostgreSQL, Redis, and MinIO object storage.
Prerequisites

    Node.js: v24.14.1 or higher

    Docker & Docker Compose: Installed and running

## Starting Infrastructure

Navigate to the infrastructure directory and spin up the containers:
cd infrastructure\docker
docker compose up -d

## Verifying Container Health

Ensure all backing services (PostgreSQL, Redis, MinIO) are healthy:
docker compose ps

## Getting Started
1. Backend Setup
cd backend
npm install
npm run start:dev
Runs on http://localhost:3000

2. Frontend Setup
cd frontend
npm install
npm run dev
Runs on http://localhost:5173

### Step 2: Save and Commit
Once you've saved the root `README.md`, run your Git checkpoint commit in your terminal:

```powershell
git add .
git commit -m "chore: add docker-compose infrastructure for postgres, redis, and minio"

## Testing

### Prerequisites
- Docker Desktop running
- `backend/.env` and `backend/.env.test` present (`.env.test` points at the test database: `DB_PORT=5433`, `DB_NAME=dcms_test`)

### Run everything (backend)
```powershell
cd backend
npm run test:all
```
This starts the `postgres_test` container, waits until it is healthy, runs the unit and e2e suites, and stops the container. The test database stores its data on tmpfs, so every run starts clean and never touches development data.

### Individual suites
| Suite | Directory | Command |
|---|---|---|
| Backend unit | `backend` | `npm test` |
| Backend unit with coverage | `backend` | `npm run test:cov` |
| Backend integration (e2e) | `backend` | `npm run test:e2e` (needs the test DB up) |
| Frontend component tests | `frontend` | `npm test` |
| Frontend coverage | `frontend` | `npm run test:coverage` |

Start the test database by hand with:
```powershell
cd infrastructure\docker
docker compose up -d postgres_test
```

### Conventions
- Backend unit specs live next to the service (`*.service.spec.ts`) and use mocked repositories and `src/test-utils/mock-query-runner.ts`.
- Backend e2e specs are in `backend/test/*.e2e-spec.ts` and use Supertest against the real app and the test DB.
- Frontend tests sit next to components (`*.test.tsx`) and mock `axios` / `fetch`.
- `test/e2e-uat-simulation.e2e-spec.ts` is disabled until the Day 23 UAT rebuild.

### Troubleshooting
- `password authentication failed`: `.env.test` credentials must match the `postgres_test` service in `docker-compose.yml`.
- `no configuration file provided`: run `docker compose` from `infrastructure\docker`.
- Hook timeouts in e2e: the database is not up or not healthy yet; check `docker ps`.
