# Software Requirements Document (SRD)
## Multi-Niche Offline-First SaaS POS Platform

| Field | Value |
|---|---|
| Document Type | Software Requirements Specification (IEEE 830 style) |
| Companion Docs | PRD.md, TRD.md, RULES.md |
| Version | 1.0 |
| Status | Draft — Engineering & QA Reference |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the complete functional and non-functional requirements for the Unified POS Engine, an offline-first, multi-tenant SaaS application built on MERN + Electron, serving Gym, Restaurant, and Garments business niches from a single codebase. It is intended for engineers, QA, and any AI coding agent implementing the system, and is the authoritative source for **what the system must do** (paired with TRD.md for **how** it is built).

### 1.2 Scope
The system covers: client desktop application (Electron/React), backend API (Node/Express), database layer (MongoDB Atlas + local RxDB), Super Admin tenant-management portal, hardware licensing/kill-switch mechanism, and thermal printer integration. See PRD.md §5 for full in/out-of-scope declarations.

### 1.3 Definitions, Acronyms, Abbreviations

| Term | Definition |
|---|---|
| POS | Point of Sale |
| KOT | Kitchen Order Ticket |
| RxDB | Reactive client-side database used for offline-first storage |
| IndexedDB | Browser-native storage engine used as RxDB's persistence layer via Dexie |
| Tenant | A single client business instance (Gym/Restaurant/Garments) on the SaaS platform |
| Super Admin | The platform operator managing all tenants |
| Kill-Switch | Remote mechanism to lock a client's application instance |
| ESC/POS | Standard command protocol for thermal receipt printers |
| IPC | Inter-Process Communication (Electron main ↔ renderer) |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |

### 1.4 References
- PRD.md — Product Requirements Document
- TRD.md — Technical Requirements Document
- RULES.md — Project Development Rules

## 2. Overall Description

### 2.1 Product Perspective
The product is a new, standalone SaaS platform, not an extension of an existing system. It is composed of a distributed client (Electron desktop app per tenant machine) and a centralized multi-tenant backend.

### 2.2 Product Functions (Summary)
- Multi-tenant authentication & dynamic database routing.
- Offline-first POS billing and inventory management.
- Niche-specific modules (Gym / Restaurant / Garments) via feature flags.
- Background image compression, upload, and cloud reconciliation.
- Automatic bi-directional data synchronization with conflict resolution.
- Hardware-bound licensing with remote kill-switch enforcement.
- Native thermal printer integration.
- Super Admin tenant and device management console.

### 2.3 User Classes and Characteristics
See PRD.md §4 (Super Admin, Business Owner, Cashier, Manager, Kitchen Staff, Trainer). Technical characteristic: most end-users (Cashier/Manager) have **low technical proficiency** and require a UI that fails gracefully and never exposes raw errors.

### 2.4 Operating Environment
- **Client**: Windows 10/11 desktop, Electron runtime, local IndexedDB storage, intermittent internet connectivity.
- **Server**: Node.js runtime on Vercel serverless functions, MongoDB Atlas (cloud), Cloudinary (cloud media).

### 2.5 Design and Implementation Constraints
- Must use the MERN stack + Electron (mandated).
- Must use RxDB with Dexie/IndexedDB adapter for local storage (mandated).
- Must use MongoDB Atlas for cloud persistence (mandated).
- Backend hosted on Vercel — subject to serverless execution time limits (see TRD §9.3).
- All licensing/hardware identification must use Motherboard UUID + MAC address, not IP address (mandated — IP addresses change and are unreliable for fingerprinting).

### 2.6 Assumptions and Dependencies
- Reliable (if intermittent) internet access is available at each client site periodically.
- Cloudinary and MongoDB Atlas services are available with acceptable SLAs.
- Client machines are not simultaneously running two instances of the app for the same tenant offline (to bound conflict complexity).

## 3. Functional Requirements

### 3.1 Authentication & Multi-Tenancy

| ID | Requirement |
|---|---|
| FR-001 | The system shall authenticate users against the Super Admin database and resolve their tenant context on login. |
| FR-002 | The system shall dynamically route all authenticated, tenant-scoped requests to that tenant's isolated MongoDB Atlas database/connection. |
| FR-003 | The system shall never allow a request scoped to one tenant to read or write another tenant's data. |
| FR-004 | The system shall support role-based access control with at least: Owner, Manager, Cashier, and niche-specific roles (Kitchen Staff, Trainer). |

