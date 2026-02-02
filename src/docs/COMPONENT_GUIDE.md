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
9. [Accessibility Summary](#accessibility-summary)

---

## Overview

| Component | Purpose |
|-----------|---------|
| **Button** | Primary actions (submit, cancel, confirm) |
| **Card** | Content containers (lists, details, forms) |
| **Input** | Single-line text |
| **Select** | Dropdown choice |
| **Textarea** | Multi-line text |
| **Modal** | Dialogs (confirm, forms) |
| **ThemeToggle** | Switch light/dark theme |

All components accept a `className` prop for layout or style overrides. Styling is token-based: `bg-surface`, `border-border`, `text-text`, `text-danger`, etc.

---

## Button

Primary interactive element for user actions.

### Props

| Prop | Type | Default | Description |
|------|------|---------|--------------|
| `variant` | `"primary"` \| `"secondary"` \| `"danger"` \| `"success"` | `"primary"` | Visual style |
| `size` | `"sm"` \| `"md"` \| `"lg"` | `"md"` | Padding and font size |
| `type` | `"button"` \| `"submit"` \| `"reset"` | `"button"` | Native button type |
| `disabled` | `boolean` | - | Disabled state |
| `children` | `ReactNode` | - | Label content |
| `className` | `string` | `""` | Extra classes |
| ... | `ButtonHTMLAttributes` | - | Any native button props |

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

| Prop | Type | Default | Description |
|------|------|---------|--------------|
| `padding` | `"none"` \| `"sm"` \| `"md"` \| `"large"` | `"md"` | Inner padding |
| `children` | `ReactNode` | - | Content |
| `className` | `string` | `""` | Extra classes |
| ... | `HTMLAttributes<HTMLDivElement>` | - | Any native div props |

### Usage

```tsx
import { Card } from "../components/common";

<Card>
  <h2>Route details</h2>
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

| Prop | Type | Default | Description |
|------|------|---------|--------------|
| `label` | `string` | - | Accessible label |
| `error` | `string` | - | Error message (sets `aria-invalid`, `aria-describedby`) |
| `required` | `boolean` | - | Required field (shows * and sets attribute) |
| `id` | `string` | (generated) | Id for label and input (optional) |
| `className` | `string` | `""` | Extra classes on input |
| ... | `InputHTMLAttributes` | - | Native input props |

### Usage

```tsx
import { Input } from "../components/common";

<Input
  label="Route name"
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

| Prop | Type | Default | Description |
|------|------|---------|--------------|
| `label` | `string` | - | Accessible label |
| `error` | `string` | - | Error message |
| `options` | `{ value: string; label: string }[]` | - | Options list |
| `required` | `boolean` | - | Required field |
| `id` | `string` | (generated) | Id for label and select |
| `className` | `string` | `""` | Extra classes on select |
| ... | `SelectHTMLAttributes` | - | Native select props |

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
/>
```

### Accessibility

- Same label/error/aria pattern as Input

---

## Textarea

Multi-line text input with optional label and error.

### Props

| Prop | Type | Default | Description |
|------|------|---------|--------------|
| `label` | `string` | - | Accessible label |
| `error` | `string` | - | Error message |
| `rows` | `number` | `3` | Default rows |
| `required` | `boolean` | - | Required field |
| `id` | `string` | (generated) | Id for label and textarea |
| `className` | `string` | `""` | Extra classes |
| ... | `TextareaHTMLAttributes` | - | Native textarea props |

### Usage

```tsx
import { Textarea } from "../components/common";

<Textarea
  label="Notes"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
  rows={5}
/>
```

### Accessibility

- Same label/error/aria pattern as Input

---

## Modal

Dialog overlay with title and close behavior.

### Props

| Prop | Type | Default | Description |
|------|------|---------|--------------|
| `isOpen` | `boolean` | - | When false, nothing is rendered |
| `onClose` | `() => void` | - | Called on Escape or overlay click |
| `title` | `string` | - | Dialog title (used for `aria-labelledby`) |
| `size` | `"sm"` \| `"md"` \| `"large"` | `"md"` | Max width of content box |
| `children` | `ReactNode` | - | Body content |

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
</header>
```

### Accessibility

- Native `<button>` with `aria-label`: "Switch to light mode" or "Switch to dark mode"
- `title` matches for tooltip

---

## Accessibility Summary

| Requirement | How it’s met |
|-------------|----------------|
| **Color contrast** | Tokens chosen for WCAG AA; verify in DESIGN_TOKENS / contrast checker |
| **Focus** | Global `:focus-visible` outline (3px, offset 2px) in `index.css` |
| **Keyboard** | Buttons and form controls are focusable; Modal closes on Escape |
| **Labels** | Input, Select, Textarea support `label` and `htmlFor`/`id` |
| **Errors** | `aria-invalid`, `aria-describedby`, and `role="alert"` on error text |
| **Dialogs** | Modal uses `role="dialog"`, `aria-modal`, `aria-labelledby` |
| **Reduced motion** | Handled in tokens.css via `prefers-reduced-motion` |

When adding new components, keep using token-based classes and the same label/error/ARIA patterns as Input and Select.
