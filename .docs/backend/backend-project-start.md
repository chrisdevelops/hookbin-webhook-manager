You are a **senior backend engineer** scaffolding a **minimal webhook manager backend**.

Your job is to scaffold a **clean, boring, predictable backend** that:

* manages webhook lifecycle
* receives inbound HTTP requests
* stores them
* serves data to a frontend

You must follow the requirements exactly.
Do **not** invent features, validation, or abstractions.

---

## 🧱 Tech Stack (Fixed)

* **Node.js**
* **TypeScript**
* **Express**
* **SQLite** (preferred)
* **Prisma OR Drizzle OR raw SQL** (choose one, keep it simple)

No auth.
No cloud services.
No queues.
No workers.

---

## 🎯 Core Requirements

The backend must support:

1. Webhook CRUD
2. Enable / disable webhooks
3. Catch-all webhook ingestion endpoint
4. Request persistence
5. Pagination
6. Single-request export

---

## 🗂️ Project Structure

Scaffold a clear, conventional structure, for example:

```
src/
  server.ts
  app.ts
  db/
    schema.ts
    client.ts
  routes/
    webhooks.ts
    requests.ts
    ingest.ts
  services/
    webhookService.ts
    requestService.ts
  utils/
    pagination.ts
    retention.ts
```

Do not over-abstract.

---

## 📦 Data Models (Required)

### Webhook

* id (UUID)
* name (string, 3–128 chars)
* description (string, nullable, max 512)
* is_active (boolean)
* created_at
* updated_at

### Request

* id (UUID)
* webhook_id (UUID)
* method
* status_code (integer, nullable)
* headers (JSON)
* body (TEXT)
* content_type
* source_ip
* created_at

Requests are **immutable**.

---

## 🔁 Ingestion Endpoint (CRITICAL)

### Route

```
ANY /webhook/:uuid
```

### Behavior (Must Be Exact)

1. Look up webhook by UUID

2. If webhook **does not exist**:

   * Return:

     ```
     404 Not Found
     ```

3. If webhook **exists but is inactive**:

   * Do NOT store request
   * Return immediately:

     ```
     410 Gone
     ```
   * Optional JSON body:

     ```json
     {
       "error": "webhook_inactive",
       "message": "This webhook is currently inactive."
     }
     ```

4. If webhook **is active**:

   * Accept **any HTTP method**
   * Capture:

     * method
     * headers (raw)
     * body (raw, no parsing assumptions)
     * content-type
     * source IP
     * timestamp
   * Store request
   * Enforce retention (see below)
   * Return fast `2xx` (200 or 204)

Do NOT:

* Validate payloads
* Transform data
* Retry
* Log request bodies

---

## ♻️ Retention Policy

* Rolling window per webhook
* Default: **1,000 requests**
* Oldest requests evicted first
* Enforced at insert time

---

## 🌐 API Endpoints (Internal)

### Webhooks

* `GET /api/webhooks`
* `POST /api/webhooks`
* `PATCH /api/webhooks/:id`
* `DELETE /api/webhooks/:id`
* `POST /api/webhooks/:id/enable`
* `POST /api/webhooks/:id/disable`
* `POST /api/webhooks/:id/clear`

---

### Requests

* `GET /api/webhooks/:id/requests?page=`

  * Page size: **50**
  * Newest first

* `GET /api/requests/:requestId`

* `GET /api/requests/:requestId/export`

  * Returns clean JSON with:

    * headers
    * body
    * metadata
    * status_code
    * timestamps
    * source_ip

---

## 🧠 Pagination Rules

* Fixed page size: 50
* Deterministic ordering
* Offset or cursor is acceptable

---

## 🔐 Security Model

* UUID entropy only
* No auth
* No execution of payloads
* Payloads treated as inert blobs

---

## 🧪 Development Notes

* Seed database with sample webhooks
* Include comments where frontend integration will occur
* Keep logic explicit and readable

---

## 🚫 Explicit Non-Goals

Do NOT implement:

* Auth
* Multi-user support
* Request replay
* Filtering
* Search
* Analytics
* Forwarding
* Validation rules

---

## ✅ Output Expectations

Produce:

1. Working Express server
2. SQLite schema + migrations
3. Ingestion logic with correct status codes
4. CRUD routes
5. Clean, readable TypeScript
6. Minimal comments (only where helpful)

No explanations.
No markdown commentary.
Just the scaffolded backend code.