### 3.2 Offline-First Data & Sync

| ID | Requirement |
|---|---|
| FR-010 | The application shall initialize its local RxDB instance on launch and be fully usable for core operations without any network connection. |
| FR-011 | All create/update/delete operations shall be written to the local RxDB store first, and reflected in the UI via reactive queries without waiting for network confirmation. |
| FR-012 | The system shall detect network connectivity changes and automatically switch between offline and online sync modes without user intervention. |
| FR-013 | When connectivity is restored, the system shall automatically push all locally pending (unsynced) changes to the backend in paginated batches. |
| FR-014 | When connectivity is restored, the system shall automatically pull all remote changes since the last local checkpoint, in paginated batches. |
| FR-015 | The system shall resolve sync conflicts deterministically (server `updatedAt` timestamp authoritative) without producing duplicate records or silent data loss. |
| FR-016 | The system shall retain a rolling 1-year window of transactional data locally, pruning only records confirmed as fully synced. |
| FR-017 | The system shall persist all data older than the local retention window in MongoDB Atlas indefinitely, retrievable on demand. |
| FR-018 | The system shall display a persistent, non-blocking sync-status indicator (Synced / Pending / Offline) at all times. |

### 3.3 Image Handling

| ID | Requirement |
|---|---|
| FR-020 | The system shall compress any user-uploaded image client-side before persistence. |
| FR-021 | The system shall store a compressed image locally (Base64/Blob) with an `isSynced: false` flag and render it immediately in the UI via a local URL. |
| FR-022 | The system shall, upon connectivity, upload all pending (`isSynced: false`) images to Cloudinary in the background without blocking the UI. |
| FR-023 | The system shall persist the Cloudinary-returned secure URL to MongoDB Atlas via the backend API upon successful upload. |
| FR-024 | The system shall delete the local heavy Base64/Blob payload and replace it with the Cloudinary URL once cloud persistence is confirmed. |
| FR-025 | The system shall render previously-synced images from browser cache when offline, using the cached Cloudinary URL. |

### 3.4 POS / Billing (Shared Core)

| ID | Requirement |
|---|---|
| FR-030 | The system shall allow a cashier to build a cart, apply discounts/taxes, and complete checkout using at least one payment mode, fully offline. |
| FR-031 | The system shall generate a receipt for every completed transaction and send it to a configured thermal printer via ESC/POS. |
| FR-032 | The system shall record every transaction against the correct tenant and, where applicable, the correct branch/location. |

### 3.5 Inventory Management (Shared Core)

| ID | Requirement |
|---|---|
| FR-040 | The system shall track stock levels per product/variant and decrement stock automatically on sale. |
| FR-041 | The system shall raise a low-stock alert when inventory falls below a configurable threshold. |
| FR-042 | The system shall maintain an auditable inventory movement ledger (stock in/out with reason/source). |

### 3.6 Gym Module

| ID | Requirement |
|---|---|
| FR-050 | The system shall support creation of membership plans with defined duration and price. |
| FR-051 | The system shall track each member's subscription status and automatically flag expired/expiring memberships. |
| FR-052 | The system shall record member attendance (check-in/check-out). |
| FR-053 | The system shall allow assignment of a trainer to one or more members. |

### 3.7 Restaurant Module

| ID | Requirement |
|---|---|
| FR-060 | The system shall represent the restaurant floor as a set of tables with status (Free/Occupied/Reserved). |
| FR-061 | The system shall generate a KOT for every new order and display it in real time on a kitchen-facing view. |
| FR-062 | The system shall support Dine-in, Takeaway, and Delivery order types with type-specific fields. |

### 3.8 Garments Module

| ID | Requirement |
|---|---|
| FR-070 | The system shall support product variants defined by a size × color matrix, each with its own SKU and stock count. |
| FR-071 | The system shall support barcode generation per SKU and barcode-scanner input during checkout. |
| FR-072 | The system shall support recording alteration/customization requests against an order. |

### 3.9 Licensing, Hardware Security & Kill-Switch

