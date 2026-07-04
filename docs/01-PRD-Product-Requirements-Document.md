# Product Requirements Document (PRD)
## Multi-Niche Offline-First SaaS POS Platform

| Field | Value |
|---|---|
| Document Type | Product Requirements Document |
| Product Name | Unified POS Engine (Gym / Restaurant / Garments) |
| Stack | MERN + Electron (Offline-First) |
| Version | 1.0 |
| Status | Draft — Ready for Engineering Review |
| Owner | Product Owner |

---

## 1. Executive Summary

This product is a **single-codebase, multi-tenant, multi-niche Point of Sale (POS) and business management platform** delivered as a native Electron desktop application, backed by a MERN (MongoDB, Express, React, Node) stack. One engine will serve three distinct verticals — **Gyms, Restaurants, and Garment/Retail shops** — through strict feature-flagging and modular component loading, instead of building three separate products.

The platform must work **fully offline** on the client machine using a local reactive database (RxDB over IndexedDB), and synchronize automatically with a cloud backend (MongoDB Atlas via Node/Express APIs) the moment internet connectivity is restored — with zero manual intervention, zero data duplication, and zero crashes even at large data volumes.

The business model is **SaaS with hardware-bound licensing**: each client machine is fingerprinted (Motherboard UUID + MAC address), approved centrally by a Super Admin, and can be remotely locked ("kill-switch") the instant rent/subscription lapses and the machine reconnects to the internet.

## 2. Problem Statement

Small and medium businesses (gyms, restaurants, garment retailers) in low-connectivity environments currently rely on:
- Disconnected, niche-specific desktop software with no cloud backup.
- Manual/paper-based billing that breaks down when internet is unstable.
- No centralized way for a SaaS vendor to manage licensing, prevent piracy, or enforce non-payment lockouts across many independently deployed installs.
- POS software that crashes or becomes unusably slow once historical data grows into the GBs.

There is no unified, professional-grade, crash-proof, offline-first POS engine that serves multiple business niches from one maintained codebase while giving the SaaS operator full remote control over every deployed instance.

## 3. Product Vision & Objectives

**Vision:** One resilient, offline-capable POS engine that any small business — regardless of niche — can run on a single desktop machine with zero data loss, near-instant UI response, and full cloud backup, while the SaaS provider retains complete licensing and remote-control authority.

**Objectives:**
1. Ship one Electron application binary that adapts its UI/features based on the client's configured niche (Gym / Restaurant / Garments) via feature flags — no forked codebases.
2. Guarantee the app is usable with zero internet connection for core daily operations (billing, inventory, member/order tracking).
3. Guarantee automatic, conflict-free background sync to the cloud the moment connectivity returns.
4. Guarantee application stability under large local datasets (multi-GB) with no UI freeze, no crash, no white screen.
5. Give the SaaS operator (Super Admin) a central dashboard to onboard clients, approve hardware, track rent/subscription status, and remotely lock non-paying/pirated installs.
6. Support real hardware peripherals (USB thermal receipt printers) natively from Electron, bypassing browser print dialogs entirely.
7. Keep the application visually premium, fully responsive (including mobile/tablet use of the web-facing modules), and free of amateur/generic UI patterns.

## 4. Target Market & User Personas

| Persona | Description | Primary Goals |
|---|---|---|
| **Super Admin (SaaS Operator)** | Owns the platform; onboards new client businesses; manages billing/rent per client; approves/revokes hardware | Full visibility & control over every tenant; prevent piracy; maximize uptime revenue |
| **Business Owner (Gym/Restaurant/Garments)** | Owns a single client business; the paying tenant | Fast, reliable daily operations; accurate reports; never lose data; low subscription cost |
| **Cashier / Front Desk Staff** | Daily operator of the POS screen | Fast checkout, minimal training, works even when Wi-Fi drops |
| **Manager / Shift Supervisor** | Mid-level role with reporting & inventory access, no admin rights | Visibility into sales, stock, staff performance without full admin exposure |
| **Kitchen Staff (Restaurant-specific)** | Views KOT (Kitchen Order Tickets) | Real-time order visibility, minimal UI, no billing access |
| **Trainer (Gym-specific)** | Assigned to members for sessions | View assigned members, mark attendance |

