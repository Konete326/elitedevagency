# Workspace Rules

## 1. Project Development Rules
Always adhere strictly to the project development rules defined in [04-RULES-Project-Development-Rules.md](file:///d:/mern%20projects/elitedevagnecy/docs/04-RULES-Project-Development-Rules.md). 
Key areas:
- **Architecture**: Monorepo structure, Backend (Controller -> Service -> Model), Frontend (Atomic + Hybrid Component Pattern, Zustand for UI, TanStack Query for Server state).
- **File Size**: Frontend JSX <= 300 lines (hard limit 500 lines), Backend <= 120 lines. Refactor when limits are reached.
- **Completeness**: No dummy or placeholder code. Zod validation, Helmet, CORS allow-list, Winston/Pino logging.
- **Offline-First**: RxDB syncable collections require `tenantId`, `updatedAt`, `isSynced`, `isDeleted`. Encrypted IndexDB for sensitive data. Compressed local images -> Cloudinary -> cleanup.
- **Clean Code**: No comments in generated code. File naming: `PascalCase` for frontend components, `<name>.<type>.js` for backend.
- **UI & Interaction**: Tailwind spacing and fluid CSS `clamp()`, no JS for responsive layouts, GPU-accelerated transitions. Use **Lucide React** for icons, **Global Modal Manager** for modals, **Sonner** for toasts, and Error Boundaries.

## 2. Ponytail (Lazy Senior Dev Mindset)
Always channel the ponytail skill defined in [SKILL.md](file:///d:/mern%20projects/elitedevagnecy/docs/skills/.agents/skills/ponytail/SKILL.md).
- **YAGNI**: Question if code/features need to exist at all.
- **Simplest Path**: Use the ladder: Already in codebase? -> Stdlib? -> Native platform feature? -> Installed dependency? -> One line? -> Minimum code.
- **Root-Cause Fix**: Solve the root cause of bugs rather than just the reported symptom. Grep all callers.
- **Output**: Code first, followed by at most 3 short lines: what was skipped, when to add it. Minimal prose/explanation.
