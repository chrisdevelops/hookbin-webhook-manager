# CLAUDE.md

## Minimal Webhook Manager — Persistent Project Context

---

## 1. Project Overview

This repository contains a **minimal webhook manager** built as a **single-user, local-first application**.

The system allows a user to:

* Create and manage webhook endpoints
* Receive inbound HTTP requests
* Inspect request history and full request details
* Persist data locally across sessions

The project prioritizes:

* Simplicity over feature breadth
* Clear separation of concerns
* Minimal, calm UI
* Predictable backend behavior
* Explicit contracts between frontend and backend

Enterprise features, authentication, transformations, forwarding, analytics, and collaboration are **intentionally out of scope**.

---

## 2. Monorepo Structure (Canonical)

This repository is a **single monorepo** managed with **NPM workspaces**.

```
/
├─ package.json        # root workspace config
├─ CLAUDE.md           # this file (persistent AI context)
├─ prd/
│  ├─ frontend-prd.md
│  └─ backend-prd.md
└─ packages/
   ├─ shared/
   │  ├─ package.json
   │  └─ src/
   ├─ frontend/
   │  ├─ package.json
   │  └─ src/
   └─ backend/
      ├─ package.json
      └─ src/
```

### Global Rules

* Frontend, backend, and shared code live in **separate packages**
* Shared code is imported as a dependency, never copied
* No direct source imports between frontend and backend
* Frontend ↔ backend communication happens **only via HTTP APIs**

---

## 3. Tech Stack (Authoritative)

### Frontend

* Vite
* React
* TypeScript
* Tailwind CSS
* **ShadCN UI**
* Client-side routing (React Router or equivalent)

### Backend

* Node.js
* TypeScript
* Express
* SQLite (local-first)
* Simple ORM or SQL layer (Prisma, Drizzle, or raw SQL)

### Shared

* TypeScript only
* No runtime dependencies
* No framework-specific code

---

## 4. ShadCN Usage Rule (Critical)

**ShadCN components must always be the first choice.**

When building UI:

1. Use an existing ShadCN component if one exists
2. Compose ShadCN primitives before creating custom components
3. Only create custom components if:

   * No ShadCN equivalent exists, **and**
   * The behavior cannot be achieved via composition

Custom components must:

* Match ShadCN styling conventions
* Use the same design tokens
* Avoid introducing new visual language

Do **not** recreate components that ShadCN already provides.

---

## 5. Workspace Responsibilities

### Root (`/`)

* Defines NPM workspaces
* Manages shared tooling
* Contains persistent documentation
* Contains **no application logic**

---

### Shared (`/packages/shared`)

The `shared` package contains **declarative contracts only**.

It exists to prevent drift between frontend and backend.

#### Allowed in `shared`

* TypeScript interfaces and types
* API response shapes
* Error payload formats
* HTTP status constants
* Route constants (light use only)

#### Not Allowed in `shared`

* Business logic
* Runtime behavior
* Helpers with side effects
* Framework-specific code
* Database schemas
* Express middleware
* React components or hooks

**Rule of thumb:**
If it *does something*, it does not belong in `shared`.

#### Recommended Structure

```
packages/shared/src/
  types/
    webhook.ts
    request.ts
    requestExport.ts
    errors.ts
  constants/
    http.ts
    routes.ts
  index.ts
```

---

### Frontend (`/packages/frontend`)

Responsibilities:

* UI rendering
* Navigation and routing
* State management
* User interactions
* Visual feedback
* Copy and microcopy

Frontend must:

* Follow `frontend-prd.md`
* Consume backend APIs as defined
* Import shared types instead of redefining them

Frontend must **not**:

* Implement backend logic
* Assume persistence rules
* Invent API behavior not defined in the backend PRD

---

### Backend (`/packages/backend`)

Responsibilities:

* Webhook lifecycle management
* Inbound request ingestion
* Persistence
* Pagination
* Single-request export

Backend must:

* Follow `backend-prd.md`
* Return explicit HTTP status codes
* Treat all payloads as inert blobs

Backend must **not**:

* Validate payloads
* Transform data
* Execute payloads
* Add authentication
* Add business logic beyond the PRD

---

## 6. PRD Authority & When to Read What

### Frontend PRD

**Path:**

```
/prd/frontend-prd.md
```

Defines:

* Layout and navigation
* Sidebar behavior
* Inline editing rules
* Pagination UX
* Keyboard shortcuts
* Visual tone and copy

👉 **Read this before making any UI changes.**

---

### Backend PRD

**Path:**

```
/prd/backend-prd.md
```

Defines:

* Data models
* API routes
* Request ingestion behavior
* Status codes
* Retention policy
* Export format

👉 **Read this before making any backend changes.**

---

## 7. Cross-Cutting Contracts (Must Stay in Sync)

### Inactive Webhooks

* Backend returns **HTTP 410 Gone**
* No request is stored
* Frontend copy reflects:

  * “Webhook inactive”
  * “The webhook exists but is currently disabled”

---

### Request Handling

* All HTTP methods accepted
* All headers accepted
* All bodies accepted
* Requests are immutable once stored

---

### Pagination

* Fixed page size: **50**
* Newest requests first
* Deterministic ordering

---

### Retention

* Rolling window per webhook
* Default: **1,000 requests**
* Oldest requests evicted automatically
* Manual clear available

---

## 8. Development Philosophy (AI Guidance)

When acting as an AI agent on this repository:

* Prefer clarity over cleverness
* Do not invent features
* Do not introduce abstractions without need
* Follow PRDs exactly
* Leave TODOs instead of guessing
* Keep code boring, explicit, and readable

If something is not defined:

* Stop
* Ask for clarification
* Do not assume

---

## 9. Global Non-Goals

These are explicitly out of scope for the entire repository:

* Authentication
* Multi-user support
* Collaboration
* Webhook forwarding
* Payload transformation
* Retry logic
* Analytics
* Filtering or search
* Bulk exports

---

## 10. Canonical Intent

This project should feel:

* Calm
* Minimal
* Uncluttered
* Predictable
* Developer-friendly

If a change increases cognitive load or complexity, it is likely incorrect.

---

**End of persistent AI context.**
