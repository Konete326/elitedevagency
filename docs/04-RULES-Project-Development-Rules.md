# Project Development Rules
## Multi-Niche Offline-First SaaS POS Platform

| Field | Value |
|---|---|
| Document Type | Mandatory Development & Coding Rules |
| Audience | Human developers AND any AI coding agent working on this codebase |
| Companion Docs | PRD.md, TRD.md, SRD.md |
| Version | 1.0 |
| Status | MANDATORY — Not optional guidance |

---

> **These rules are strict and mandatory.** Any AI Agent (Claude Code, Cursor, or otherwise) and any human contributor MUST follow this document during every task on this codebase. Where this document conflicts with general best-practice defaults, this document wins.

## 1. Architecture & Folder Structure Rules

1.1. All work must follow the existing monorepo/folder structure exactly as defined in TRD.md §2 and §4.3 (frontend) and §7.2 (backend). Never invent a new top-level structure.

1.2. Backend must strictly follow **Controller → Service → Repository (Model)**:
- Routes: validation + routing only.
- Controllers: parse request, call service, return HTTP response. No DB access, no business logic.
- Services: 100% of business logic lives here, isolated and testable.
- Models: schema + data-access rules only.

1.3. Frontend must strictly follow the **Atomic + Hybrid Component Pattern**:
- `components/ui/` → global, reusable atoms (Button, Input, Modal, Form primitives) used across ≥2 features.
- `components/layout/` → structural organisms (Navbar, Sidebar, AppShell).
- `features/<niche-or-domain>/` → components and logic unique to one feature/dashboard area (e.g., `UserProfileCard`, `InvoiceGraph`, `MembershipCard`). Never place feature-specific components in the global folder.
- `pages/` or `routes/` → route composition only. No business logic in page files.

1.4. Client (UI) state and Server (data) state must never be mixed:
- Client/UI state (theme, sidebar, modal visibility, active tab) → **Zustand** only.
- Server state (fetched data, mutations, pagination, optimistic updates) → **TanStack Query** only. No manual `useEffect` fetch/cache loops are permitted.

## 2. File Size & Modularity Rules

2.1. Frontend JSX/JS files: target **100–300 lines**. Crossing **500 lines** is a hard trigger to refactor into sub-components or custom hooks — no exceptions without documented justification.

2.2. Backend files: target **≤120 lines**. Exceed only when truly unavoidable, and document why in a code comment-free way (i.e., justify via PR description, not inline comments — see §5).

2.3. Never write a single "God component" or "God file" that mixes UI, data-fetching, business logic, and state management together.

2.4. When a file approaches its limit, extract:
- Repeated JSX blocks → sub-components.
- Repeated logic/state → custom hooks (frontend) or service functions (backend).

## 3. Functional Completeness & Security

3.1. **No dummy code.** Every implementation must be fully functional, wired to real data sources (RxDB / MongoDB Atlas / Cloudinary) — never placeholder functions, mock UI states presented as final, or fake data left in production paths.

3.2. **No security shortcuts.** Every input must be validated (Zod on backend), every tenant-scoped query must be provably isolated to that tenant, and every secret must come from environment variables — never hard-coded.

3.3. Code must be production-ready and stable enough that a single bad input, a dropped connection, or a malformed sync payload cannot crash the process or corrupt local/cloud data.

## 4. Offline-First & Data Integrity Rules

4.1. Every syncable RxDB collection must include: `tenantId`, `updatedAt` (server-authoritative), `isSynced`, and `isDeleted` (soft-delete/tombstone) fields — no exceptions.

4.2. All local database access for UI rendering must go through **reactive queries**, never one-off imperative reads for data meant to update live.

4.3. Local sensitive data must always be encrypted via RxDB's crypto-plugin (AES-256). Never store sensitive fields in plaintext in IndexedDB.

4.4. Local data pruning (1-year retention) may only remove documents already confirmed `isSynced: true`. Never prune unsynced data under any circumstance.

4.5. Image documents must follow the full two-tier lifecycle exactly as specified in TRD.md §6: compress → local Base64/Blob (`isSynced:false`) → background Cloudinary upload → persist URL to MongoDB → delete local heavy payload. Skipping any step (e.g., keeping Base64 permanently, or uploading uncompressed images) is not allowed.

4.6. All bulk sync/backend operations must be paginated/chunked to respect serverless execution time limits. A single unbounded sync request is a defect, not an acceptable shortcut.

## 5. Clean Code Rules

5.1. **No comments in generated code.** Code must be self-explanatory through clear naming and structure.

5.2. Naming conventions:
- Components: `PascalCase` (e.g., `InvoiceGraph.jsx`).
- Hooks: `camelCase` prefixed with `use` (e.g., `useMembershipStatus.js`).
- Zustand stores: `useXStore` (e.g., `useUiStore.js`).
- Backend files: `<name>.controller.js`, `<name>.service.js`, `<name>.routes.js`, `<name>.middleware.js`.
- Constants/enums: `UPPER_SNAKE_CASE`.

5.3. Every package/library/framework installed (React, Node, Express, Tailwind, RxDB, etc.) must be the **latest available stable version** at time of installation — this applies to every future dependency addition as well, not just the initial setup.

## 6. UI, Layout & Performance Rules

6.1. No pixel (`px`) units for spacing/typography layout decisions. Use Tailwind spacing tokens and CSS `clamp()` for fluid scaling.

