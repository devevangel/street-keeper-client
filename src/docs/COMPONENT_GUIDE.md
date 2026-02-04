# Component Guide

This guide describes the base UI components in `src/components/common/`, how to use them, and their accessibility behavior. All components use the design tokens from [DESIGN_TOKENS.md](./DESIGN_TOKENS.md).

---

## Table of Contents

1. [Overview](#overview)
2. [Button](#button)
3. [Card](#card)
4. [Input](#input)
5. [Select](#select)
6. [Textarea](#textarea)
7. [Modal](#modal)
8. [ThemeToggle](#themetoggle)
9. [Layout Components](#layout-components)
10. [Routing Components](#routing-components)
11. [Map Components](#map-components)
12. [Docs Viewer Components](#docs-viewer-components)
13. [Accessibility Summary](#accessibility-summary)

---

## Overview

| Component            | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| **Button**           | Primary actions (submit, cancel, confirm)               |
| **Card**             | Content containers (lists, details, forms)              |
| **Input**            | Single-line text                                        |
| **Select**           | Dropdown choice                                         |
| **Textarea**         | Multi-line text                                         |
| **Modal**            | Dialogs (confirm, forms)                                |
| **ThemeToggle**      | Switch light/dark theme                                 |
| **AppLayout**        | Main shell: header, TabNav, Outlet                      |
| **TabNav**           | Tabs: Home, Projects, Campaign                          |
| **ProtectedRoute**   | Auth guard; redirects to login when not authenticated   |
| **LocationPrompt**   | Geolocation permission UI (loading/error/retry)         |
| **MapStats**         | Summary: total streets, completed, partial              |
| **MapView**          | Interactive Leaflet map (location + street polylines)   |
| **LocationMarker**   | User position circle on map                             |
| **StreetPolyline**   | Single street line on map (green/yellow)                |
| **StreetLayer**      | Renders all street polylines on map                     |
| **StreetList**       | List of streets with expandable stats                   |
| **StreetCard**       | Single street row with status dot and stats             |
| **DocsLayout**       | Layout for in-app docs: header, back link, theme toggle |
| **DocsSidebar**      | Sidebar nav for doc pages (active state)                |
| **MarkdownRenderer** | Renders markdown with syntax highlighting and mermaid   |
| **MermaidDiagram**   | Renders mermaid diagram code blocks                     |

All components accept a `className` prop where applicable. Styling is token-based: `bg-surface`, `border-border`, `text-text`, `text-danger`, etc.

---

## Button

Primary interactive element for user actions.

### Props

| Prop        | Type                                                      | Default     | Description             |
| ----------- | --------------------------------------------------------- | ----------- | ----------------------- |
| `variant`   | `"primary"` \| `"secondary"` \| `"danger"` \| `"success"` | `"primary"` | Visual style            |
| `size`      | `"sm"` \| `"md"` \| `"lg"`                                | `"md"`      | Padding and font size   |
| `type`      | `"button"` \| `"submit"` \| `"reset"`                     | `"button"`  | Native button type      |
| `disabled`  | `boolean`                                                 | -           | Disabled state          |
| `children`  | `ReactNode`                                               | -           | Label content           |
| `className` | `string`                                                  | `""`        | Extra classes           |
| ...         | `ButtonHTMLAttributes`                                    | -           | Any native button props |

### Usage

```tsx
import { Button } from "../components/common";

<Button onClick={handleSave}>Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" type="submit">Delete</Button>
<Button disabled>Loading...</Button>
```

### Accessibility

- Renders a native `<button>` (keyboard, focus, semantics)
- Global focus style applies (`:focus-visible` in `index.css`)
- `disabled` prevents click and shows reduced opacity

---

## Card

Container for grouped content. Uses `bg-surface` and `border-border`.

### Props

| Prop        | Type                                      | Default | Description          |
| ----------- | ----------------------------------------- | ------- | -------------------- |
| `padding`   | `"none"` \| `"sm"` \| `"md"` \| `"large"` | `"md"`  | Inner padding        |
| `children`  | `ReactNode`                               | -       | Content              |
| `className` | `string`                                  | `""`    | Extra classes        |
| ...         | `HTMLAttributes<HTMLDivElement>`          | -       | Any native div props |

### Usage

```tsx
import { Card } from "../components/common";

<Card>
  <h2>Project details</h2>
  <p>...</p>
</Card>

<Card padding="large" className="mt-4">
  ...
</Card>
```

---

## Input

Single-line text input with optional label and error message.

### Props

| Prop        | Type                  | Default     | Description                                             |
| ----------- | --------------------- | ----------- | ------------------------------------------------------- |
| `label`     | `string`              | -           | Accessible label                                        |
| `error`     | `string`              | -           | Error message (sets `aria-invalid`, `aria-describedby`) |
| `required`  | `boolean`             | -           | Required field (shows \* and sets attribute)            |
| `id`        | `string`              | (generated) | Id for label and input (optional)                       |
| `className` | `string`              | `""`        | Extra classes on input                                  |
| ...         | `InputHTMLAttributes` | -           | Native input props                                      |

### Usage

```tsx
import { Input } from "../components/common";

<Input
  label="Project name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>

<Input
  label="Email"
  type="email"
  error={errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
```

### Accessibility

- `<label htmlFor={id}>` associated with input
- `aria-invalid` when `error` is set
- `aria-describedby` points to error message element
- Error message has `role="alert"`
- Required indicator has `aria-hidden` so screen readers use native required state

---

## Select

Native `<select>` with optional label and error.

### Props

| Prop        | Type                                 | Default     | Description             |
| ----------- | ------------------------------------ | ----------- | ----------------------- |
| `label`     | `string`                             | -           | Accessible label        |
| `error`     | `string`                             | -           | Error message           |
| `options`   | `{ value: string; label: string }[]` | -           | Options list            |
| `required`  | `boolean`                            | -           | Required field          |
| `id`        | `string`                             | (generated) | Id for label and select |
| `className` | `string`                             | `""`        | Extra classes on select |
| ...         | `SelectHTMLAttributes`               | -           | Native select props     |

### Usage

```tsx
import { Select } from "../components/common";

<Select
  label="Radius"
  options={[
    { value: "500", label: "500 m" },
    { value: "1000", label: "1 km" },
    { value: "2000", label: "2 km" },
  ]}
  value={radius}
  onChange={(e) => setRadius(e.target.value)}
  required
/>;
```

### Accessibility

- Same label/error/aria pattern as Input

---

## Textarea

Multi-line text input with optional label and error.

### Props

| Prop        | Type                     | Default     | Description               |
| ----------- | ------------------------ | ----------- | ------------------------- |
| `label`     | `string`                 | -           | Accessible label          |
| `error`     | `string`                 | -           | Error message             |
| `rows`      | `number`                 | `3`         | Default rows              |
| `required`  | `boolean`                | -           | Required field            |
| `id`        | `string`                 | (generated) | Id for label and textarea |
| `className` | `string`                 | `""`        | Extra classes             |
| ...         | `TextareaHTMLAttributes` | -           | Native textarea props     |

### Usage

```tsx
import { Textarea } from "../components/common";

<Textarea
  label="Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={5}
/>;
```

### Accessibility

- Same label/error/aria pattern as Input

---

## Modal

Dialog overlay with title and close behavior.

### Props

| Prop       | Type                          | Default | Description                               |
| ---------- | ----------------------------- | ------- | ----------------------------------------- |
| `isOpen`   | `boolean`                     | -       | When false, nothing is rendered           |
| `onClose`  | `() => void`                  | -       | Called on Escape or overlay click         |
| `title`    | `string`                      | -       | Dialog title (used for `aria-labelledby`) |
| `size`     | `"sm"` \| `"md"` \| `"large"` | `"md"`  | Max width of content box                  |
| `children` | `ReactNode`                   | -       | Body content                              |

### Usage

```tsx
import { Modal, Button } from "../components/common";

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open</Button>
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Confirm delete"
  size="sm"
>
  <p>Are you sure?</p>
  <Button variant="danger" onClick={handleDelete}>Delete</Button>
</Modal>
```

### Accessibility

- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` points to title (stable id via `useId()`)
- Escape key calls `onClose`
- Body scroll locked while open
- Overlay click calls `onClose`; content click does not
- Close control has `aria-label="Close modal"`

---

## ThemeToggle

Button that toggles light/dark theme and persists to `localStorage`.

### Props

None. Uses `lib/theme.ts`: `toggleTheme()`, `getTheme()`.

### Usage

```tsx
import { ThemeToggle } from "../components/common";

<header>
  <ThemeToggle />
</header>;
```

### Accessibility

- Native `<button>` with `aria-label`: "Switch to light mode" or "Switch to dark mode"
- `title` matches for tooltip

---

## Layout Components

### AppLayout

Main layout for authenticated app: header (app name, user, theme toggle, logout), TabNav, and `<Outlet />` for nested route content.

**Usage:** Wrap protected routes in a route that renders `<AppLayout />`; children render in the Outlet.

```tsx
<Route
  element={
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<HomePage />} />
  <Route path="projects" element={<ProjectsPage />} />
</Route>
```

Uses `useAuth()` for `user` and `logout`. Renders `ThemeToggle` and logout `Button` from common.

### TabNav

Horizontal tab navigation: Home, Projects, Campaign. Uses React Router `NavLink`; active tab has bottom border (`border-accent`).

**Usage:** Rendered inside AppLayout; no props.

```tsx
<header>...</header>
<TabNav />
<main><Outlet /></main>
```

Accessibility: `<nav aria-label="Main navigation">`, list of links.

---

## Routing Components

### ProtectedRoute

Wraps children; redirects to `/login` when not authenticated. Shows "Loading..." while auth is being checked.

**Props:** `children: ReactNode`

**Usage:** Wrap the layout that contains protected pages.

```tsx
<Route
  element={
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<HomePage />} />
</Route>
```

Uses `useAuth()` for `isAuthenticated` and `isLoading`. Passes `state={{ from: location }}` to Navigate so login can redirect back after auth.

---

## Map Components

Used on the Home page to show streets the user has run (completed = green, partial = yellow). The map uses Leaflet with OpenStreetMap tiles; polylines and the location marker are drawn on top.

### MapView

Interactive map container. Renders OpenStreetMap tiles, the user's location marker, and street polylines (green = completed, yellow = partial). Requires a wrapper with explicit height (e.g. `h-[400px]`).

**Props:**

| Prop        | Type                                   | Description                                          |
| ----------- | -------------------------------------- | ---------------------------------------------------- |
| `position`  | `{ lat: number; lng: number } \| null` | User's current position; map centers here when set   |
| `streets`   | `MapStreet[]`                          | Streets from GET /map/streets to draw as polylines   |
| `className` | `string`                               | Optional; default `h-[400px] w-full` for wrapper div |

**Usage:** On HomePage above MapStats.

```tsx
<MapView position={position} streets={streets} />
```

**Accessibility:** Map is decorative/supplementary; primary street info is in the list below. Popups on marker and polylines provide text labels.

### LocationMarker

User's current position on the map as a circle marker with popup "Your location". Used inside `MapContainer`; returns null when position is null.

**Props:** `position: { lat: number; lng: number } | null`

**Usage:** Rendered inside MapView; do not use outside `MapContainer`.

### StreetPolyline

Renders one street's geometry as a colored polyline. Green = completed, yellow = partial. Popup shows street name, percentage, and run count.

**Props:** `street: MapStreet`

**Usage:** Usually via StreetLayer; must be inside `MapContainer`. Coordinates are converted from GeoJSON `[lng, lat]` to Leaflet `[lat, lng]` internally.

### StreetLayer

Renders all street polylines. Maps over `streets` and renders one `StreetPolyline` per street. Returns null when `streets` is empty (map still shows user location).

**Props:** `streets: MapStreet[]`

**Usage:** Rendered inside MapView.

### LocationPrompt

Shows "Requesting your location..." while waiting for geolocation, or an error Card with "Try again" when permission is denied or unavailable.

**Props:**

| Prop        | Type             | Description                              |
| ----------- | ---------------- | ---------------------------------------- |
| `isLoading` | `boolean`        | True while waiting for permission/result |
| `error`     | `string \| null` | Error message if denied or unavailable   |
| `onRetry`   | `() => void`     | Called when user clicks "Try again"      |

**Usage:** Render when geolocation is needed (e.g. before fetching map streets).

```tsx
const { position, error, isLoading, requestPermission } = useGeolocation();
if (isLoading || error) {
  return (
    <LocationPrompt
      isLoading={isLoading}
      error={error}
      onRetry={requestPermission}
    />
  );
}
```

### MapStats

Summary line: total streets in area, completed count (green), partial count (yellow).

**Props:** `totalStreets: number`, `completedCount: number`, `partialCount: number`

**Usage:** Above the street list on HomePage.

```tsx
<MapStats
  totalStreets={data.totalStreets}
  completedCount={data.completedCount}
  partialCount={data.partialCount}
/>
```

### StreetList

Renders a list of StreetCard components. One street can be expanded at a time to show stats.

**Props:**

| Prop             | Type                      | Description                       |
| ---------------- | ------------------------- | --------------------------------- |
| `streets`        | `MapStreet[]`             | Streets from GET /map/streets     |
| `expandedOsmId`  | `string \| null`          | OSM ID of expanded street         |
| `onToggleExpand` | `(osmId: string) => void` | Called when user toggles a street |

**Usage:** On HomePage after fetching map data.

```tsx
<StreetList
  streets={streets}
  expandedOsmId={expandedOsmId}
  onToggleExpand={(id) => setExpandedOsmId((x) => (x === id ? null : id))}
/>
```

### StreetCard

Single street row: status dot (green = completed, yellow = partial), name, percentage, run count. Click to expand/collapse stats (type, length, run count, completion count, first/last run dates).

**Props:** `street: MapStreet`, `isExpanded: boolean`, `onToggle: () => void`

**Usage:** Usually via StreetList; can be used standalone for a single street.

Accessibility: `aria-expanded`, `aria-controls`, `aria-labelledby`, `role="region"` on stats section.

---

## Docs Viewer Components

Used for the in-app documentation viewer at `/docs`. Renders markdown from `src/docs/` with syntax highlighting and mermaid diagrams.

### DocsLayout

Layout for the docs section: header with "Street Keeper Docs" title, "Back to app" link, and ThemeToggle. Renders `<Outlet />` for the doc content. No TabNav.

**Usage:** Wrap docs routes in the router.

### DocsSidebar

Sidebar navigation listing all doc pages. Uses `NavLink` for active state. Optional `isOpen` and `onNavigate` for mobile (collapsible sidebar).

**Props:** `isOpen?: boolean`, `onNavigate?: () => void`

**Usage:** Rendered inside DocsPage; links to `/docs` (first doc) and `/docs/:slug`.

### MarkdownRenderer

Renders raw markdown with **remark-gfm** (tables, etc.), **rehype-highlight** (syntax highlighting), and custom components for headings (with anchor IDs), code blocks (mermaid vs highlighted code), tables, and links.

**Props:** `content: string` (raw markdown)

**Usage:** Pass doc content from DocsPage.

### MermaidDiagram

Renders mermaid diagram source using mermaid.js. Handles dark/light theme. Shows loading state and error message on failure.

**Props:** `chart: string` (mermaid code), `id?: string`

**Usage:** Used inside MarkdownRenderer for ` ```mermaid ` code blocks.

---

## Accessibility Summary

| Requirement        | How it’s met                                                          |
| ------------------ | --------------------------------------------------------------------- |
| **Color contrast** | Tokens chosen for WCAG AA; verify in DESIGN_TOKENS / contrast checker |
| **Focus**          | Global `:focus-visible` outline (3px, offset 2px) in `index.css`      |
| **Keyboard**       | Buttons and form controls are focusable; Modal closes on Escape       |
| **Labels**         | Input, Select, Textarea support `label` and `htmlFor`/`id`            |
| **Errors**         | `aria-invalid`, `aria-describedby`, and `role="alert"` on error text  |
| **Dialogs**        | Modal uses `role="dialog"`, `aria-modal`, `aria-labelledby`           |
| **Reduced motion** | Handled in tokens.css via `prefers-reduced-motion`                    |

When adding new components, keep using token-based classes and the same label/error/ARIA patterns as Input and Select.
