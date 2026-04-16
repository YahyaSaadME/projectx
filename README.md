# Ai Sales Workflow management.s
Demo:-
https://drive.google.com/file/d/1QDOf0n989O-v7LVeKijLzFZwTxE0Lgy-/view?usp=sharing
https://drive.google.com/file/d/1uAIkGtK2_9WkigtPnZcHkh9Fe8yYp26q/view?usp=sharing

## Problem Statement

Build a multi-organization system where admins create one organization, invite members, manage forms, route submissions, and connect Google Mail, Calendar, and Sheets per organization.

## Solution

The app uses OTP-based signup, email/password login, Google OAuth login, role-based organization access, dynamic form workflows, and Google-backed automation for mail, calendar, and sheets.

## Tech Stack

- Next.js 16 / React 19 / TypeScript
- MongoDB + Mongoose
- Redis for caching
- Google OAuth, Gmail API, Calendar API, Sheets API
- JWT auth, bcrypt, Groq agent routing
- Docker + Docker Compose

## Architecture

- MVC-style structure: `app/` handles views and route entry points, `lib/` holds models/services, and `app/api/` acts as the REST controller layer.
- DB connection is a singleton in `web/lib/mongoose.ts` using a shared global connection promise.
- REST APIs are organized under `web/app/api/...` by feature: auth, organizations, members, invites, forms, submissions, stock, reminders, and public forms.
- Error logging uses route-level `console.error` plus API error responses so auth and automation failures can be traced.

## How to Run

Local:

1. Copy `web/.env.example` to `web/.env.local` and set the required values.
2. Run `npm install` inside `web/`.
3. Start the app with `npm run dev`.

Docker:

1. From the repository root, run `docker compose up --build`.
2. Open `http://localhost:3000`.

## Docker CI/CD (Auto Deploy)

This repository now includes GitHub Actions workflow `/.github/workflows/docker-cicd.yml`.

What it does:

1. Validates the app on every pull request and main push (`lint` + `build`).
2. Builds and pushes a Docker image to GHCR on main push.
3. Deploys to your server over SSH by pulling the latest image and recreating only the `web` service.

### Files Added for CI/CD

- `/.github/workflows/docker-cicd.yml`
- `/docker-compose.prod.yml`

`docker-compose.prod.yml` overrides only the web image:

- Uses `WEB_IMAGE` from workflow/server env
- Forces `pull_policy: always`
- Disables local `build` for deployment

### Required GitHub Secrets

Set these in your repository secrets before enabling auto deploy:

- `DEPLOY_HOST`: server host/IP
- `DEPLOY_USER`: SSH user
- `DEPLOY_SSH_KEY`: private SSH key for deploy user
- `DEPLOY_PORT`: optional SSH port (defaults to `22`)
- `DEPLOY_PATH`: path on server where this repo exists (contains `docker-compose.yml`)
- `DEPLOY_REGISTRY_USERNAME`: GHCR username (or service account)
- `DEPLOY_REGISTRY_TOKEN`: GHCR token with package read access on the target package
- `DEPLOY_ENV_FILE_B64`: optional base64-encoded content of `web/.env.local`

If `DEPLOY_ENV_FILE_B64` is set, workflow writes it to `web/.env.local` on the server before deploy.

### Server Prerequisites

- Docker + Docker Compose plugin installed
- Repo cloned on server at `DEPLOY_PATH`
- `docker-compose.yml` and `docker-compose.prod.yml` present in that path

### Why updates were not reflecting

When deployment uses local build context, old containers/images can persist unless pull/recreate is enforced.
The new pipeline fixes this by:

- pushing immutable images to GHCR
- pulling latest image on deploy
- running `docker compose up -d --force-recreate` for the web container

### Manual Deploy Command (same behavior as CI/CD)

From server repo root:

1. `echo "WEB_IMAGE=ghcr.io/<owner>/<repo>-web:latest" > .deploy.env`
2. `docker compose --env-file .deploy.env -f docker-compose.yml -f docker-compose.prod.yml pull web`
3. `docker compose --env-file .deploy.env -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans --force-recreate web`

## Notes

- Passwords and OTP values are hashed before storage.
- Google auth failures are surfaced back to the login page for easier debugging.
- Organization settings provide the primary Google integration config, with env vars as fallbacks.
