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