6.2. Base styles are mobile-first with **no responsive prefix**; larger breakpoints are added only as progressive-enhancement (`md:`, `lg:`, `xl:`) prefixes.

6.3. Responsive layout logic is handled strictly via Tailwind breakpoints + native CSS Grid/Flexbox. JavaScript `resize`/viewport-tracking event listeners for layout decisions are forbidden.

6.4. Animations (drawers, menus, transitions) must only animate `transform` and `opacity` (GPU-accelerated). Animating `width`, `height`, `top`, `left`, or other layout-triggering properties is forbidden.

6.5. Icons must come exclusively from **Lucide React**. No generic, mismatched, or "AI-generated-looking" icon sets. Icon choice and sizing must feel premium and consistent across the app.

6.6. Any list/grid with large or unbounded row counts must use `react-window` (or equivalent) virtualization. Rendering thousands of DOM nodes directly is forbidden.

6.7. Route-level and heavy-component-level code must use `lazy()` + `Suspense`. Hidden/inactive views must never be eagerly loaded at startup.

6.8. All high-frequency handlers (search input, drag, scroll-adjacent logic) must be debounced or throttled.

## 7. Interaction & Notification Rules

7.1. **Never use native `alert()` or `confirm()`.** All confirmations and warnings must use a professional, theme-aware custom modal, driven through the single **Global Modal Manager** (Zustand-backed) described in TRD.md §4.7 — never re-implemented per component.

7.2. All toast/status notifications must use **Sonner** (or React Hot Toast) — never a custom-built toast system.

7.3. Every top-level route must be wrapped in an **Error Boundary**. A crash in one screen must never white-screen the whole application.

## 8. Backend Engineering Rules

8.1. Every incoming request must be validated with a **Zod schema** before it reaches controller/service logic.

8.2. A **global error-handling middleware** must catch all synchronous and asynchronous errors — no request path may allow an unhandled exception to reach the Node process root.

8.3. All read queries must use `.lean()` and `.select()` to minimize memory/CPU overhead. Fetching full Mongoose documents or full field sets "just in case" is forbidden.

8.4. High-frequency filter/sort fields must have compound indexes defined explicitly in the schema.

8.5. All list endpoints must support pagination via `.skip()`/`.limit()` (or cursor-based checkpoints for replication endpoints).

8.6. **Helmet** and an explicit **CORS allow-list** must be mounted globally — no wildcard CORS in any environment.

8.7. All logging goes through **Winston or Pino** — no `console.log` left in production code paths.

## 9. Electron & Hardware Rules

9.1. Licensing/device identity must be derived from **Motherboard UUID + MAC address**, read in the **main process** — never from IP address, and never trusted if read from the renderer process alone.

9.2. All IPC payloads must be chunked; never pass one large nested JSON blob across the IPC boundary.

9.3. Printing must use ESC/POS libraries in the Electron main process. The browser's native print dialog must never be exposed to the end user for receipt printing.

9.4. Auto-updates must flow through `electron-updater` + GitHub Releases, applied silently/seamlessly without requiring manual reinstall by the client.

## 10. Asset & Media Rules

10.1. Individual layout/UI image assets must be kept under **100 KB**; SVG vector assets under **5 KB**.

10.2. Large media/animation assets must be hosted on a remote CDN and excluded from the Electron build bundle — never bundled directly into the `.exe`/`.dmg`.

## 11. Proactive Agent Behavior Rules

11.1. **End-of-task reporting**: after completing any task, the agent must proactively suggest related improvements or next logical features — this is mandatory, not optional politeness.

11.2. **Issue escalation**: if the agent identifies a potential defect, architectural flaw, or future-breaking pattern anywhere in the codebase while working, it must report it immediately and propose a concrete fix — even if outside the scope of the current task.

11.3. The agent must never silently work around a detected issue without flagging it to the human reviewer.

## 12. Version Control & Workflow Conventions

12.1. Branch naming: `feature/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.

12.2. Commit messages: imperative mood, scoped where useful — e.g., `feat(pos): add offline discount calculation`, `fix(sync): resolve duplicate push on reconnect`.

12.3. No direct commits to the main/production branch — all changes flow through a reviewable branch, even for solo development, to preserve a clean rollback history.

## 13. Testing & Quality Gate Checklist

Before any feature is considered "done," confirm:

- [ ] Feature works correctly with internet **fully disconnected**.
- [ ] Feature syncs correctly when internet is restored, with no duplicate or lost records.
- [ ] No file exceeds the size limits in §2.
- [ ] No native `alert()`/`confirm()` introduced.
- [ ] All new lists/tables with non-trivial row counts are virtualized or paginated.
- [ ] All new backend routes have Zod validation and are wrapped by the global error middleware.
- [ ] All new Mongoose queries use `.lean()`/`.select()` and appropriate indexes.
- [ ] All new images follow the full two-tier compress → local → Cloudinary → cleanup lifecycle.
- [ ] No sensitive data stored in local RxDB without encryption.
- [ ] No hard-coded secrets/config — all via environment variables.
- [ ] Latest stable versions used for any newly added dependency.
- [ ] Agent has proactively reported any related improvement opportunities or spotted risks (§11).

## 14. Documentation Maintenance Rule

14.1. Whenever a feature materially changes scope, data model, or architecture, the relevant section of **PRD.md**, **TRD.md**, and/or **SRD.md** must be updated in the same change — these documents must never be allowed to drift out of sync with the actual implementation.
