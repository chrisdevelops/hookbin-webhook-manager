You are a **senior frontend engineer** scaffolding a **minimal webhook manager UI**.

Your task is to **scaffold the frontend only** using **dummy placeholder data** (no backend integration yet).

You must follow the requirements exactly.
Do **not** invent features, settings, or flows not explicitly described.

---

## 🧱 Tech Stack (Fixed)

* **Vite**
* **React**
* **TypeScript**
* **ShadCN UI**
* **Tailwind CSS**
* **React Router** (or equivalent client-side routing)

Use **ShadCN components wherever possible**.
Only create custom components when absolutely necessary.

---

## 🎯 Goal

Scaffold a **calm, minimalist, uncluttered UI** for a webhook manager that supports:

* Sidebar with webhooks
* Webhook request list
* Request detail drill-down page
* Inline editing for webhook name & description
* Pagination
* Live-update simulation (mocked)
* Keyboard navigation (basic)

No backend.
No real persistence.
Use **mock data only**.

---

## 🗂️ Pages & Routes

Implement the following routes:

1. `/`

   * Empty state or “Select a webhook” message

2. `/webhooks/:webhookId`

   * Webhook request list page

3. `/webhooks/:webhookId/requests/:requestId`

   * Request detail page (full-page drill down)

Use **breadcrumbs** for navigation:

```
Webhooks > {Webhook Name} > Request
```

---

## 📐 Layout Requirements

### Global Layout

* Left: **Toggleable sidebar**
* Right: **Main content area**
* Sidebar toggle similar to ChatGPT’s sidebar
* Sidebar defaults to **open on load**

---

## 📁 Sidebar (Webhook List)

Each webhook list item must display:

* **Webhook name** (primary)
* **Subtle secondary text**:

  * UUID or shortened URL
* **Copy button**

  * Copies full webhook URL
  * Shows short toast confirmation (~1s)
* **Status indicator (right aligned)**:

  * 🟢 Active, no unread
  * 🟡 Active, unread requests
  * 🔴 Inactive
* **Last request timestamp** (subtle)

### Sorting Rules

Order webhooks by:

1. Active + unread (yellow)
2. Active (green)
3. Inactive (red)

Within each group: newest first.

---

## 🧠 Unread Logic (Frontend Only)

* Each webhook has `hasUnread: boolean`
* When user navigates to `/webhooks/:id`, mark webhook as read
* No per-request read state
* No “mark all read” button

---

## 🧩 Sidebar Footer

* User avatar + username
* Clicking opens a small menu:

  * Settings
  * Log out

No functionality needed.

---

## 🧾 Webhook Page (`/webhooks/:webhookId`)

### Header Section

Display:

* Webhook name (inline editable)
* Webhook description (inline editable)
* Full webhook URL (read-only)
* Status indicator
* Ellipsis menu with:

  * Enable / Disable
  * Clear request history
  * Delete webhook (simple confirm dialog)

### Inline Editing Rules

* Save on blur
* Name:

  * Required
  * 3–128 chars
* Description:

  * Optional
  * Max 512 chars
  * Multiline
* Invalid input reverts

---

## 📜 Request List

* Paginated list (50 per page)
* Pagination controls visible

Each request row shows:

* HTTP method
* Client-side status code
* Source IP or referrer
* Timestamp
* Content-Type

Simulate **live updates**:

* New mock requests appear after a timeout
* Push into list automatically

---

## 📄 Request Detail Page

`/webhooks/:webhookId/requests/:requestId`

### Layout

* Full page (not modal, not accordion)
* Breadcrumb navigation
* Keyboard navigation:

  * `←` previous request
  * `→` next request

### Sections

#### Metadata

* Request ID
* Webhook ID
* Timestamp
* HTTP method
* Status code
* Content-Type
* Source IP / referrer

#### Headers

* Key/value list
* Monospace
* Copy button copies raw JSON

#### Body

* Pretty-print JSON if JSON
* Raw text otherwise
* Copy button copies raw body
* Monospace font

### Large Payload Handling (Mocked)

* If body length exceeds threshold:

  * Show truncated preview
  * “View full” button
* If exceeds hard cap:

  * Do not render body
  * Show message + Copy / Download buttons

---

## 🎨 Visual & UX Constraints

* Calm, minimalist aesthetic
* Generous whitespace
* No visual clutter
* Subtle text hierarchy
* Monospace only for:

  * Headers
  * Bodies
* No heavy borders
* No excessive badges

---

## 📦 Data (Mock Only)

Create mock data for:

* Webhooks
* Requests
* Status indicators
* Pagination

Data should live in a single mock module for easy replacement later.

---

## 🚫 Explicit Non-Goals

Do NOT implement:

* Backend calls
* Real persistence
* Auth logic
* Request replay
* Transforms
* Filtering
* Search
* Bulk actions

---

## ✅ Output Expectations

Claude should:

1. Scaffold the project structure
2. Create routes and pages
3. Implement components using ShadCN
4. Wire mock data
5. Leave TODO comments where backend integration will occur

No explanations.
No commentary.
Just clean, readable code scaffolding.
