# 📘 Backend Product Requirements Document (PRD)

## Minimal Webhook Manager — Backend

---

## 1. Purpose & Scope

The backend exists to do **exactly three things**:

1. Manage webhook lifecycle (create, enable, disable, delete)
2. Receive and persist incoming HTTP requests
3. Serve stored webhook and request data to the frontend

It is **not** responsible for:

* Business logic
* Transformations
* Forwarding
* Authentication (v1)
* Retry logic
* Analytics
* Webhook validation

---

## 2. Guiding Principles

* **Accept everything**
* **Store raw data**
* **Respond quickly**
* **Fail silently when inactive**
* **Never interpret payloads**

---

## 3. Architecture Overview

### Service Type

* Single backend service
* Stateless HTTP API
* Persistent database

### Request Flow

```
Client → /webhook/{uuid} → Router → Storage → 2xx
```

If webhook is inactive:

```
Client → /webhook/{uuid} → No handler → Timeout
```

---

## 4. Core Domain Objects

### 4.1 Webhook

Represents a single endpoint capable of receiving requests.

Fields:

* `id` (UUID, primary key)
* `name` (string, required, 3–128 chars)
* `description` (string, optional, max 512 chars)
* `is_active` (boolean)
* `created_at`
* `updated_at`

Derived (not persisted):

* `has_unread_requests`
* `last_request_at`

---

### 4.2 Request (Webhook Request)

Represents a single inbound HTTP request.

Fields:

* `id` (UUID)
* `webhook_id` (UUID, FK)
* `method` (string)
* `status_code` (integer, client-side)
* `headers` (JSON)
* `body` (TEXT / JSON)
* `content_type` (string)
* `source_ip` (string)
* `created_at`

Requests are **immutable** once stored.

---

## 5. Webhook Lifecycle Behavior

### 5.1 Creation

* Backend generates UUID
* Webhook starts as **active**
* Returns:

  * ID
  * Full webhook URL

---

### 5.2 Activation / Deactivation

**Active**

* Requests accepted and stored

**Inactive**

* Requests are explicitly rejected
* Backend returns 410 Gone
* No request storage
* No unread counts change
* No resource scaling implications

This is a hard requirement.

---

### 5.3 Deletion

* Deletes webhook record
* Deletes all associated requests
* Requires explicit confirmation from frontend

---

### 5.4 Clear History

* Deletes all requests for webhook
* Webhook remains intact

---

## 6. Incoming Webhook Handling

### Endpoint

```
ANY /webhook/{uuid}
```

### Behavior

**If webhook is ACTIVE:**

* Accept all HTTP methods
* Accept all headers
* Accept any body
* Persist request
* Return fast `2xx`

**If webhook is INACTIVE:**

* Do **not** persist request
* Immediately return:

  ```
  HTTP 410 Gone
  ```
* Optional minimal response body:

  ```json
  {
    "error": "webhook_inactive",
    "message": "This webhook is currently inactive."
  }
  ```
* No retries
* No side effects

**If webhook UUID does not exist:**

* Return:

  ```
  HTTP 404 Not Found
  ```

---

## 7. Status Code Capture

The backend must attempt to capture the **client-intended status code** where possible.

If not directly available:

* Fallback to inferred status
* Or store `null`

Frontend will display this value.

---

## 8. Retention Policy

### Rolling Window

* Default: **1,000 requests per webhook**
* Configurable globally

### Eviction

* Oldest requests evicted first
* Eviction happens at insert time

---

## 9. Export (Single Request)

### Endpoint

```
GET /api/requests/{requestId}/export
```

### Format

JSON document containing:

* Headers
* Body
* Metadata
* Status code
* Timestamp
* Source IP

No bulk exports.

---

## 10. API Surface (Internal)

### Webhooks

* `GET /api/webhooks`
* `POST /api/webhooks`
* `PATCH /api/webhooks/{id}`
* `DELETE /api/webhooks/{id}`
* `POST /api/webhooks/{id}/enable`
* `POST /api/webhooks/{id}/disable`
* `POST /api/webhooks/{id}/clear`

---

### Requests

* `GET /api/webhooks/{id}/requests?page=`
* `GET /api/requests/{requestId}`
* `GET /api/requests/{requestId}/export`

---

## 11. Pagination Rules

* Fixed page size: **50**
* Deterministic ordering (newest first)
* Cursor or offset-based acceptable

---

## 12. Performance Constraints

* Must handle burst traffic
* Writes prioritized over reads
* UI fetches are secondary
* No request-level locks

---

## 13. Persistence

### Preferred

* Local-first database (SQLite)

### Acceptable

* PostgreSQL
* Any relational DB

---

## 14. Security (Baseline)

* UUID entropy is sole protection
* No auth
* No request execution
* No deserialization risks
* Payloads treated as inert blobs

---

## 15. Observability (Minimal)

* Log webhook creation
* Log request ingestion errors
* No request content logging

---

## 16. Explicit Non-Goals

* Auth
* Multi-user
* Sharing
* Request replay
* Filtering
* Search
* Analytics
* Webhook forwarding

---

## 17. Backend Contract Guarantees

The backend guarantees:

* Active webhooks → accept + store requests
* Inactive webhooks → explicit 410 response
* Nonexistent webhooks → 404
* No silent failures
* No timeouts for known inactive resources

---

## 18. Philosophy (Backend)

> If the backend ever “feels clever,” it’s wrong.

It should be:

* Predictable
* Dumb
* Fast
* Invisible