| ID | Requirement |
|---|---|
| FR-080 | The system shall read the client machine's Motherboard UUID and MAC address via the Electron main process at first activation. |
| FR-081 | The system shall require Super Admin approval (whitelisting) of a device fingerprint before granting full application functionality. |
| FR-082 | The system shall maintain a continuous heartbeat between the client and server whenever connectivity is available. |
| FR-083 | The system shall, upon detecting an overdue/blocked tenant status during a heartbeat response, immediately transition the client UI to a full-screen lock state that freezes all navigation and operations. |
| FR-084 | The lock state specified in FR-083 shall persist across app restarts until the tenant's status is restored server-side. |

### 3.10 Super Admin Console

| ID | Requirement |
|---|---|
| FR-090 | The system shall allow Super Admin to onboard a new tenant, provisioning an isolated database connection URI. |
| FR-091 | The system shall allow Super Admin to view, approve, or reject pending device fingerprints. |
| FR-092 | The system shall allow Super Admin to view and update each tenant's rent/subscription status. |
| FR-093 | The system shall allow Super Admin to manually trigger a kill-switch lock on any tenant device. |

### 3.11 Printing

| ID | Requirement |
|---|---|
| FR-100 | The system shall provide a configuration UI to detect, select, and calibrate connected USB thermal printers. |
| FR-101 | The system shall print receipts using ESC/POS commands directly from the Electron main process, without invoking any browser print dialog. |

### 3.12 Notifications & Alerts

| ID | Requirement |
|---|---|
| FR-110 | The system shall present all confirmations/warnings via custom, theme-aware modal dialogs — never native browser `alert()`/`confirm()`. |
| FR-111 | The system shall present transient status messages (success/error/info) via a toast notification system, queued and non-blocking. |

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement |
|---|---|
| NFR-001 | The application shall remain interactive (no dropped frames / UI freeze) while rendering lists of 10,000+ rows, via virtualization. |
| NFR-002 | Server list/report endpoints shall respond using paginated queries (`.skip()`/`.limit()`, `.lean()`, `.select()`) to keep response times minimal under large data volumes. |
| NFR-003 | Local RxDB reads for the current day's operational data shall resolve in under 200ms on target hardware. |
| NFR-004 | Background sync of a typical day's transactional backlog shall complete within 5 seconds of connectivity restoration under normal network conditions. |

### 4.2 Scalability

| ID | Requirement |
|---|---|
| NFR-010 | The multi-tenant backend architecture shall support onboarding new tenants without code changes (configuration/data-driven only). |
| NFR-011 | The system shall support local datasets growing into multiple gigabytes without degradation, subject to the 1-year retention policy. |

### 4.3 Security

| ID | Requirement |
|---|---|
| NFR-020 | All locally persisted sensitive data shall be encrypted at rest using AES-256 (RxDB crypto-plugin). |
| NFR-021 | All API endpoints shall be protected by Helmet-configured secure headers and an explicit CORS allow-list. |
| NFR-022 | All inputs to backend endpoints shall be validated via Zod schemas prior to any business logic execution. |
| NFR-023 | Tenant data isolation shall be enforced at the database-connection level, not merely by query filters. |
| NFR-024 | Device licensing shall rely on hardware fingerprinting (Motherboard UUID + MAC), not IP address, which is not reliable for this purpose. |

### 4.4 Reliability & Availability

| ID | Requirement |
|---|---|
| NFR-030 | A rendering exception in any single screen/component shall be contained by an Error Boundary and shall not crash or white-screen the entire application. |
| NFR-031 | All unhandled synchronous and asynchronous backend errors shall be captured by global error-handling middleware without terminating the Node process. |
| NFR-032 | The application shall be fully operational for core POS functions with zero internet connectivity, indefinitely. |

### 4.5 Usability

| ID | Requirement |
|---|---|
| NFR-040 | The UI shall be mobile-first responsive, using fluid spacing/typography (`clamp()`), functioning correctly from small tablet widths up to full desktop widths. |
| NFR-041 | All icons shall be professional, consistent, and sourced exclusively from Lucide React. |
| NFR-042 | All user-facing confirmations/destructive actions shall use custom modal dialogs consistent with the application's design system. |

### 4.6 Maintainability

| ID | Requirement |
|---|---|
| NFR-050 | No frontend JSX/JS file shall exceed 500 lines without being refactored into sub-components or hooks (soft target: 100–300 lines). |
| NFR-051 | No backend file shall exceed approximately 120 lines without justified exception. |
| NFR-052 | The codebase shall follow the Controller-Service-Repository pattern on the backend and the Atomic/Hybrid component pattern on the frontend, without exception. |

