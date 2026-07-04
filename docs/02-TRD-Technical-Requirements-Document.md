# Technical Requirements Document (TRD)
## Multi-Niche Offline-First SaaS POS Platform — MERN + Electron

| Field | Value |
|---|---|
| Document Type | Technical Requirements Document |
| Companion Docs | PRD.md, SRD.md, RULES.md |
| Version | 1.0 |
| Status | Draft — Engineering Reference |

---

## 1. System Architecture Overview

The system is composed of four cooperating layers:

1. **Electron Shell** — hosts the React frontend, exposes native OS capabilities (hardware UUID reading, USB printer access, file system, auto-update) via a secured IPC bridge.
2. **React Frontend (Renderer Process)** — the entire user-facing application; owns local reactive state and the offline database.
3. **Local Data Layer (RxDB + Dexie/IndexedDB)** — the single source of truth on the client machine; all UI reads/writes go through here first, online or offline.
4. **Cloud Backend (Node/Express on Vercel + MongoDB Atlas)** — the authoritative multi-tenant cloud store, licensing authority, and sync endpoint.

```
┌─────────────────────────────── Electron App ───────────────────────────────┐
│                                                                              │
│   ┌───────────────── Renderer Process (React + Vite) ─────────────────┐    │
│   │  UI (Shadcn/ui + Tailwind)                                        │    │
│   │  Zustand (client state)  |  TanStack Query (server cache)         │    │
│   │  RxDB (Dexie/IndexedDB) ── Reactive Queries ── Replication Plugin │    │
│   └───────────────────────────────┬────────────────────────────────────┘    │
│                                   │ IPC (chunked)                          │
│   ┌───────────────────────────── Main Process ─────────────────────────┐   │
│   │  Hardware UUID / MAC reader | ESC/POS printer bridge | Auto-Update │   │
│   └───────────────────────────────┬────────────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ HTTPS (push/pull sync, heartbeat)
                    ┌────────────────▼─────────────────┐
                    │   Node/Express API (Vercel)       │
                    │   Controller → Service → Repo     │
                    │   Zod validation, Helmet, CORS    │
                    └────────────────┬──────────────────┘
                                     │
              ┌──────────────────────┼───────────────────────┐
              ▼                      ▼                        ▼
   ┌───────────────────┐  ┌────────────────────┐   ┌──────────────────────┐
   │ Super Admin DB     │  │ Per-Tenant DB(s)    │   │ Cloudinary (media)   │
   │ (MongoDB Atlas)    │  │ (MongoDB Atlas)     │   │                      │
   └───────────────────┘  └────────────────────┘   └──────────────────────┘
```

## 2. Monorepo Structure

```
pos-platform/
├── apps/
│   ├── desktop/            # Electron main + preload processes
│   ├── client/             # React frontend (Vite)
│   └── server/             # Node/Express backend
├── packages/
│   ├── shared-types/       # Shared TS/JS types & Zod schemas (client + server)
│   └── config/             # Shared eslint/prettier/tailwind config
├── docs/                   # PRD, TRD, SRD, RULES
├── package.json            # Workspace root
└── turbo.json / pnpm-workspace.yaml
```

## 3. Technology Stack Summary

| Layer | Technology |
|---|---|
| Desktop Shell | Electron (latest stable) |
| Frontend Build | Vite |
| Frontend Framework | React (latest stable) |
| UI Components | Shadcn/ui (Radix Primitives) + Tailwind CSS |
| Icons | Lucide React (tree-shakable) |
| Client State | Zustand |
| Server-State Cache | TanStack Query (React Query) |
| Local Database | RxDB (Dexie/IndexedDB storage adapter) |
| Local Encryption | RxDB crypto-plugin (AES-256) |
| List Virtualization | react-window |
| Toasts | Sonner |
| Backend Runtime | Node.js (latest LTS) |
| Backend Framework | Express |
| Validation | Zod |
| ORM/ODM | Mongoose |
| Database | MongoDB Atlas |
| Media Storage | Cloudinary |
| Logging | Winston or Pino |
| Security Middleware | Helmet, custom CORS |
| Hosting (API) | Vercel Serverless Functions |
| Printer Protocol | ESC/POS (Node library, Electron main process) |
| Auto-Update | electron-updater + GitHub Releases |

