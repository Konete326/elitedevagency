# Unified POS Engine — Multi-Niche Offline-First SaaS Platform

> **MERN + Electron + RxDB** — One engine. Three niches. Zero data loss.

---

## Overview

A single-codebase, multi-tenant, offline-first Point of Sale and business management platform delivered as a native **Electron desktop application**. One binary serves three distinct business verticals — **Gyms, Restaurants, and Garment/Retail shops** — through feature-flagging and modular component loading.

The platform operates **fully offline** using a local reactive database (RxDB over IndexedDB) and synchronizes automatically to a cloud backend (MongoDB Atlas) the moment internet connectivity is restored — with zero manual intervention, zero data duplication, and zero crashes.

---

## Architecture

```
┌─────────────────────────── Electron App ───────────────────────────┐
│                                                                      │
│   ┌──────────────── Renderer Process (React + Vite) ─────────────┐  │
│   │  Shadcn/ui + Tailwind CSS (niche-aware theming)              │  │
│   │  Zustand (UI state)  │  TanStack Query (server cache)        │  │
│   │  RxDB / IndexedDB ── Reactive Queries ── Replication Plugin  │  │
│   └──────────────────────────────┬────────────────────────────────┘  │
│                                  │ IPC (chunked)                     │
│   ┌──────────────────────── Main Process ────────────────────────┐   │
│   │  Hardware UUID / MAC reader │ ESC/POS printer │ Auto-Update  │   │
│   └──────────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │ HTTPS
               ┌──────────────────▼──────────────────┐
               │   Node / Express API (Vercel)        │
               │   Controller → Service → Repository  │
               │   Zod validation · Helmet · CORS     │
               └──────────────────┬──────────────────┘
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            Super Admin DB   Per-Tenant DB   Cloudinary
            (MongoDB Atlas)  (MongoDB Atlas)  (media CDN)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron (latest stable) |
| Frontend Build | Vite |
| Frontend Framework | React |
| UI Components | Shadcn/ui + Tailwind CSS v4 |
| Icons | Lucide React |
| Client State | Zustand |
| Server-State Cache | TanStack Query v5 |
| Local Database | RxDB (Dexie / IndexedDB adapter) |
| Local Encryption | RxDB crypto-plugin (AES-256) |
| List Virtualization | react-window |
| Toasts | Sonner |
| Backend Runtime | Node.js LTS |
| Backend Framework | Express |
| Validation | Zod |
| ODM | Mongoose |
| Database | MongoDB Atlas |
| Media Storage | Cloudinary |
| Logging | Winston |
| Security | Helmet + explicit CORS allow-list |
| Hosting (API) | Vercel Serverless Functions |
| Printer Protocol | ESC/POS (Electron main process) |
| Auto-Update | electron-updater + GitHub Releases |

---

## Project Structure

```
elitedevagency/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # Global atoms (Button, Modal, LockScreen)
│       ├── features/          # Niche-scoped feature modules
│       │   ├── billing/       # Shared POS/cart logic
│       │   ├── analytics/     # Sales reports (offline RxDB-driven)
│       │   ├── inventory/     # Product management
│       │   ├── settings/      # Printer config, preferences
│       │   └── superadmin/    # Tenant management dashboard
│       ├── hooks/             # Shared custom hooks (useHeartbeat, useOrderAnalytics)
│       ├── store/             # Zustand stores (useAuthStore, useLicenseStore)
│       ├── db/                # RxDB initialization and schema definitions
│       └── lib/               # Sync engine, TanStack Query client
├── server/                    # Node/Express backend
│   └── src/
│       ├── controllers/       # HTTP layer (parse → call service → respond)
│       ├── services/          # All business logic (isolated, testable)
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Zod-validated route declarations
│       ├── middlewares/       # auth, validate, superadmin, error
│       └── utils/             # logger, generateToken
├── desktop/                   # Electron main + preload processes
└── docs/                      # PRD, TRD, SRD, RULES
```

---

## Key Features

### Offline-First Engine
- App initializes against local RxDB on launch — **zero network dependency** for core operations
- All CRUD writes go to RxDB first; UI updates reactively via observable subscriptions
- Automatic push/pull sync via RxDB Replication Plugin the moment connectivity returns
- Deterministic conflict resolution: server `updatedAt` timestamp is authoritative

### Multi-Niche via Feature Flags
- One binary, three verticals: **Gym** (memberships, attendance, trainers), **Restaurant** (tables, KOT, order types), **Garments** (size×color SKU matrix, barcodes, alterations)
- Niche context is resolved at login; inactive modules never load

### SaaS Licensing & Kill-Switch
- Device fingerprinted via **Motherboard UUID + MAC address** (Electron main process)
- Continuous heartbeat; server responds with lock signal the instant an overdue account reconnects
- Full-screen lock state that persists across app restarts until reinstated

### Niche-Specific Theming
- CSS variables (`--accent-niche`, `--ring`) applied at `:root` based on tenant niche
- Super Admin can override with fully custom brand colors (light + dark mode) per tenant
- Gym → emerald green · Restaurant → orange-red · Garments → gold

### Sales Analytics (Offline-First)
- Revenue, order count, avg order value, and top-5 products calculated live from local RxDB
- Zero cloud API calls — works fully offline

### Hardware Printing
- Native ESC/POS receipt printing via Electron main process
- No browser print dialog exposed to users

---

## Getting Started

### Prerequisites
- Node.js LTS
- MongoDB Atlas cluster (or local MongoDB for dev)
- Cloudinary account

### Environment Setup

**Server** (`server/.env`):
```
MONGODB_SUPERADMIN_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CORS_ALLOWED_ORIGINS=
NODE_ENV=development
LOG_LEVEL=info
```

**Client** (`client/.env`):
```
VITE_API_BASE_URL=http://localhost:5000
```

### Development

```bash
# Start the backend
cd server && npm install && npm run dev

# Start the frontend (Vite dev server)
cd client && npm install && npm run dev

# Start Electron (when wiring to the Vite dev server)
cd desktop && npm install && npm start
```

---

## API Conventions

- **Base path**: `/api/v1/`
- **Response envelope**: `{ success: boolean, data: any, message: string, meta?: { page, limit, total } }`
- **Pagination**: all list endpoints accept `page` / `limit` query params
- **Sync endpoints**: `POST /api/sync/push` · `GET /api/sync/pull?checkpoint=&limit=`

---

## Development Rules

All contributors (human and AI agents) must follow [`docs/04-RULES-Project-Development-Rules.md`](./docs/04-RULES-Project-Development-Rules.md). Key constraints:

- No `px` units for layout — Tailwind spacing tokens + `clamp()` only
- No `alert()` / `confirm()` — Global Modal Manager (Zustand-driven) only
- No `useEffect` fetch loops — TanStack Query only for server state
- Frontend files: ≤ 300 lines soft / 500 hard limit before mandatory refactor
- Backend files: ≤ 120 lines
- No comments in source code — self-documenting naming required
- All animations: `transform` / `opacity` only (GPU-accelerated)

---

## License

Proprietary — All rights reserved. Unauthorized redistribution is prohibited.