## 5. Scope

### 5.1 In Scope (Phase 1 — MVP)
- Electron desktop app (Windows primary target) with offline-first architecture.
- Core shared modules: POS billing, inventory, roles & permissions, dashboard reports.
- Niche modules: Gym (memberships/subscriptions), Restaurant (tables/KOT), Garments (size/color variants).
- Multi-tenant backend with isolated per-client databases.
- Super Admin web dashboard for client & device management.
- Hardware-based licensing and remote kill-switch.
- Thermal printer (ESC/POS) integration.
- Cloud image storage via Cloudinary with offline caching.
- Auto-update via electron-updater + GitHub Releases.

### 5.2 Out of Scope (Phase 1)
- Native mobile apps (iOS/Android) — only responsive web views inside Electron/browser.
- macOS/Linux packaging (Phase 2+ consideration).
- Payment gateway integrations (online payments) — Phase 2.
- Multi-language/i18n — Phase 2.
- Advanced BI/analytics (predictive analytics, ML-based demand forecasting) — Phase 3.
- Franchise/multi-branch consolidated reporting across locations of the same client — Phase 2.

## 6. Core Value Proposition

1. **One Engine, Three Niches** — zero duplicated logic for billing, inventory, and roles across verticals.
2. **True Offline-First** — the cashier never sees a spinner or an error because "internet is down."
3. **Crash-Proof at Scale** — reactive local database handles GBs of transactional history without degrading UI performance.
4. **Zero-Touch Sync** — data reconciles with the cloud silently in the background; no "Sync Now" button required, no duplicate records, no manual conflict resolution.
5. **SaaS-Grade Licensing Control** — hardware-locked installs with a remote kill-switch protect recurring revenue and prevent piracy.
6. **Professional, Premium UI** — mobile-first, fluid, animated with GPU-accelerated transitions; not "AI-generated-looking."

## 7. Feature Set

### 7.1 Common Core Modules (All Niches)

| Module | Description |
|---|---|
| POS / Billing | Cart-based checkout, discounts, taxes, multiple payment modes, receipt printing |
| Inventory Management | Stock in/out, low-stock alerts, supplier tracking, unit conversion |
| Roles & Permissions | Owner, Manager, Cashier, and niche-specific roles with granular module-level access control |
| Dashboard & Reports | Sales summary, top items, staff performance, date-range filters, exportable reports |
| Customer/Client Records | Basic CRM: contact info, purchase history, loyalty notes |
| Offline Sync Indicator | Persistent, non-intrusive UI element showing sync status (Synced / Pending / Offline) |
| Notifications | In-app toast alerts (stock low, sync complete, license issues) |

### 7.2 Niche-Specific Modules

**Gym**
- Membership plans (monthly/quarterly/annual) with auto-expiry tracking.
- Subscription renewal reminders and payment history.
- Attendance check-in/check-out.
- Trainer assignment and session tracking.

**Restaurant**
- Table management (floor layout, table status: free/occupied/reserved).
- KOT (Kitchen Order Ticket) generation and real-time kitchen display.
- Order types: Dine-in, Takeaway, Delivery.
- Menu management with categories, modifiers, and combos.

**Garments / Retail**
- Product variant matrix (size × color × SKU).
- Barcode generation and scanning support.
- Alteration/customization order tracking.
- Seasonal collection tagging.

### 7.3 SaaS & Licensing Features
- Super Admin dashboard: client onboarding, subscription/rent tracking, invoice generation for tenants.
- Device approval portal: whitelist Motherboard UUID + MAC address per licensed machine.
- Continuous heartbeat monitoring between client app and central server.
- Automated remote lock-screen ("kill-switch") the instant a blocked/expired client machine regains internet connectivity.

### 7.4 Offline-First Experience
- App must fully initialize and be usable within seconds of launch with **zero internet connection**, after first successful login/activation.
- All CRUD operations (billing, inventory edits, member/order creation) work identically online or offline.
- Local data buffer retains the **most recent 1 year** of transactional data on the client machine (older data remains in the cloud, retrievable on demand); MongoDB Atlas cloud cluster retains **lifetime** data.