### 4.7 Portability

| ID | Requirement |
|---|---|
| NFR-060 | The Electron application shall target Windows 10/11 in Phase 1, with architecture that does not preclude future macOS/Linux packaging. |

### 4.8 Data Retention & Backup

| ID | Requirement |
|---|---|
| NFR-070 | Local device data retention shall be capped at 1 rolling year; MongoDB Atlas shall retain full tenant history indefinitely. |
| NFR-071 | No local pruning operation shall remove a record that has not been confirmed as synced to the cloud. |

## 5. External Interface Requirements

### 5.1 User Interfaces
- Electron desktop window rendering the React SPA; responsive down to tablet widths for on-the-floor use cases (e.g., a manager reviewing reports on a tablet-sized secondary device).

### 5.2 Hardware Interfaces
- USB-connected ESC/POS-compatible thermal receipt printers, accessed via the Electron main process.
- Motherboard/MAC hardware identifiers, read via native OS-level calls from the Electron main process.
- Optional barcode scanner (keyboard-emulation input) for the Garments module.

### 5.3 Software Interfaces
- **MongoDB Atlas** — primary data persistence (Super Admin + per-tenant databases).
- **Cloudinary** — image/media storage and CDN delivery.
- **Vercel** — serverless hosting for the Node/Express API.
- **GitHub Releases** — distribution channel for `electron-updater` auto-updates.

### 5.4 Communication Interfaces
- HTTPS REST API between the Electron client and the backend (`/api/v1/...`).
- RxDB Replication Plugin protocol over HTTPS for push/pull sync.
- Lightweight heartbeat protocol (HTTPS) between client and server for licensing/kill-switch enforcement.

## 6. System Features (Representative Use Cases)

### UC-1: Offline Sale Completion
**Actor**: Cashier
**Precondition**: App is activated and previously logged in; internet is disconnected.
**Flow**: Cashier adds items to cart → applies discount → completes checkout → receipt prints via ESC/POS → transaction is written to local RxDB with `isSynced: false`.
**Postcondition**: Transaction is visible immediately in local reports; syncs automatically once connectivity returns.

### UC-2: Automatic Reconnection Sync
**Actor**: System (background)
**Precondition**: Device has pending unsynced documents; connectivity is restored.
**Flow**: Sync engine detects connectivity → pushes pending batches → pulls remote changes → resolves any conflicts by server timestamp → updates local sync-status indicator to "Synced."
**Postcondition**: No duplicate or lost records; local and cloud state converge.

### UC-3: Kill-Switch Enforcement
**Actor**: Super Admin, System
**Precondition**: Tenant's rent is marked overdue while their device was offline.
**Flow**: Device reconnects → heartbeat call reaches server → server responds with a "locked" status → client immediately renders a full-screen lock, blocking all navigation.
**Postcondition**: Device remains locked until Super Admin reinstates the tenant's status.

### UC-4: New Tenant Onboarding
**Actor**: Super Admin
**Flow**: Super Admin creates a new tenant record → system provisions/records an isolated MongoDB URI → tenant receives login credentials → first device fingerprint submitted on activation is queued for approval.
**Postcondition**: Tenant can log in only after their device fingerprint is approved.

## 7. Other Requirements

- **Licensing Model**: SaaS subscription (rent-based), enforced via the hardware/kill-switch mechanism described in §3.9.
- **Compliance**: No specific regulatory compliance (e.g., PCI-DSS) is in scope for Phase 1 since online payment processing is out of scope; this shall be revisited if Phase 2 introduces payment gateway integration.

## 8. Traceability Matrix (Excerpt)

| PRD Feature | SRD Requirements |
|---|---|
| Offline-First Experience | FR-010 – FR-018, NFR-032, NFR-070, NFR-071 |
| Image Handling | FR-020 – FR-025 |
| SaaS Licensing & Kill-Switch | FR-080 – FR-084, NFR-024 |
| Gym Module | FR-050 – FR-053 |
| Restaurant Module | FR-060 – FR-062 |
| Garments Module | FR-070 – FR-072 |
| Hardware Printing | FR-100, FR-101 |
| Professional Notifications | FR-110, FR-111, NFR-042 |
