# Street Keeper — Main Styling & Code Quality Guide

**Purpose:** This guide ensures every page, component, and code file in Street Keeper follows the same patterns, styling rules, and code quality standards. Use this as a checklist when creating new features or auditing existing code.

**How to Use:** Work through each section's checklist. Every applicable box must be checked before a page or component is considered complete.

---

## Table of Contents

1. [Pre-Work Checklist](#1-pre-work-checklist)
2. [File & Folder Structure](#2-file--folder-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Component Architecture](#4-component-architecture)
5. [Spacing System](#5-spacing-system)
6. [Typography](#6-typography)
7. [Buttons](#7-buttons)
8. [Cards](#8-cards)
9. [Lists](#9-lists)
10. [Forms & Inputs](#10-forms--inputs)
11. [Data Display & Metrics](#11-data-display--metrics)
12. [Feedback & System Status](#12-feedback--system-status)
13. [Navigation](#13-navigation)
14. [Accessibility](#14-accessibility)
15. [Code Documentation](#15-code-documentation)
16. [Code Quality & Cleanup](#16-code-quality--cleanup)
17. [Final Review Checklist](#17-final-review-checklist)

---

## 1. Pre-Work Checklist

Before writing any code, complete this checklist:

### Planning
- [ ] **Identify reusable components** — Does a component already exist that does what I need? Check `src/components/common/` first.
- [ ] **Check for similar patterns** — Is there an existing page with similar layout or functionality I should follow?
- [ ] **Define data requirements** — What data does this page/component need? Is there an existing hook or service?
- [ ] **Sketch the hierarchy** — What is the primary metric/action? What is secondary? What is meta?

### Component Audit
- [ ] **Search before creating** — Run a search for similar functionality before creating new code.
- [ ] **Extend, don't duplicate** — If a component almost does what you need, extend it with props rather than copying it.
- [ ] **Document gaps** — If existing components are insufficient, document why before creating new ones.

---

## 2. File & Folder Structure

### Directory Organisation
```
src/
├── components/
│   ├── common/           # Reusable UI components (Button, Card, Input, etc.)
│   ├── homepage/         # Homepage-specific composed components
│   ├── projects/         # Project-specific composed components
│   ├── map/              # Map-related components
│   └── [feature]/        # Feature-specific composed components
├── contexts/             # React contexts (global state)
├── hooks/                # Custom hooks
├── pages/                # Page components (one per route)
├── services/             # API service functions
├── types/                # TypeScript type definitions
├── utils/                # Pure utility functions
├── styles/               # Global styles and tokens
└── docs/                 # Documentation files
```

### File Placement Checklist
- [ ] **Common components** go in `components/common/` — these are used across multiple features.
- [ ] **Feature components** go in `components/[feature]/` — these are specific to one feature but may have multiple parts.
- [ ] **Page components** go in `pages/` — one file per route, minimal logic, delegates to child components.
- [ ] **Hooks** go in `hooks/` — named `use[Purpose].ts` (e.g., `useGeolocation.ts`).
- [ ] **Services** go in `services/` — named `[resource].service.ts` (e.g., `projects.service.ts`).
- [ ] **Types** go in `types/` — named `[domain].types.ts` (e.g., `api.types.ts`).
- [ ] **Utilities** go in `utils/` — pure functions with no side effects.

### Index Files
- [ ] **Every component folder has an `index.ts`** that exports public components.
- [ ] **Imports use the folder path**, not direct file paths (e.g., `from "../components/common"` not `from "../components/common/Button"`).

---

## 3. Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| React Component | `PascalCase.tsx` | `ProjectCard.tsx` |
| Hook | `use[Purpose].ts` | `useMapStreets.ts` |
| Service | `[resource].service.ts` | `activities.service.ts` |
| Utility | `[purpose].ts` or `[purpose].util.ts` | `format-distance.ts` |
| Types | `[domain].types.ts` | `api.types.ts` |
| Constants | `constants.ts` or `[domain].constants.ts` | `routes.constants.ts` |
| Test | `[filename].test.ts` or `[filename].spec.ts` | `Button.test.tsx` |

### File Naming Checklist
- [ ] **Component files use PascalCase** — `ProjectCardWithStreets.tsx`
- [ ] **Non-component files use kebab-case** — `format-distance.ts`
- [ ] **Test files sit next to their source** — `Button.tsx` and `Button.test.tsx` in same folder
- [ ] **No generic names** — avoid `utils.ts`, `helpers.ts`, `misc.ts`

### Functions

**Rule: Function names must clearly state what the function does. Length does not matter; clarity does.**

| Bad | Good | Why |
|-----|------|-----|
| `handleClick` | `handleSyncActivitiesButtonClick` | States exactly what is being handled |
| `getData` | `fetchProjectStreetsFromApi` | States what data and where from |
| `process` | `convertGpxCoordinatesToMapSegments` | States transformation |
| `update` | `updateProjectCompletionPercentage` | States what is being updated |
| `calc` | `calculateHaversineDistanceBetweenPoints` | States the calculation |
| `format` | `formatDistanceInUserPreferredUnits` | States the format type |
| `check` | `checkIfStreetMeetsCompletionThreshold` | States the condition |
| `get` | `getActiveProjectsForCurrentUser` | States filter criteria |

### Function Naming Checklist
- [ ] **Verb-first naming** — functions start with a verb: `fetch`, `calculate`, `handle`, `format`, `validate`, `convert`, `check`, `get`, `set`, `create`, `update`, `delete`, `render`
- [ ] **Boolean functions use `is`, `has`, `should`, `can`** — `isStreetCompleted`, `hasUserLocation`, `shouldShowEmptyState`
- [ ] **Event handlers use `handle[Event]`** — `handleStreetCardClick`, `handleSyncButtonPress`
- [ ] **No abbreviations** — `calculateDistanceBetweenCoordinates` not `calcDistCoords`
- [ ] **Async functions indicate data source** — `fetchFromApi`, `loadFromCache`, `syncWithStrava`

### Variables

| Bad | Good | Why |
|-----|------|-----|
| `data` | `projectStreetsList` | States what the data is |
| `res` | `apiResponse` or `projectsResponse` | States what response |
| `temp` | `unsavedStreetChanges` | States purpose |
| `arr` | `completedStreetIds` | States contents |
| `obj` | `userPreferencesConfig` | States structure |
| `flag` | `isLoadingProjectData` | States meaning |
| `cb` | `onStreetSelectionChange` | States when called |

### Variable Naming Checklist
- [ ] **Booleans start with `is`, `has`, `should`, `can`** — `isLoading`, `hasError`, `shouldRefetch`
- [ ] **Arrays are plural** — `streets`, `projects`, `coordinates`
- [ ] **Objects describe their shape** — `userLocation`, `projectConfig`, `syncResult`
- [ ] **No single-letter variables** except `i`, `j`, `k` in short loops
- [ ] **Constants are SCREAMING_SNAKE_CASE** — `DEFAULT_RADIUS`, `MIN_FETCH_DISTANCE_M`

### Components

| Bad | Good | Why |
|-----|------|-----|
| `Card` (in feature folder) | `ProjectSummaryCard` | Distinguishes from common Card |
| `List` | `StreetListWithFilters` | States what list contains |
| `Modal` (in feature folder) | `ConfirmDeleteProjectModal` | States purpose |
| `Button` (in feature folder) | `SyncActivitiesButton` | States action |

### Component Naming Checklist
- [ ] **Common components are generic** — `Button`, `Card`, `Input`, `Modal`
- [ ] **Feature components are specific** — `ProjectStreetsList`, `ActivitySyncButton`
- [ ] **Composed components describe composition** — `ProjectCardWithStreets`, `MapWithLegend`
- [ ] **No redundant suffixes** — `ProjectCard` not `ProjectCardComponent`

---

## 4. Component Architecture

### Reusability Principles

**Rule: Every piece of UI that appears more than once must be a shared component.**

### Component Categories

| Category | Location | Purpose | Example |
|----------|----------|---------|---------|
| **Primitive** | `common/` | Basic building blocks, maximum reusability | `Button`, `Card`, `Input` |
| **Composite** | `common/` | Combines primitives, still reusable | `MetricBlock`, `ProgressBar`, `EmptyState` |
| **Feature** | `[feature]/` | Specific to one feature, uses primitives/composites | `ProjectCard`, `StreetListItem` |
| **Page** | `pages/` | Route entry point, orchestrates data & layout | `HomePage`, `ProjectDetailPage` |

### Component Structure Checklist
- [ ] **Single responsibility** — each component does one thing well
- [ ] **Props over internal state** — components are controlled when possible
- [ ] **Composition over configuration** — use children and slots, not mega-props
- [ ] **No business logic in common components** — common components are pure UI
- [ ] **Feature components handle feature logic** — data fetching, transformations
- [ ] **Page components orchestrate** — fetch data, pass to children, handle routing

### Before Creating a New Component
- [ ] **Check `common/` folder** — does a primitive exist?
- [ ] **Check feature folders** — does a similar feature component exist?
- [ ] **Can an existing component be extended?** — add a variant prop instead of duplicating
- [ ] **Is this truly reusable?** — if used once, maybe it doesn't need its own file

### Component File Structure

Every component file should follow this structure:

```tsx
/**
 * ComponentName
 * Brief description of what this component does.
 * 
 * @example
 * <ComponentName prop="value" />
 */

import { dependencies } from "locations";

// Types
interface ComponentNameProps {
  /** Description of prop */
  requiredProp: string;
  /** Description of optional prop */
  optionalProp?: number;
}

// Constants (if any, component-specific)
const COMPONENT_SPECIFIC_CONSTANT = "value";

// Helper functions (if any, component-specific)
function helperFunction() { }

// Component
export function ComponentName({ 
  requiredProp, 
  optionalProp = defaultValue 
}: ComponentNameProps) {
  // Hooks first
  // State second
  // Effects third
  // Handlers fourth
  // Render
  return ( );
}
```

### Component Checklist
- [ ] **JSDoc comment at top** with description and example
- [ ] **Props interface exported** if component is in `common/`
- [ ] **Props have JSDoc comments** for non-obvious props
- [ ] **Default values for optional props** in destructuring
- [ ] **Hooks at top** of function body
- [ ] **No inline function definitions in JSX** — define handlers above return

---

## 5. Spacing System

### The 8px Grid

**Rule: Every spacing value must be a multiple of 4px, preferably 8px.**

| Token | Value | Tailwind | Use For |
|-------|-------|----------|---------|
| `--space-1` | 4px | `p-1`, `gap-1` | Icon padding, tight gaps |
| `--space-2` | 8px | `p-2`, `gap-2` | Small component padding |
| `--space-3` | 12px | `p-3`, `gap-3` | List item padding |
| `--space-4` | 16px | `p-4`, `gap-4` | Card padding, section gaps |
| `--space-6` | 24px | `p-6`, `gap-6` | Large card padding |
| `--space-8` | 32px | `p-8`, `gap-8` | Section separation |
| `--space-12` | 48px | `p-12`, `gap-12` | Page-level breathing room |

### Forbidden Values
- `gap-1.5` (6px) — off grid
- `gap-2.5` (10px) — off grid
- `gap-3.5` (14px) — off grid
- `p-1.5`, `p-2.5`, `p-3.5` — off grid
- `m-1.5`, `m-2.5`, `m-3.5` — off grid

### Spacing Checklist
- [ ] **All padding values are on the 4px/8px grid** — `p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`
- [ ] **All margin values are on the 4px/8px grid** — same as above
- [ ] **All gap values are on the 4px/8px grid** — `gap-1`, `gap-2`, `gap-3`, `gap-4`
- [ ] **Card padding is 16px or 24px** — `p-4` or `p-6`
- [ ] **List item padding is 12px vertical, 16px horizontal** — `px-4 py-3`
- [ ] **Section separation is 24px or 32px** — `gap-6` or `gap-8`
- [ ] **No arbitrary spacing values** — avoid `p-[13px]` or similar

### Spacing Application
- [ ] **Inside cards:** `p-4` (16px) for compact, `p-6` (24px) for spacious
- [ ] **Between cards:** `gap-4` (16px)
- [ ] **Between sections:** `gap-6` (24px) or `gap-8` (32px)
- [ ] **List item height:** minimum 56px with `py-3 px-4` (48px target + text)
- [ ] **Screen edge padding:** `px-4` (16px) on mobile

---

## 6. Typography

### Type Scale

| Token | Size | Tailwind | Use For |
|-------|------|----------|---------|
| `--font-size-sm` | 14px | `text-sm` | Meta info, timestamps, labels |
| `--font-size-base` | 16px | `text-base` | Body text, secondary metrics |
| `--font-size-lg` | 18px | `text-lg` | Section titles |
| `--font-size-xl` | 24px | `text-xl` | Primary metrics |
| `--font-size-2xl` | 32px | `text-2xl` | Hero metrics (summary screens only) |

### Font Weights
- **Regular (400):** `font-normal` — body text, secondary info
- **Medium (500/600):** `font-medium` or `font-semibold` — titles, emphasis
- **Bold (700):** `font-bold` — primary metrics ONLY (use sparingly)

### Typography Hierarchy

```
Level 1: Section Title    — text-base font-semibold (16px, 600)
Level 2: Primary Metric   — text-xl font-bold (24px, 700)
Level 3: Secondary Metric — text-base font-normal (16px, 400)
Level 4: Meta Info        — text-sm text-text-muted (14px, muted)
```

### Typography Checklist
- [ ] **Maximum 4 font sizes per screen** — if using more, simplify
- [ ] **Only one bold (700) element per card** — the primary metric
- [ ] **Section titles use medium weight**, not bold — `font-semibold`
- [ ] **Meta info is muted** — `text-text-muted`
- [ ] **Numbers are larger than their labels** — "42" bigger than "streets completed"
- [ ] **No decorative text styling** — no italics, no underlines except links

### Text Patterns

**Metric Display (REQUIRED pattern for all numeric data):**
```tsx
// CORRECT: Label above, number large
<div>
  <span className="text-sm text-text-muted">Streets Completed</span>
  <span className="text-xl font-bold">42</span>
</div>

// INCORRECT: Sentence format
<p>You have completed 42 streets.</p>
```

**Progress Display (REQUIRED pattern):**
```tsx
// CORRECT: Number with context
<span className="text-xl font-bold">42</span>
<span className="text-sm text-text-muted">of 128 streets</span>

// INCORRECT: Inline without hierarchy
<span className="text-sm">42 / 128 streets</span>
```

---

## 7. Buttons

### Button Variants

| Variant | Use For | Visual Style |
|---------|---------|--------------|
| `primary` | Main action (1 per screen) | Filled, high contrast |
| `secondary` | Supporting actions | Outlined or subtle fill |
| `ghost` | Low-commitment (cancel, skip) | Text only, no border |
| `danger` | Destructive actions | Red/warning colour |

### Button Sizes

| Size | Min Height | Padding | Use For |
|------|------------|---------|---------|
| `sm` | 44px | `py-2.5 px-4` | Compact contexts (still meets touch target) |
| `md` | 48px | `py-3 px-6` | Default, most buttons |
| `lg` | 56px | `py-4 px-8` | Primary CTA on summary screens |

**Critical: All buttons must be at least 44px tall for touch targets.**

### Button appearance (distinct from containers)

- **Border radius:** 8px (`rounded-lg`). Buttons use subtle rounding so they are clearly interactive and distinct from cards/containers, which stay sharp (no radius).
- **Do not** use sharp corners (0 radius) on buttons — that makes them look like plain bordered divs.

### Button Labels

**Rule: Button labels must be verb phrases that describe the action outcome.**

| Bad | Good |
|-----|------|
| "Submit" | "Save Project" |
| "OK" | "Confirm Delete" |
| "Cancel" | "Keep Project" (when alongside delete) |
| "Yes" | "Delete Street" |
| "No" | "Cancel" |
| "Strava" | "Sync Activities from Strava" |
| "Upload" | "Upload GPX File" |

### Button Checklist
- [ ] **Border radius 8px** — all buttons use `rounded-lg`; never sharp corners
- [ ] **Only ONE primary button per screen** — if you have two, make one secondary
- [ ] **All buttons are at least 44px tall** — check computed height
- [ ] **Button labels are verb phrases** — "Save Changes" not "Save"
- [ ] **Destructive buttons require confirmation** — modal or inline confirm
- [ ] **Cancel/back option always visible** — never trap the user
- [ ] **Loading state shows spinner or "...ing"** — "Saving..." not just disabled
- [ ] **Disabled buttons have `cursor-not-allowed`** — visual feedback
- [ ] **Button spacing is at least 8px apart** — prevent mis-taps

### Button Layout Patterns

**Single primary action:**
```tsx
<Button variant="primary" size="md">Save Project</Button>
```

**Primary with cancel:**
```tsx
<div className="flex gap-3">
  <Button variant="ghost">Cancel</Button>
  <Button variant="primary">Save Project</Button>
</div>
```

**Destructive confirmation:**
```tsx
<div className="flex gap-3">
  <Button variant="secondary">Keep Project</Button>
  <Button variant="danger">Delete Project</Button>
</div>
```

---

## 8. Cards

### Card Types

| Type | Purpose | Content Structure |
|------|---------|-------------------|
| **Summary Card** | Overview at top of screen | Title, primary metric, 1-2 secondary metrics |
| **Progress Card** | Item in a list with progress | Name, segment count, progress bar, status |
| **Action Card** | Prompt for user action | Title, description, primary button |
| **Info Card** | Display grouped information | Title, list of key-value pairs |

### Card Structure

**Summary Card:**
```
┌──────────────────────────────────────────┐
│  Section Title                      (sm) │
│  42                                 (xl) │
│  of 128 streets                     (sm) │
│  32% complete                     (base) │
└──────────────────────────────────────────┘
```

**Progress Card (Street Item):**
```
┌──────────────────────────────────────────┐
│  High Street                        (md) │
│  12 / 12 segments                   (sm) │
│  ████████████████████████████████  100%  │
│  Complete                           (sm) │
└──────────────────────────────────────────┘
```

**Action Card (Suggestion):**
```
┌──────────────────────────────────────────┐
│  Almost there!                      (md) │
│  3 more streets to complete...      (sm) │
│  [Show on Map]                   (button)│
└──────────────────────────────────────────┘
```

### Card Checklist
- [ ] **Card padding is consistent** — 16px (`p-4`) or 24px (`p-6`), not mixed on same screen
- [ ] **One primary metric per card** — make it visually dominant
- [ ] **Cards do one job** — don't mix summary, progress, and actions in one card
- [ ] **No heavy borders** — use `border` not `border-2` (border-2 is wireframe only)
- [ ] **Spacing inside card is consistent** — use `space-y-2` or `space-y-3`
- [ ] **Cards separate via whitespace** — `gap-4` between cards, not extra borders

### Card Component Usage
```tsx
// Summary card with proper hierarchy
<Card padding="md">
  <span className="text-sm text-text-muted">Your Progress</span>
  <span className="text-2xl font-bold">42</span>
  <span className="text-sm text-text-muted">of 128 streets · 32%</span>
</Card>

// Progress card
<Card padding="sm" className="space-y-2">
  <span className="text-base font-medium">High Street</span>
  <span className="text-sm text-text-muted">12 / 12 segments</span>
  <ProgressBar percentage={100} />
  <span className="text-sm text-text-muted">Complete</span>
</Card>
```

---

## 9. Lists

### List Item Dimensions

| Property | Value | Tailwind |
|----------|-------|----------|
| Min height | 56px | (achieved via padding) |
| Horizontal padding | 16px | `px-4` |
| Vertical padding | 12px | `py-3` |
| Gap between items | 0px (use dividers) or 8px | `gap-2` |

### List Item Structure

```
┌──────────────────────────────────────────────────┐
│  Primary Text                           Trailing │
│  Secondary info                                  │
└──────────────────────────────────────────────────┘
```

**For Streets:**
```
┌──────────────────────────────────────────────────┐
│  Park Lane                                  62%  │
│  5 / 8 segments completed                        │
└──────────────────────────────────────────────────┘
```

### List Checklist
- [ ] **Minimum 56px height** — ensures touch target compliance
- [ ] **Consistent padding** — `px-4 py-3` for all list items
- [ ] **Primary text is medium weight** — `font-medium`
- [ ] **Secondary info is smaller and muted** — `text-sm text-text-muted`
- [ ] **Trailing element aligns right** — percentage, icon, or status
- [ ] **Keyboard accessible** — `tabIndex={0}` and Enter/Space handlers
- [ ] **Dividers are subtle** — `divide-y divide-border` not thick lines
- [ ] **Lists are vertical** — no grids for text-heavy items

### List Component Usage
```tsx
<ul className="divide-y divide-border">
  {streets.map((street) => (
    <StreetListItem
      key={street.osmId}
      street={street}
      onHighlight={handleStreetHighlight}
      onClearHighlight={handleStreetClearHighlight}
    />
  ))}
</ul>
```

---

## 10. Forms & Inputs

### Input Dimensions

| Property | Value | Tailwind |
|----------|-------|----------|
| Min height | 44px | `min-h-[44px]` or `py-2.5` |
| Horizontal padding | 12px | `px-3` |
| Border | 1px | `border` |
| Border radius | 0 (wireframe) / 4-8px (polished) | `rounded` or `rounded-md` |

### Form Layout

```
Label (above input)
┌────────────────────────────────────────┐
│  Placeholder text...                   │
└────────────────────────────────────────┘
Helper text or error message
```

### Forms Checklist
- [ ] **Labels above inputs** — not inline or floating
- [ ] **All inputs are at least 44px tall** — touch target requirement
- [ ] **Error messages below input** — `text-sm text-danger`
- [ ] **Required fields marked** — asterisk or "(required)" text
- [ ] **Submit button is primary** — only one per form
- [ ] **Form has cancel/back option** — unless it's a search input
- [ ] **Disabled state is visually distinct** — `opacity-50 cursor-not-allowed`
- [ ] **Focus state is visible** — `focus:ring-2` or `focus:border-accent`

### Input Component Usage
```tsx
<div className="space-y-1">
  <label htmlFor="project-name" className="text-sm font-medium">
    Project Name
  </label>
  <Input
    id="project-name"
    placeholder="Enter project name..."
    value={name}
    onChange={handleProjectNameChange}
  />
  {error && <span className="text-sm text-danger">{error}</span>}
</div>
```

---

## 11. Data Display & Metrics

### Metric Display Pattern

**Rule: Numbers must be visually dominant. Labels describe, numbers communicate.**

```tsx
// REQUIRED PATTERN
<div className="flex flex-col">
  <span className="text-sm text-text-muted">Streets Completed</span>
  <span className="text-xl font-bold">42</span>
</div>

// NEVER DO THIS
<p className="text-sm">Streets Completed: 42</p>
```

### Progress Display Pattern

**Rule: Always show numeric value alongside visual indicator.**

```tsx
// REQUIRED PATTERN
<div className="space-y-1">
  <div className="flex justify-between text-sm">
    <span>Progress</span>
    <span>42 / 128 (32%)</span>
  </div>
  <ProgressBar percentage={32} height={6} />
</div>

// NEVER: Progress bar alone without number
<ProgressBar percentage={32} />
```

### Metrics Grid (Multiple Metrics)

```tsx
// For 2-3 metrics side by side
<div className="grid grid-cols-3 gap-4">
  <MetricBlock label="Distance" value="12.4km" />
  <MetricBlock label="Streets" value="42" />
  <MetricBlock label="Coverage" value="32%" />
</div>
```

### Metrics Checklist
- [ ] **Every number has a label** — no orphan numbers
- [ ] **Labels are smaller than values** — `text-sm` vs `text-xl`
- [ ] **Primary metric is largest on screen** — one hero number per section
- [ ] **Progress bars always paired with percentage** — never bar alone
- [ ] **Units are included** — "12.4 km" not "12.4"
- [ ] **Percentages include %** — "32%" not "32"
- [ ] **Fractions show context** — "42 / 128" not "42"

### Progressive Disclosure
- [ ] **First view shows summary** — 4-6 data points maximum
- [ ] **Detail behind interaction** — tap/click to expand
- [ ] **Never show raw data** — no coordinates, IDs, timestamps in main view
- [ ] **Expandable sections for detail** — `<details>` or controlled expand

---

## 12. Feedback & System Status

### Loading States

| Context | Pattern | Example |
|---------|---------|---------|
| Full page | Centered spinner + message | "Loading your projects..." |
| Button action | Button shows loading | "Saving..." with spinner |
| Inline content | Skeleton or placeholder | Pulsing grey boxes |
| Background refresh | Subtle indicator | Small spinner in corner |

### Loading Checklist
- [ ] **Every async action has loading state** — button, page, or inline
- [ ] **Loading message describes action** — "Syncing activities..." not "Loading..."
- [ ] **Skeletons match content shape** — same height/width as real content
- [ ] **Button disables during loading** — prevent double-submit

### Success States
- [ ] **Toast for transient success** — disappears after 3-5 seconds
- [ ] **Inline message for important confirmations** — persists until dismissed
- [ ] **Success message includes result** — "Synced 3 new activities" not "Success"

### Error States

**Rule: Error messages must explain what, why, and what to do.**

```tsx
// REQUIRED PATTERN
<ErrorMessage
  title="Could not load streets"
  description="The server is not responding. This might be a temporary issue."
  action="Try Again"
  onAction={handleRetry}
/>

// NEVER
<p>Error 500</p>
<p>Something went wrong</p>
```

### Error Checklist
- [ ] **Plain language** — no error codes in user-facing messages
- [ ] **Explains what happened** — "Could not save your project"
- [ ] **Explains why if known** — "The name is already in use"
- [ ] **Suggests next step** — "Try a different name" or "Try again"
- [ ] **Has retry option if applicable** — button to retry action
- [ ] **Red colour for errors** — `text-danger` or `bg-danger/10`

### Empty States

**Rule: Empty states guide users toward their first action.**

```tsx
// REQUIRED PATTERN
<EmptyState
  title="No streets completed yet"
  description="Upload a run or sync from Strava to see your progress."
  action="Sync from Strava"
  onAction={handleSync}
/>

// NEVER
<p>No data</p>
<p>No items found</p>
```

### Empty State Checklist
- [ ] **Explains what should be here** — "No completed streets"
- [ ] **Explains how to populate** — "Upload a run to get started"
- [ ] **Has primary action button** — the first thing user should do
- [ ] **Friendly tone** — not robotic or negative

---

## 13. Navigation

### Bottom Navigation (Mobile)

| Property | Value |
|----------|-------|
| Height | 56px |
| Items | 4-5 maximum |
| Active indicator | Bold text or underline (not colour alone) |

### Navigation Checklist
- [ ] **4-5 items maximum** — more requires overflow handling
- [ ] **Icon + text label for each item** — never icon-only
- [ ] **Active state is visually distinct** — weight change, not colour alone
- [ ] **Touch targets are at least 44px** — full item is tappable
- [ ] **Current location is clear** — user knows where they are

### Screen Navigation

- [ ] **Back button on every non-root screen** — top left
- [ ] **Screen title describes content** — "Project Details" not "Details"
- [ ] **Breadcrumbs not needed** — back button is sufficient for mobile-first

### Links
- [ ] **Links look like links** — underline on hover or distinct colour
- [ ] **Action links use verb phrases** — "View all projects →" not "More"
- [ ] **External links indicate they open new tab** — icon or "(opens in new tab)"

---

## 14. Accessibility

### Touch Targets
- [ ] **Minimum 44×44px** for all interactive elements
- [ ] **Minimum 8px spacing** between adjacent touch targets
- [ ] **Larger targets for primary actions** — 48px+ preferred

### Keyboard Navigation
- [ ] **All interactive elements are focusable** — `tabIndex={0}` for custom elements
- [ ] **Focus order matches visual order** — no unexpected jumps
- [ ] **Focus is visible** — outline or ring on `:focus-visible`
- [ ] **Enter/Space activates buttons** — custom elements handle keydown
- [ ] **Escape closes modals/menus** — standard keyboard pattern

### Screen Readers
- [ ] **Buttons have accessible names** — visible text or `aria-label`
- [ ] **Images have alt text** — descriptive or `alt=""` if decorative
- [ ] **Form inputs have labels** — `<label htmlFor>` or `aria-label`
- [ ] **Status messages use `role="status"`** — for live updates
- [ ] **Errors use `role="alert"`** — for important notifications
- [ ] **Icon-only buttons have `aria-label`** — e.g., close button

### Colour & Contrast
- [ ] **Never colour alone for meaning** — pair with text/icon
- [ ] **Text contrast meets WCAG AA** — 4.5:1 for normal text
- [ ] **Interactive states don't rely on colour** — use weight, underline, icon

---

## 15. Code Documentation

### File-Level Documentation

Every file must have a JSDoc comment at the top:

```tsx
/**
 * ProjectStreetsList
 * Displays a filterable list of streets within a project.
 * Supports highlighting streets on the map when hovered.
 * 
 * Used in: ProjectDetailPage, HomePage (ProjectCardWithStreets)
 * 
 * @example
 * <ProjectStreetsList
 *   streets={projectStreets}
 *   onStreetSelect={handleStreetSelect}
 * />
 */
```

### Function Documentation

Functions with non-obvious behaviour must have JSDoc:

```tsx
/**
 * Calculates the haversine distance between two geographic points.
 * 
 * @param pointA - First coordinate with lat/lng
 * @param pointB - Second coordinate with lat/lng
 * @returns Distance in meters
 * 
 * @example
 * const distance = calculateHaversineDistanceBetweenPoints(
 *   { lat: 51.5, lng: -0.1 },
 *   { lat: 51.6, lng: -0.2 }
 * );
 */
function calculateHaversineDistanceBetweenPoints(
  pointA: Coordinate,
  pointB: Coordinate
): number { }
```

### Props Documentation

All exported component props must have JSDoc comments:

```tsx
interface ProjectCardProps {
  /** The project to display */
  project: Project;
  /** Called when user clicks the card. Receives project ID. */
  onClick?: (projectId: string) => void;
  /** If true, shows skeleton loading state */
  isLoading?: boolean;
  /** Additional CSS classes to apply to the root element */
  className?: string;
}
```

### Documentation Checklist
- [ ] **File has top-level JSDoc** — describes purpose, usage, examples
- [ ] **Exported functions have JSDoc** — params, returns, examples
- [ ] **Props interfaces have JSDoc** — each prop explained
- [ ] **Complex logic has inline comments** — explain why, not what
- [ ] **No commented-out code** — delete it, git has history
- [ ] **README exists for complex features** — in feature folder if needed

### Inline Comments

```tsx
// GOOD: Explains why
// We debounce the search to avoid overwhelming the API with requests
// while the user is still typing
const debouncedSearch = useDebouncedCallback(search, 300);

// BAD: Explains what (obvious from code)
// Call the search function
search(query);
```

---

## 16. Code Quality & Cleanup

### Redundant Code

- [ ] **No duplicate components** — if two components are 80%+ similar, merge them
- [ ] **No duplicate utilities** — check `utils/` before writing helpers
- [ ] **No duplicate styles** — use Tailwind classes consistently
- [ ] **No copy-pasted logic** — extract to shared function or hook

### Dead Code

- [ ] **Remove unused imports** — IDE should warn about these
- [ ] **Remove unused variables** — IDE should warn about these
- [ ] **Remove unused functions** — search codebase for usages
- [ ] **Remove commented code** — git preserves history
- [ ] **Remove unused props** — if component doesn't use it, remove it
- [ ] **Remove unused files** — if nothing imports it, delete it

### Code Organisation

- [ ] **Imports are grouped** — external, internal, types, styles
- [ ] **Exports are at bottom** — or use `export function` inline
- [ ] **Constants at top** — after imports, before component
- [ ] **Types near usage** — interface before component that uses it
- [ ] **Helper functions outside component** — unless they need hooks

### Import Order

```tsx
// 1. External libraries
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// 2. Internal components
import { Button, Card } from "../components/common";
import { ProjectCard } from "../components/projects";

// 3. Hooks, contexts, services
import { useProjects } from "../hooks";
import { projectsService } from "../services";

// 4. Types
import type { Project } from "../types/api.types";

// 5. Utils, constants
import { formatDistance } from "../utils";
import { ROUTES } from "../config/constants";
```

### Code Quality Checklist
- [ ] **No TypeScript `any`** — use proper types or `unknown`
- [ ] **No console.log** — remove before committing (or use proper logging)
- [ ] **No magic numbers** — extract to named constants
- [ ] **No hardcoded strings** — extract labels to constants
- [ ] **Functions are under 50 lines** — extract helpers if longer
- [ ] **Components are under 200 lines** — split if longer
- [ ] **No nested ternaries** — use early returns or `if` statements

---

## 17. Final Review Checklist

Before considering any page or component complete, verify ALL applicable items:

### Structure
- [ ] File is in correct location per folder structure
- [ ] File name follows naming conventions
- [ ] Exports are properly defined in index.ts
- [ ] No duplicate functionality exists elsewhere

### Code Quality
- [ ] All functions have clear, descriptive names
- [ ] All variables have meaningful names
- [ ] No magic numbers or hardcoded strings
- [ ] No unused code, imports, or variables
- [ ] No commented-out code
- [ ] TypeScript types are complete (no `any`)
- [ ] Import order is correct

### Documentation
- [ ] File has top-level JSDoc comment
- [ ] Complex functions have JSDoc
- [ ] Props have JSDoc comments
- [ ] Non-obvious logic has inline comments explaining why

### Components
- [ ] Uses existing common components where possible
- [ ] Props interface is well-defined
- [ ] Component has single responsibility
- [ ] No business logic in common components
- [ ] Hooks are at top of component body

### Styling
- [ ] All spacing values are on 8px grid
- [ ] Typography follows hierarchy (max 4 sizes)
- [ ] Buttons are at least 44px tall
- [ ] Cards have consistent padding
- [ ] List items are at least 56px tall

### Data Display
- [ ] Metrics show number larger than label
- [ ] Progress bars have numeric values
- [ ] Empty states guide user action
- [ ] Loading states describe the action

### Accessibility
- [ ] Touch targets are at least 44×44px
- [ ] All interactive elements are keyboard accessible
- [ ] Focus states are visible
- [ ] Form inputs have labels
- [ ] Errors use proper roles

### Feedback
- [ ] Loading states exist for all async actions
- [ ] Error messages explain what/why/next
- [ ] Success feedback is shown for actions
- [ ] Empty states explain how to populate

---

## Appendix A: Component Quick Reference

| Component | Location | Purpose | Key Props |
|-----------|----------|---------|-----------|
| `Button` | `common/` | All clickable actions | `variant`, `size`, `disabled` |
| `Card` | `common/` | Content container | `padding` |
| `Input` | `common/` | Text input | `value`, `onChange`, `error` |
| `Select` | `common/` | Dropdown selection | `options`, `value`, `onChange` |
| `Textarea` | `common/` | Multi-line input | `value`, `onChange` |
| `Modal` | `common/` | Overlay dialog | `isOpen`, `onClose`, `title` |
| `StreetListItem` | `common/` | Street in list | `street`, `onHighlight` |
| `ProgressBar` | `common/` | Visual progress | `percentage`, `height` |
| `MetricBlock` | `common/` | Label + value | `label`, `value`, `size` |
| `EmptyState` | `common/` | No data message | `title`, `description`, `action` |
| `LoadingSpinner` | `common/` | Loading indicator | `size`, `message` |
| `ErrorMessage` | `common/` | Error display | `title`, `description`, `action` |

---

## Appendix B: Tailwind Class Quick Reference

### Spacing (8px grid)
| Value | Class | Pixels |
|-------|-------|--------|
| 1 | `p-1`, `m-1`, `gap-1` | 4px |
| 2 | `p-2`, `m-2`, `gap-2` | 8px |
| 3 | `p-3`, `m-3`, `gap-3` | 12px |
| 4 | `p-4`, `m-4`, `gap-4` | 16px |
| 6 | `p-6`, `m-6`, `gap-6` | 24px |
| 8 | `p-8`, `m-8`, `gap-8` | 32px |

### Typography
| Purpose | Class |
|---------|-------|
| Meta/label | `text-sm text-text-muted` |
| Body | `text-base` |
| Section title | `text-base font-semibold` |
| Primary metric | `text-xl font-bold` |
| Hero metric | `text-2xl font-bold` |

### Common Patterns
| Pattern | Classes |
|---------|---------|
| Card padding | `p-4` or `p-6` |
| List item | `px-4 py-3` |
| Button min height | `min-h-[44px]` |
| Section gap | `space-y-6` or `gap-6` |
| Card gap | `space-y-4` or `gap-4` |

---

## Appendix C: Required Common Components

The following components MUST exist in `common/` and be used consistently:

### Currently Exist
- [x] `Button` — needs height fix for touch targets
- [x] `Card` — needs border reduction for polish
- [x] `Input` — needs height verification
- [x] `Select` — needs height verification
- [x] `Textarea` — needs height verification
- [x] `Modal` — verify accessibility
- [x] `StreetListItem` — needs height fix, segment info

### Need to Create
- [ ] `MetricBlock` — label + value display
- [ ] `ProgressBar` — visual progress with percentage
- [ ] `EmptyState` — no data with action
- [ ] `LoadingSpinner` — consistent loading indicator
- [ ] `ErrorMessage` — structured error display
- [ ] `SummaryCard` — hero metric card
- [ ] `Toast` — transient notifications

---

*Last updated: February 2026*
*Version: 1.0*
