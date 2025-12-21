# 📘 Product Requirements Document (PRD)

## Minimal Webhook Manager (Local-First, Single-User)

---

## 1. Product Overview

### Purpose

A **lightweight, minimalist webhook manager** for developers to:

* Create webhook endpoints
* Receive and inspect incoming HTTP requests
* View request history and full request details
* Persist data locally across sessions

The product intentionally avoids advanced or enterprise features to stay **fast, readable, and low-friction**.

---

## 2. Core Principles (Non-Negotiable)

* **Minimal UI, maximal clarity**
* **Fast navigation**
* **No hidden complexity**
* **No unnecessary configuration**
* **Content-first layout**
* **Separate pages over accordions**

---

## 3. Application Layout

```
┌───────────────┬────────────────────────────────────┐
│ Sidebar       │ Main Content                        │
│ (Toggleable)  │                                    │
│               │ Webhook Requests / Request Details │
└───────────────┴────────────────────────────────────┘
```

---

## 4. Sidebar (Webhook List)

### 4.1 Behavior

* Global toggle (hamburger-style)
* Defaults to **open on app load**
* Does not persist collapsed state

---

### 4.2 Webhook List Item Contents

Each webhook entry displays:

* **Webhook Name** (primary)

* **Subtle secondary text**:

  * UUID or shortened URL

* **Copy button**

  * Copies **full webhook URL**
  * Shows brief toast confirmation (~1s)

* **Status indicator (right-aligned)**:

  * 🟢 Green → Active, no unread requests
  * 🟡 Yellow → Active, has unread requests
  * 🔴 Red → Inactive

* **Last request timestamp**

  * Subtle text
  * Hidden if no requests yet

---

### 4.3 Sorting Rules

Default order:

1. **Yellow (active + unread)** — most recently created first
2. **Green (active)** — most recently created first
3. **Red (inactive)** — most recently created first

---

### 4.4 Unread Logic

* A webhook is considered **read** when:

  * The user clicks the webhook and views its request list
* No per-request read tracking
* No “mark all read” button (intentionally omitted)

---

### 4.5 Sidebar Footer

* User avatar + username
* Clicking opens a small menu:

  * Settings
  * Log out

*(Single-user app for now; this is future-proofing UI, not functionality)*

---

## 5. Webhook State & Lifecycle

### 5.1 Active Webhooks

* Actively listen for incoming requests
* Requests are stored and surfaced live

### 5.2 Inactive Webhooks

* **Do not listen**
* No HTTP handler registered
* Requests to inactive endpoints:

  * Receive **no response** (timeout / no listener)
* Existing request history remains viewable
* Inactive status always shows 🔴, even if unread requests exist

---

## 6. Main Content — Webhook View

When a webhook is selected:

### 6.1 Header Section

Displays:

* Webhook name (inline editable)
* Webhook description (inline editable)
* Full webhook URL (read-only)
* Status indicator
* Ellipsis menu (top-right)

---

### 6.2 Inline Editing Rules

**Name**

* Required
* Min: 3 characters
* Max: 128 characters
* Save on blur
* Revert on invalid input

**Description**

* Optional
* Max: 512 characters
* Multiline
* Save on blur

No drafts. No save button.

---

### 6.3 Webhook Actions (Ellipsis Menu)

* Enable / Disable webhook
* Clear request history
* Delete webhook

**Delete behavior**

* Simple confirmation dialog
* Deletes webhook + all associated requests

---

## 7. Request List (Webhook Requests Page)

### 7.1 Layout

* Vertical list (table or card-style)
* Paginated (50 requests per page)

### 7.2 Each Request Row Displays

* HTTP method
* Client-side status code
* Source IP or referring URL
* Timestamp
* Content-Type

---

### 7.3 Live Updates

* New incoming requests appear **live**
* No refresh required
* Unread indicator clears when webhook page is opened

---

## 8. Request Detail View (Drill-Down Page)

This is a **separate page**, not an expansion.

### 8.1 Navigation

* Breadcrumbs:

  ```
  Webhooks > {Webhook Name} > Request
  ```
* Keyboard navigation:

  * `←` Previous request
  * `→` Next request
    *(Common, intuitive, no conflicts)*

---

### 8.2 Request Detail Sections

#### Metadata Panel

* Request ID
* Webhook ID
* Timestamp
* HTTP method
* Client-side status code
* Content-Type
* Source IP / Referrer

#### Headers

* Key/value list
* Monospace
* Copy button (copies raw headers JSON)

#### Body

* Pretty-printed JSON by default (if JSON)
* Raw text otherwise
* Copy button copies **raw body**
* Monospace font

---

### 8.3 Large Payload Handling

Two thresholds:

1. **Truncation point**

   * Shows preview
   * “View full” button expands content
2. **Hard cap**

   * Payload too large to render
   * UI shows:

     * “Payload too large to display”
     * Options:

       * Copy raw body
       * Download body

---

## 9. Persistence & Retention

### 9.1 Storage

* Persistent database
* Local-first preferred
* Cloud fallback acceptable if simpler

---

### 9.2 Retention Policy

* Rolling window per webhook
* Default: **1,000 requests**
* Configurable globally
* Oldest requests evicted automatically
* Manual “Clear history” option available

---

## 10. Export

### In Scope

* Export **single request** as JSON

Export includes:

* Headers
* Body
* Metadata
* Status code
* Timestamp
* Source info

Format should be:

* Clean
* Structured
* Easily ingestible by other tools

### Out of Scope

* Bulk exports
* CSV
* Multi-request bundles

---

## 11. Auth & User Model

* **Single-user**
* No collaboration
* No sharing
* Avatar/menu is cosmetic for now

---

## 12. Visual Design

* Built with **Vite + ShadCN**
* Use ShadCN components wherever possible
* Minimal customization
* Calm, neutral color palette
* Generous whitespace
* Subtle text hierarchy
* Monospace only for:

  * Headers
  * Bodies

No visual clutter. No heavy borders. No excessive badges.

---

---

# 📄 FACTS (Functional & Technical Constraints)

---

## 1. Routing Model

* Single base listener:

  ```
  /webhook/{uuid}
  ```
* UUID routes request to webhook
* Inactive webhooks have **no listener registered**

---

## 2. Data Model (Conceptual)

### Webhook

* id (UUID)
* name
* description
* is_active
* created_at
* updated_at
* unread_count (derived)

### Request

* id (UUID)
* webhook_id
* method
* status_code (client-side)
* headers (JSON)
* body (TEXT / JSON)
* content_type
* source_ip
* created_at

---

## 3. Request Handling Rules

* Accept all HTTP methods
* Accept all headers
* Accept any body
* No validation
* No transformation
* No execution
* Always inert storage

---

## 4. Performance Assumptions

* Burst-friendly
* Optimized for inspection, not throughput guarantees
* One request detail loaded at a time

---

## 5. Philosophy (Immutable)

> Fewer features > more clarity
> Fewer controls > faster understanding
> Separate pages > less cognitive load
