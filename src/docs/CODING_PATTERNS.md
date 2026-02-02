# Street Keeper Frontend - Coding Patterns

This document is the single source of truth for coding patterns, conventions, and architecture in the Street Keeper frontend. It is adapted from the backend [CODING_PATTERNS.md](../../backend/src/docs/CODING_PATTERNS.md) for React and Vite. Designed for both human developers and AI assistants.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [File Naming Conventions](#file-naming-conventions)
4. [TypeScript Patterns](#typescript-patterns)
5. [Architecture Layers](#architecture-layers)
6. [Component Patterns](#component-patterns)
7. [Service Layer Patterns](#service-layer-patterns)
8. [Type Definitions](#type-definitions)
9. [Constants & Configuration](#constants--configuration)
10. [Error Handling](#error-handling)
11. [Import/Export Conventions](#importexport-conventions)
12. [Code Documentation](#code-documentation)
13. [Environment Variables](#environment-variables)

---

## Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI library | 19.x |
| **TypeScript** | Language | 5.x |
| **Vite** | Build tool | 7.x |
| **Tailwind CSS** | Styling | 4.x |
| **React Router** | Routing | (when added) |

### Key Configuration

- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Imports**: No `.js` extension in source imports (Vite/TypeScript resolve)
- **Strict Mode**: TypeScript strict mode enabled
- **Env**: `import.meta.env.VITE_*` for environment variables

---

## Project Structure

```
frontend/src/
├── components/
│   └── common/           # Base UI components (design system)
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Textarea.tsx
│       ├── Modal.tsx
│       ├── ThemeToggle.tsx
│       └── index.ts      # Barrel export
├── config/
│   └── constants.ts      # API URL, ROUTES, ERROR_CODES
├── docs/                 # Documentation
│   ├── CODING_PATTERNS.md
│   ├── COMPONENT_GUIDE.md
│   └── DESIGN_TOKENS.md
├── hooks/                # Custom React hooks
│   └── index.ts
├── lib/                  # Utilities and singletons
│   ├── theme.ts          # Theme toggle utility
│   └── api-client.ts     # API client (when added)
├── pages/                # Page components (route targets)
│   └── index.ts
├── services/             # API service modules
│   └── index.ts
├── styles/
│   └── tokens.css        # Design tokens
├── types/                # TypeScript types
│   └── index.ts
├── App.tsx
├── index.css
└── main.tsx
```

### Directory Purposes

| Directory | Purpose | Contains |
|-----------|---------|----------|
| `components/common/` | Design system | Button, Card, Input, Modal, etc. |
| `config/` | Static configuration | Constants, API base URL, route paths |
| `docs/` | Documentation | Coding patterns, component guide, tokens |
| `hooks/` | Custom React hooks | useRoutes, useAuth, etc. |
| `lib/` | Shared utilities | Theme, API client singleton |
| `pages/` | Route-level components | LoginPage, RoutesPage, etc. |
| `services/` | API calls | auth.service, routes.service, etc. |
| `styles/` | Global styles | tokens.css |
| `types/` | TypeScript interfaces | API response types, domain types |

---

## File Naming Conventions

### Pattern: `[feature].[layer].ts` or `[Name].tsx`

| Layer | Pattern | Example |
|-------|---------|---------|
| Services | `*.service.ts` | `auth.service.ts`, `routes.service.ts` |
| Types | `*.types.ts` or in `types/` | `api.types.ts` |
| Components | `PascalCase.tsx` | `Button.tsx`, `ThemeToggle.tsx` |
| Pages | `PascalCase.tsx` | `LoginPage.tsx`, `RoutesPage.tsx` |
| Hooks | `use*.ts` | `useRoutes.ts`, `useAuth.ts` |
| Config | Descriptive | `constants.ts` |

### Rules

1. **Components and pages**: PascalCase (`Button.tsx`, `LoginPage.tsx`)
2. **Services, types, hooks**: lowercase with dots or camelCase (`auth.service.ts`, `useRoutes.ts`)
3. **Singular nouns**: `auth.service.ts` not `auths.service.ts`
4. **Barrel files**: `index.ts` for re-exports (e.g. `components/common/index.ts`)

---

## TypeScript Patterns

### Strict Typing

Always use explicit types. Avoid `any`.

```typescript
// Good
export function Button({ variant = "primary" }: ButtonProps): JSX.Element {
  // ...
}

// Bad
export function Button({ variant }: any) {
  // ...
}
```

### Interface Naming

- Use `PascalCase` for interface names
- Prefix API response types with the feature name
- No `I` prefix (`AuthUser` not `IAuthUser`)

```typescript
// Good
export interface AuthUser { ... }
export interface ApiErrorResponse { ... }

// Bad
export interface IUser { ... }
export interface data { ... }
```

### Type vs Interface

- **Use `interface`** for object shapes
- **Use `type`** for unions, intersections, and aliases

```typescript
export interface AuthUser {
  id: string;
  name: string;
  email?: string | null;
}

export type AuthResponse = AuthSuccessResponse | ApiErrorResponse;
```

### Optional vs Nullable

```typescript
email?: string;           // Optional
email: string | null;    // Nullable
email?: string | null;   // Optional and nullable (API responses)
```

### `as const` for Constants

```typescript
export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
} as const;
```

---

## Architecture Layers

### Frontend Layer Flow

```
Pages (route targets)
    │
    ▼
Hooks (useRoutes, useAuth, etc.)
    │
    ▼
Services (auth.service, routes.service, etc.)
    │
    ▼
API Client (lib/api-client.ts)
    │
    ▼
Backend API
```

### Layer Responsibilities

| Layer | Can Call | Cannot Call |
|-------|----------|-------------|
| Pages | Hooks, components | Services directly (prefer hooks) |
| Hooks | Services, other hooks | API client raw fetch |
| Services | API client | Hooks, components |
| API Client | Backend API | Services (called by services) |

---

## Component Patterns

### Component File Structure

```typescript
/**
 * [ComponentName] Component
 * [Brief description]
 */

import type { ... } from "react";

// ============================================
// Types
// ============================================

export interface ComponentNameProps {
  // ...
}

// ============================================
// Component
// ============================================

export function ComponentName({ ... }: ComponentNameProps) {
  return ( ... );
}
```

### Token-Based Styling

Use Tailwind classes that map to design tokens:

| Tailwind Class | Token | Usage |
|----------------|-------|--------|
| `bg-bg` | `--color-bg` | Page background |
| `bg-surface` | `--color-surface` | Cards, inputs, modals |
| `border-border` | `--color-border` | All borders |
| `text-text` | `--color-text` | Primary text |
| `text-text-muted` | `--color-text-muted` | Secondary text |
| `text-danger` | `--color-danger` | Errors |
| `text-success` | `--color-success` | Success messages |

### Props and Accessibility

- Accept `className` for overrides
- Use semantic HTML (`<button>`, `<label>`, `<input>`)
- Provide `aria-*` and `role` where needed
- Associate labels with inputs via `htmlFor` / `id`
- Error messages: `role="alert"`, `aria-describedby`, `aria-invalid`

---

## Service Layer Patterns

### Service File Structure

```typescript
/**
 * [Feature] Service
 * [Brief description]
 */

import { apiClient } from "../lib/api-client";
import type { SomeResponse } from "../types/api.types";

export const authService = {
  loginWithStrava(): void {
    window.location.href = `${API_BASE}/auth/strava`;
  },

  async getCurrentUser(): Promise<AuthResponse> {
    return apiClient.get<AuthResponse>("/auth/me");
  },
};
```

### Patterns

- **Named exports** for service objects or functions
- **Async/await** for all API calls
- **Typed responses** from `types/api.types.ts`
- **Constants** from `config/constants.ts`

---

## Type Definitions

### Type File Structure

Organize with section comments:

```typescript
/**
 * API Types
 * Single source of truth for API response shapes
 */

// ============================================
// Common Types
// ============================================

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================
// Auth Types
// ============================================

export interface AuthUser {
  id: string;
  name: string;
  email?: string | null;
  // ...
}
```

### Type Categories

| Category | Purpose | Example |
|----------|---------|---------|
| API Response Types | Match backend responses | `AuthSuccessResponse`, `RouteListItem` |
| Request Types | Form data, payloads | `CreateRouteRequest` |
| Internal Types | Component props, hooks | `ButtonProps`, `UseRoutesReturn` |

---

## Constants & Configuration

### Constants File Pattern

```typescript
/**
 * Application Constants
 * Centralized configuration values
 */

export const API = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ROUTES_LIST: "/routes",
  ROUTE_DETAIL: "/routes/:id",
} as const;

export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  // Mirror backend codes used by frontend
} as const;
```

---

## Error Handling

### API Error Shape

Matches backend:

```typescript
interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}
```

### Handling in Components/Hooks

```typescript
try {
  const data = await routesService.getAll();
  setRoutes(data.routes);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.code === "AUTH_REQUIRED") {
      navigate("/login");
    } else {
      setError(error.message);
    }
  }
}
```

---

## Import/Export Conventions

### Import Order

1. React / external packages
2. Internal modules (config, lib, types)
3. Relative imports (components, hooks, services)
4. Type-only imports last

```typescript
import { useState } from "react";
import { API } from "../config/constants";
import { Button } from "../components/common";
import type { AuthUser } from "../types/api.types";
```

### Export Pattern

- **Default export**: App entry, page components (if one per file)
- **Named exports**: Components, hooks, services, types

```typescript
// Component - named export
export function Button({ ... }: ButtonProps) { ... }

// Barrel - re-export named
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
```

### No `.js` in Imports

Vite resolves TypeScript; omit extensions:

```typescript
// Correct
import { initTheme } from "./lib/theme";
import { Button } from "./components/common";

// Not needed
import { initTheme } from "./lib/theme.ts";
```

---

## Code Documentation

### File Headers

Start files with a short JSDoc:

```typescript
/**
 * Button Component
 * Primary interactive element. Uses token-based colors and variants.
 */
```

### Component Documentation

Document props and behavior for non-obvious components:

```typescript
export interface ModalProps {
  /** When false, modal is not rendered */
  isOpen: boolean;
  /** Called on Escape or overlay click */
  onClose: () => void;
  /** Accessible title (aria-labelledby) */
  title: string;
  // ...
}
```

---

## Environment Variables

### Vite Convention

Only variables prefixed with `VITE_` are exposed to the client.

### Required / Optional

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | No | Backend API base | `http://localhost:8000/api/v1` |

### Usage

```typescript
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
```

For type safety, add to `vite-env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}
```

---

## Quick Reference

### Adding a New Feature

1. **Types**: Add to `types/api.types.ts` or create `types/[feature].types.ts`
2. **Service**: Create `services/[feature].service.ts`
3. **Hook** (optional): Create `hooks/use[Feature].ts`
4. **Page**: Create `pages/[Feature]Page.tsx`
5. **Route**: Register in router
6. **Constants**: Add route path to `config/constants.ts` if needed

### Checklist for Code Review

- [ ] Types are explicit (no `any`)
- [ ] Components use token-based Tailwind classes
- [ ] Forms have labels and error handling
- [ ] Accessibility: focus, ARIA, keyboard
- [ ] Imports ordered (React → config/lib → relative → types)
- [ ] New constants in `config/constants.ts`

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01 | 1.0.0 | Initial frontend coding patterns (adapted from backend) |