### 7.5 Hardware Integration
- Native USB thermal printer detection, selection, and calibration UI.
- Zero-latency ESC/POS-based receipt printing (no browser print dialog).

### 7.6 Auto-Update System
- Silent/background version checks and seamless upgrade delivery via GitHub Releases, with no manual re-installation required by end clients.

## 8. Sample User Stories

- *As a cashier*, I want to complete a sale even when the internet is disconnected, so that customer checkout is never delayed.
- *As a restaurant manager*, I want kitchen staff to see new orders instantly on a KOT screen, so that food preparation starts without a server walking to the kitchen.
- *As a gym owner*, I want to be notified automatically when a member's subscription is about to expire, so that I don't lose renewal revenue.
- *As a garment shop cashier*, I want to select a product's size and color variant from a matrix, so that I never sell the wrong SKU.
- *As a Super Admin*, I want to instantly lock any client's software remotely the moment their rent is overdue and their machine reconnects to the internet, so that non-paying clients cannot continue using the product.
- *As a business owner*, I want my last month of sales data to load instantly even with 500,000+ historical records, so that the software never feels sluggish.

## 9. Non-Functional Expectations (Summary — full detail in SRD)
- Application must not freeze, hang, or white-screen under any single component failure (global error boundaries required).
- Local storage must be encrypted at rest (AES-256).
- UI must remain smooth (target 60fps interactions) even while rendering large virtualized lists.
- Sync/reconciliation must never produce duplicate or lost records.

## 10. Assumptions & Dependencies
- Client machines run Windows 10/11 with a stable local power/hardware environment.
- Client sites have intermittent, not permanently absent, internet access (periodic connectivity is required for sync, licensing checks, and cloud image uploads).
- MongoDB Atlas and Cloudinary accounts are provisioned and billed at the platform level.
- Backend is hosted on Vercel serverless functions, which impose a hard execution time ceiling (~10–15 seconds) per invocation.

## 11. Constraints
- Serverless backend execution-time limits require all bulk/sync operations to be chunked and paginated — no single long-running sync request is permitted.
- Local data retention on-device is capped at 1 year to protect client machine storage/memory.
- All feature access must be governed by tenant-level feature flags (niche selection), never by hard-coded conditionals scattered through the UI.

## 12. Success Metrics / KPIs
- **Zero unplanned data loss** incidents across all tenants (target: 100%).
- **< 1%** of sessions experience an application crash or unrecoverable white screen.
- **< 5 seconds** average time from "internet restored" to "full sync completion" for a typical day's transactional volume.
- **> 99%** on-time detection and enforcement of kill-switch lock for overdue accounts within one heartbeat cycle after reconnection.
- Client onboarding (Super Admin creates tenant → client machine activated) completed in **under 10 minutes**.

## 13. Release Roadmap

| Phase | Scope |
|---|---|
| **Phase 1 (MVP)** | Core POS + Inventory + Roles, one niche fully functional (pilot), offline-first engine, Super Admin basic dashboard, hardware licensing, printer integration |
| **Phase 2** | Remaining two niches fully functional, advanced reporting, multi-branch support, payment gateway integration |
| **Phase 3** | Predictive analytics, mobile companion apps, i18n/multi-language, macOS/Linux builds |

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Local database grows unbounded and degrades performance | Enforce 1-year local retention policy + archive-to-cloud strategy |
| Sync conflicts cause duplicate/lost records | RxDB replication protocol with deterministic conflict resolution (server-timestamp authoritative merge) |
| Piracy / unauthorized redistribution of client software | Hardware-UUID binding + heartbeat kill-switch |
| Serverless timeout during large sync batches | Mandatory chunked/paginated sync design (see TRD) |
| UI feels "template-generated" and unprofessional | Dedicated design system pass using Shadcn/ui + custom Tailwind tokens (see TRD/Rules) |

## 15. Open Questions
- Which niche is targeted for the Phase 1 pilot launch — Gym, Restaurant, or Garments?
- Will Super Admin support tiered pricing plans per tenant, or a flat rent model?
- Is multi-branch (same client, multiple physical locations) required in Phase 1 or deferred to Phase 2?