## 4. Frontend Architecture

### 4.1 Build & Bundling
- Vite is the bundler (already adopted). Use strict dynamic `import()` for route-level and heavy-component-level code splitting.
- Route-level and component-level **lazy loading + Suspense** is mandatory so hidden/inactive views never consume startup memory.

### 4.2 UI System
- Shadcn/ui (built on Radix Primitives) + Tailwind CSS for all UI — compiled at build time, minimal runtime JS footprint, keeping the Electron renderer responsive.
- Lucide React exclusively for icons — tree-shaken so only referenced icons enter the bundle.
- No pixel (`px`) units for layout spacing/typography. Use Tailwind spacing scale tokens and **CSS `clamp()`** for fluid, single-line scaling typography/spacing across breakpoints.
- Base styles are written **mobile-first with no responsive prefix**; larger breakpoints are added only as progressive-enhancement prefixes (`md:`, `lg:`, `xl:`).
- Responsive behavior is driven **strictly by Tailwind breakpoints and native CSS Grid/Flexbox** — no JavaScript `resize`/`matchMedia` listeners for layout decisions, keeping layout recalculation on the browser's native engine instead of the JS thread.
- Drawer/menu/modal animations use only GPU-accelerated CSS properties (`transform`, `opacity`) — never animate `width`, `height`, `top`, `left`, etc.

### 4.3 Component Architecture — Atomic + Hybrid Pattern
```
src/
├── components/
│   ├── ui/            # Atoms — Button, Input, Modal, Form primitives (global, reusable everywhere)
│   └── layout/         # Molecules/Organisms — Navbar, Sidebar, AppShell
├── features/
│   ├── gym/            # Local components + logic unique to Gym niche
│   ├── restaurant/      # Local components + logic unique to Restaurant niche
│   ├── garments/        # Local components + logic unique to Garments niche
│   └── billing/         # Shared POS/billing feature logic
├── pages/ (or routes/)  # Route-level composition only — no business logic here
├── hooks/               # Shared custom hooks
├── store/               # Zustand stores (client/UI state)
├── lib/                 # RxDB setup, TanStack Query client, utils
└── App.jsx
```
- **Global components** (`components/ui/`): Buttons, Inputs, Modals, Forms — anything reused across ≥2 features.
- **Local/Feature components**: anything specific to one dashboard/niche (e.g., `UserProfileCard`, `InvoiceGraph`, `MembershipCard`) lives inside its own `features/<name>/components/` folder — never in the global folder.
- This hybrid model keeps bundle size low, dependency mapping explicit, and limits blast-radius of future changes.

