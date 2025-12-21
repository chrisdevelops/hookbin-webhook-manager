# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A minimal, local-first webhook manager for developers to create webhook endpoints, receive HTTP requests, and inspect request history. Single-user, no authentication, intentionally simple.

## Monorepo Structure

```
packages/
  frontend/    # Vite + React + TypeScript + ShadCN UI
  backend/     # Node.js + Express + TypeScript + SQLite (not yet implemented)
  shared/      # TypeScript types and contracts only (not yet implemented)
```

NPM workspaces manage the monorepo. Frontend and backend communicate only via HTTP APIs.

## Development Commands

```bash
npm install              # Install all workspace dependencies from root

# From root directory
npm run dev:frontend     # Start frontend dev server
npm run build:frontend   # TypeScript check + Vite build
npm run lint:frontend    # ESLint frontend

# Or from packages/frontend/
cd packages/frontend
npm run dev
npm run build
npm run lint
npm run preview          # Preview production build
```

## Tech Stack

**Frontend**: Vite, React 19, TypeScript, Tailwind CSS v4, ShadCN UI (base-mira style with Hugeicons)

**Backend (planned)**: Node.js, Express, TypeScript, SQLite, Prisma/Drizzle

## UI Component Rules

1. Use existing ShadCN components first
2. Compose ShadCN primitives before creating custom components
3. Custom components must match ShadCN styling conventions
4. Path alias: `@/` maps to `src/`
5. ShadCN config: `packages/frontend/components.json`

## Architecture Contracts

- Frontend imports shared types, never redefines them
- Backend treats all payloads as inert blobs—no validation, transformation, or execution
- Inactive webhooks return HTTP 410 Gone
- Request pagination: fixed 50 per page, newest first
- Retention: rolling 1,000 requests per webhook

## Detailed PRDs

- Frontend PRD: `.docs/frontend/frontend-prd.md`
- Backend PRD: `.docs/backend/backend-prd.md`
- Full project context: `.docs/CLAUDE.md`

Read the relevant PRD before making changes to frontend or backend.

## Explicit Non-Goals

Authentication, multi-user, collaboration, webhook forwarding, payload transformation, retry logic, analytics, filtering, search, bulk exports.