### 4.4 State Management
- **Zustand** for all global client/UI state (theme, sidebar open/close, modal visibility, active niche context). No Redux — avoid unnecessary boilerplate and memory overhead.
- **TanStack Query** for all server-state concerns: data fetching, caching, mutations, optimistic updates, pagination cursors, and automatic revalidation/retry on reconnect. No manual `useEffect`-based fetch/cache loops.
- **State colocation principle**: component-local UI state (e.g., a form's current input) stays in local `useState`; only truly cross-cutting state goes to Zustand.

### 4.5 Rendering & Data-Volume Performance
- Any list/grid/table with unbounded or large row counts (inventory, transaction history, member lists) **must** use `react-window` (or equivalent) virtualization so the DOM only mounts the rows in the active viewport.
- Structured logs/reports/admin grids use **server-side, page-indexed pagination** (client sends `page`, `limit`; server executes `.skip()`/`.limit()` in Mongoose).
- Real-time/continuous feeds (activity timelines) use **infinite scroll** driven by the **Intersection Observer API** — never scroll-position polling via JS scroll event handlers.
- All high-frequency input handlers (search-as-you-type, resize-sensitive UI, scroll handlers) apply **debounce or throttle**.

### 4.6 Error Handling & Resilience (Frontend)
- **Route-level Error Boundaries** wrap every top-level route so a rendering exception in one screen never white-screens the entire Electron app.
- All uncaught renderer exceptions are captured and forwarded to a local file logger / main-process log sink for diagnostics.

### 4.7 Notifications & Modals
- A single **Global Modal Manager** component, mounted once at the root, is driven entirely by a Zustand store. Any part of the app triggers modals via a hook (e.g., `useModal().open({...})`) instead of repeating modal JSX/state per component.
- All toast notifications use **Sonner** (or React Hot Toast) — no custom toast implementations. Native `alert()`/`confirm()` are strictly forbidden (see RULES.md §7).

## 5. Offline-First Data Layer (RxDB)

### 5.1 Initialization
- On app launch, RxDB initializes immediately against the Dexie/IndexedDB storage adapter, before any network call is attempted. The UI must be interactive with local data before any sync handshake completes.

### 5.2 Reactive Queries
- All UI data-binding uses RxDB's reactive query subscriptions (`$` observables) so that any local mutation (from user action or incoming sync) re-renders the affected UI automatically — no manual refetch logic.

### 5.3 Schema & Collections
- Each entity (Product, Order, Member, Table, KOT, etc.) is defined as an RxDB collection with a versioned JSON schema, mirroring the corresponding Mongoose schema on the backend (kept in sync via `packages/shared-types`).
- Every syncable document includes: `_id`, `updatedAt` (server-authoritative timestamp), `isSynced: boolean`, and a soft-delete flag (`isDeleted: boolean`) for tombstone-based replication.

### 5.4 Replication (Push/Pull Sync)
- RxDB's built-in **Replication Plugin** connects to dedicated Express endpoints:
  - `POST /api/sync/push` — client sends locally changed/created documents in small batches.
  - `GET /api/sync/pull?checkpoint=...&limit=...` — client pulls server-side changes since the last checkpoint, paginated.
- Sync runs continuously in the background whenever connectivity is detected; on disconnect, the app silently reverts to offline-only local reads/writes with no user-facing error state.
- **Conflict resolution**: server `updatedAt` timestamp is authoritative. On conflict, the replication protocol's deterministic merge handler resolves using last-write-wins by server timestamp, with domain-specific merge functions for additive fields (e.g., stock quantities) where applicable.
- Chunked/paginated pull-push cycles are mandatory to respect Vercel's serverless execution time ceiling (see §9.3).

### 5.5 Local Data Retention
- Client-side RxDB retains a rolling **1-year window** of transactional data. A scheduled local maintenance job prunes documents older than the retention window **only after confirming they are fully synced** to the cloud.
- MongoDB Atlas retains data for the lifetime of the tenant — the client is never the sole copy of any record older than the retention window.

### 5.6 Local Encryption
- RxDB's **crypto-plugin** encrypts sensitive collections at rest using **AES-256**, so that direct inspection of the IndexedDB files on a compromised/stolen machine does not expose plaintext business or customer data.

## 6. Image Handling Pipeline

1. **Capture** — user selects/uploads an image (e.g., product photo, member photo).
2. **Client-side compression** — image is compressed/resized in the renderer before persistence.
3. **Local persistence** — compressed image is stored as a Base64 string or Binary Blob inside the relevant RxDB document, flagged `isSynced: false`; UI renders it immediately via a local object URL — the user never waits on network.
4. **Background sync worker** — a background process polls/queries for documents where `isSynced: false`, and uploads their image payloads **sequentially** to Cloudinary.
5. **Cloud persistence** — once Cloudinary returns a secure URL, the client calls the Express API to persist that URL against the corresponding record in MongoDB Atlas.
6. **Local cleanup** — on confirmed success, the heavy Base64/Blob payload is deleted from the local RxDB document and replaced with the lightweight Cloudinary URL + `isSynced: true`, preventing local storage bloat/crash risk.
7. **Offline viewing of previously-synced images** — Electron's standard browser cache is configured (via appropriate cache headers/service behavior) so previously loaded Cloudinary URLs render successfully from cache even without an active connection.

## 7. Backend Architecture

### 7.1 Design Pattern — Controller → Service → Repository
- **Routes**: declare endpoints and apply request validation (Zod) — no business logic.
- **Controllers**: parse request, call the appropriate service, and shape the HTTP response/status code — no direct DB access, no business logic.
- **Services**: contain all business logic, orchestrate repository/model calls, isolated and independently testable.
- **Models (Mongoose)**: define schema, indexes, and data-access rules only.

### 7.2 Folder Structure (per app/tenant-facing API)
```
apps/server/
├── src/
│   ├── config/             # db.js (MongoDB Atlas connection), env config
│   ├── constants/          # errorCodes.js and other fixed enums
│   ├── controllers/        # HTTP layer
│   ├── middlewares/        # auth, validate (Zod), error.middleware.js (global)
│   ├── models/              # Mongoose schemas
│   ├── routes/              # index.js splits into sub-routers
│   ├── services/            # Core business logic
│   ├── utils/                # logger.js (Winston/Pino), generateToken.js, etc.
│   └── app.js                # Express app + global middleware mount
├── server.js                 # Entry point — only starts the listener
└── .env
```
- `server.js` vs `app.js` isolation is mandatory: `server.js` only calls `.listen()`; `app.js` wires up middleware and routers. This separation simplifies testing and integration.
- No backend file should exceed **~120 lines**; split further into services/utils when approaching this limit.

### 7.3 Request Validation & Error Handling
- **Zod schemas** validate every incoming request body/query/params at the route/middleware layer, before controller logic executes — rejecting malformed input before it can reach business logic or the database.
- A **global error-handling middleware** (`error.middleware.js`) catches both synchronous and asynchronous (Promise-rejected) errors across the entire request lifecycle, ensuring no unhandled exception can crash the Node process.

### 7.4 Mongoose Query Optimization
- All **read** queries append `.lean()` so Mongoose returns plain JS objects instead of full Mongoose Documents, cutting memory/CPU overhead.
- All queries specify `.select()` to project only the fields actually needed by the caller — never fetch full documents by default.
- **Compound indexes** are defined on high-frequency filter/sort fields (e.g., `tenantId + createdAt`, `tenantId + status`).
- Pagination is implemented at the query level using `.skip()` and `.limit()`, driven by client-provided `page`/`limit` query parameters.
- Request body size limits are explicitly configured on the JSON body parser to prevent resource-exhaustion from oversized payloads.

### 7.5 Security Middleware
- **Helmet** is mounted globally to set secure HTTP headers.
- **CORS** is explicitly and narrowly configured (allow-listed origins only) — no wildcard `*` in production.
- Authentication uses signed tokens (JWT) validated by `auth.middleware.js`; tenant context is resolved and attached to `req` on every authenticated request.

### 7.6 Logging
- **Winston** or **Pino** provide structured, leveled logging to local stdout and rotation-based log files — no reliance on heavy third-party logging SaaS by default.

## 8. Multi-Tenant SaaS Architecture

### 8.1 Super Admin Database (Central)
Stores, per client:
- Tenant identity & business profile.
- Approved hardware fingerprints (Motherboard UUID + MAC address).
- Rent/subscription status and billing history.
- The tenant's **private MongoDB Atlas connection URI** (isolated database per client).

### 8.2 Dynamic Tenant Routing
- On login, the authentication service:
  1. Verifies credentials against the Super Admin database.
  2. Resolves the tenant's private MongoDB URI.
  3. Establishes/reuses a pooled connection to that tenant's isolated database.
  4. Routes all subsequent tenant-scoped requests to that connection — **no tenant ever queries another tenant's database.**

### 8.3 Serverless Execution Constraints
- Vercel serverless functions are capped at roughly 10–15 seconds of execution time. All bulk operations — especially initial sync of a large offline backlog — **must** be broken into small, paginated chunks (bounded batch size per request) so no single invocation risks timing out or leaving a sync operation in a half-applied state.

## 9. Licensing, Hardware Security & Kill-Switch

### 9.1 Device Fingerprinting
- The Electron **main process** (not the renderer, and not IP-based) reads the machine's **Motherboard UUID** and **MAC address** via native OS calls, forming a stable hardware fingerprint independent of network configuration.

### 9.2 Device Approval Workflow
- New installs submit their fingerprint to the Super Admin backend, appearing in a **pending approval queue** inside the Super Admin dashboard. A device only unlocks full app functionality after explicit Super Admin approval (whitelisting).

### 9.3 Heartbeat & Kill-Switch
- A continuous, lightweight **heartbeat API** runs between the client app and server whenever a connection is available.
- If a tenant's rent/subscription becomes overdue while the client machine is offline, the block is recorded server-side. The moment the machine's heartbeat successfully reaches the server again, the response signals a lock, and the frontend **immediately transitions to a full-screen lock state**, freezing all navigation and business operations until the account is reinstated.

## 10. Hardware Integration — Receipt Printing

- Electron's Node environment integrates an **ESC/POS** printing library directly in the main process, bypassing the browser's default print dialog entirely.
- A dedicated **Printer Configuration UI** lets the business owner detect, select, and calibrate connected USB thermal printers.
- Print jobs are dispatched as raw ESC/POS command frames over IPC from renderer → main process, in **chunked** form rather than one large nested JSON payload, to avoid IPC bottlenecks.

## 11. Electron-Specific Engineering Rules

- **IPC**: all data frames sent between renderer and main process are chunked rather than passed as bulky nested JSON blobs, to avoid blocking either process.
- **Auto-Update**: `electron-updater` is wired to a **GitHub Releases** pipeline so client machines silently receive and apply version upgrades in the background, migrating seamlessly without manual reinstall.

## 12. Performance Engineering Budgets

| Asset/Code Type | Budget |
|---|---|
| Individual layout/UI image asset | < 100 KB |
| Individual SVG icon/vector asset | < 5 KB (compressed) |
| Large media/animation assets | Hosted on remote CDN — excluded from the Electron build bundle (.exe/.dmg) |
| JSX/JS file (soft limit) | 100–300 lines |
| JSX/JS file (hard limit before mandatory refactor) | 500 lines → split into sub-components/custom hooks |
| Backend file (soft limit) | ~120 lines |

## 13. API Design Conventions

- RESTful resource-based routing: `/api/v1/<tenant-scoped-resource>`.
- Consistent JSON response envelope: `{ success: boolean, data: ..., message: string, meta?: { page, limit, total } }`.
- Versioned API base path (`/api/v1/...`) to allow non-breaking future evolution.
- All list endpoints accept `page`/`limit` (or cursor-based `checkpoint`) query parameters for pagination, matching the RxDB replication pull contract where applicable.

## 14. High-Level Data Model (Entities)

| Entity | Notes |
|---|---|
| `SuperAdminClient` | Tenant registry: hardware fingerprints, rent status, DB URI |
| `User` | Per-tenant application user (Owner/Manager/Cashier/etc.) with role reference |
| `Role` | Permission set per role, per niche |
| `Product` | Base catalog item; extended by niche-specific variant data (Garments) |
| `ProductVariant` | Size/color/SKU matrix (Garments) |
| `Order` / `Invoice` | POS transaction record, shared across niches |
| `Table` | Restaurant floor/table state |
| `KOT` | Kitchen Order Ticket, linked to an Order |
| `Membership` / `Subscription` | Gym membership plan & renewal state |
| `Attendance` | Gym check-in/check-out log |
| `InventoryMovement` | Stock in/out ledger entry |
| `DeviceLog` / `Heartbeat` | Licensing/heartbeat audit trail |

Every syncable entity additionally carries: `tenantId`, `createdAt`, `updatedAt`, `isSynced`, `isDeleted` (soft delete for replication tombstones).

## 15. Deployment Architecture

- **Backend API**: Deployed as Vercel Serverless Functions (Node/Express, adapted for serverless entry).
- **Databases**: MongoDB Atlas — one Super Admin cluster/database, plus one isolated database per tenant (or a strictly partitioned equivalent, per §8).
- **Media**: Cloudinary for all persisted image assets.
- **Client Distribution**: Electron installers built and published as **GitHub Releases**, consumed automatically by `electron-updater` on each client machine.

## 16. Testing Strategy (Baseline)
- Unit tests for all `services/` business logic (backend) and custom hooks (frontend).
- Integration tests for sync push/pull endpoints, including simulated conflict scenarios.
- Manual/E2E smoke tests for the full offline → reconnect → sync → kill-switch lifecycle before every release.

## 17. Appendix — Environment Variables (Indicative)

```
MONGODB_SUPERADMIN_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CORS_ALLOWED_ORIGINS=
NODE_ENV=
LOG_LEVEL=
```
