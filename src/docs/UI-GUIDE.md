# Street Keeper — UI Design Reference Guide

## How This Guide Was Produced

This guide was built by extracting interaction patterns from Strava's mature, data-heavy fitness interface and cross-referencing each pattern against Jakob Nielsen's 10 usability heuristics (Nielsen, 1994). The goal was not to copy Strava's visual brand but to identify the structural decisions that make a dense, metric-driven app feel simple. Colour is deliberately excluded; this guide covers layout, spacing, typography, buttons, cards, lists, progress display, and information hierarchy only.

The research drew on Strava's own support documentation, its recent design system updates (including the 2024 icon overhaul and 2025 record screen redesign), published UX case studies and redesign analyses on Behance and Medium, community feedback threads on the Strava Community Hub, and the original Nielsen Norman Group heuristic definitions. Touch target sizing draws from Apple Human Interface Guidelines, Google Material Design, WCAG 2.1 AAA criteria, and Steven Hoober's research on touch ergonomics.

---

## Part 1 — Spacing System

Strava, like most professionally designed mobile apps, uses an 8-point grid. Every measurement for padding, margins, gaps, and component heights is a multiple of 8. This creates visual rhythm and consistency without needing to think about individual values each time.

### Rules to follow

Use an 8px base unit for all spacing. When finer control is needed, such as small icon padding or text alignment adjustments, use a 4px half-step. Every gap, margin, and padding value in the app should be divisible by 4, and ideally by 8.

Recommended spacing scale: 4, 8, 12, 16, 24, 32, 48, 64. Use the smaller values (4–12) for internal component spacing, such as the gap between an icon and its label. Use middle values (16–24) for padding inside cards and between related elements. Use larger values (32–48) for section separation and screen-level breathing room.

### How this maps to Nielsen's heuristics

**Heuristic 4 — Consistency and standards.** Using the same spacing scale everywhere means the interface has a predictable rhythm. Users unconsciously learn the spatial language and can scan content faster because the structure is uniform.

**Heuristic 8 — Aesthetic and minimalist design.** Whitespace acts as a separator, reducing the need for borders and divider lines. Strava rarely uses visible borders between sections; spacing alone creates the structure.

### Implementation notes

In CSS, define spacing as custom properties:

```
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
```

Apply these consistently. Card padding should be `var(--space-md)` or `var(--space-lg)`. Gap between cards in a list should be `var(--space-md)`. Screen-level horizontal padding should be `var(--space-md)` on mobile.

---

## Part 2 — Typography

Strava's interface works primarily through text hierarchy. There are no decorative elements doing the heavy lifting; the text sizes and weights alone tell the user what matters most.

### Hierarchy structure

Strava uses a strict three-to-four level typographic hierarchy across its entire interface:

**Level 1 — Section title.** Medium weight (500 or 600), moderate size. Used for labels like "This Week" or "Your Progress." This is not large text; it is distinguishable from body text through weight alone.

**Level 2 — Primary metric.** Large and bold. This is the number or value the user came to see: the distance, the percentage, the count. It is the loudest element on screen.

**Level 3 — Secondary metric.** Regular weight, smaller than the primary metric but still clearly readable. Used for supporting data like pace, elevation, or time.

**Level 4 — Meta information.** Small, muted (lower contrast against the background, achieved through lighter font weight or reduced opacity rather than colour). Used for timestamps, units, labels, and contextual notes.

### Recommended type scale

Use no more than four font sizes across the entire application. System fonts are preferred because they render natively and load instantly.

```
--font-size-sm: 0.75rem;    (12px — meta info, timestamps, labels)
--font-size-base: 0.875rem; (14px — body text, secondary metrics)
--font-size-md: 1rem;        (16px — section titles, important body text)
--font-size-lg: 1.5rem;      (24px — primary metrics, key numbers)
--font-size-xl: 2rem;         (32px — hero metrics on summary screens only)
```

Use only two font weights: regular (400) and medium or semi-bold (500 or 600). Avoid using bold (700) for anything except the single most important number on screen. If everything is bold, nothing is bold.

Line height should always be greater than the font size. Use a line height of at least 1.4 for body text and 1.2 for large display numbers. This ensures readability without wasting vertical space.

### Font family

```
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

This system font stack ensures the app looks native on every platform. Strava uses its own custom typeface, but for Street Keeper the system stack achieves the same visual clarity without loading external fonts.

### How this maps to Nielsen's heuristics

**Heuristic 6 — Recognition rather than recall.** Strong typographic hierarchy means users can scan a screen and immediately see the important information without reading every word. The primary metric jumps out because of its size, not because of decorative treatment.

**Heuristic 8 — Aesthetic and minimalist design.** Limiting to four sizes and two weights prevents visual noise. Every text element has a clear role. Nothing is styled "just because."

---

## Part 3 — Buttons

Strava follows a strict button hierarchy: one dominant action per screen, supported by secondary and tertiary actions with progressively lower visual weight.

### Primary button

Used for the single most important action on the current screen. There should be exactly one primary button visible at any time.

- Full width on mobile, or clearly wider than other elements.
- Height: 44–48px minimum (this also satisfies touch target requirements).
- Font weight: medium (500 or 600), not bold.
- Border radius: subtle rounding, roughly 8px. Not pill-shaped, not sharp-cornered.
- Padding: 12px vertical, 24px horizontal minimum.
- No icon unless the icon is essential to understanding the action.

Use for: Upload GPX, Save, Start Challenge, Confirm.

### Secondary button

Used for supporting actions that the user might want but are not the primary goal of the screen.

- Same height as primary (44–48px) to maintain consistent touch targets.
- Outlined style: a visible border with no fill, or a very subtle background.
- Lower visual weight than primary — it should not compete for attention.
- Same border radius as primary for consistency.

Use for: Filter, View Details, Change Settings, Edit.

### Tertiary or ghost button

Used for low-commitment actions where the user is unlikely to feel lost if they tap it.

- Text only, no border, no background.
- Still meets 44px touch target through padding, even if the visible text is smaller.
- Visually quiet but not invisible.

Use for: Cancel, Reset, Learn More, Skip.

### Critical button rules

Never place two primary buttons on the same screen. If there are two equally important actions, make one primary and one secondary, or reconsider the screen's purpose.

Buttons should always use verb phrases: "Upload Run" not "Upload", "Save Progress" not "OK", "View Streets" not "Streets." This makes the consequence of tapping clear.

Destructive actions (delete, leave challenge) should require confirmation. The destructive option should be visually distinct from safe actions — this can be achieved through positioning alone if colour is not yet in use. Place the safe option (cancel) on the left and the destructive option on the right, matching reading direction.

### Touch target sizing

All interactive elements must meet a minimum touch target of 44 × 44 CSS pixels (Apple HIG) or 48 × 48 density-independent pixels (Google Material Design). WCAG 2.1 AAA also specifies 44 × 44px. If the visible element is smaller, such as a 24px icon, use padding to extend the tappable area to at least 44px.

Minimum spacing between adjacent touch targets should be 8px, though 12–16px is more comfortable and reduces accidental taps. This is especially important for list items with trailing action icons.

### How this maps to Nielsen's heuristics

**Heuristic 5 — Error prevention.** One primary action per screen dramatically reduces the chance of the user tapping the wrong thing. Confirmation dialogs for destructive actions prevent irreversible mistakes.

**Heuristic 2 — Match between system and real world.** Verb-phrase button labels use the user's language: "Upload Run" describes what will happen, not what the system will do internally.

**Heuristic 3 — User control and freedom.** Visible cancel and back paths on every screen ensure users never feel trapped. Ghost-style cancel buttons are always present alongside primary actions.

---

## Part 4 — Cards

Strava uses cards as the primary container for grouping related information. Cards are informational, not decorative.

### Summary card

Appears at the top of a screen to give an overview. Contains a title, one primary metric, and one or two secondary metrics. No buttons inside unless absolutely necessary.

Structure:

```
┌──────────────────────────────┐
│  Section Title          (sm) │
│  42                     (xl) │
│  of 128 streets        (sm) │
│  32% complete          (base)│
└──────────────────────────────┘
```

Padding: 16–24px on all sides. No visible border. Separation from surrounding content is achieved through spacing alone, or a very subtle background difference (once colours are introduced).

### Progress card (for street items)

Used in lists to show individual street completion.

Structure:

```
┌──────────────────────────────┐
│  High Street            (md) │
│  12 / 12 segments      (sm) │
│  ──────────────────── 100%   │
│  Complete              (sm)  │
└──────────────────────────────┘
```

The street name is the primary text. The segment count is secondary. The progress indicator is a thin horizontal bar, but the text "12 / 12" is always present alongside it. Never rely on the bar alone to communicate progress; the number is more precise and accessible.

Completion state should be a plain text label: "Complete", "Partial", or "Not Started." Avoid symbols or icons as the sole indicator.

### Card rules

Cards do one job. A card either shows a summary, displays a stat, or tracks progress. It does not mix actions with data unless the action is directly tied to the data (for example, a "View Details" link at the bottom of a card).

Card padding should be consistent across the entire application. Use 16px for compact layouts and 24px for more spacious views, but do not mix sizes on the same screen.

Cards should not have heavy borders or drop shadows. If visual separation is needed, use a 1px border in a very light tone or a subtle elevation. Spacing between cards provides most of the separation.

### How this maps to Nielsen's heuristics

**Heuristic 6 — Recognition rather than recall.** Cards present all relevant information at a glance. The user does not need to remember street names or completion states because they are visible in the list.

**Heuristic 1 — Visibility of system status.** Progress cards show exactly where the user stands: how many segments are done, what percentage is complete, and what the current state is. There is no ambiguity.

---

## Part 5 — Lists

Strava strongly favours vertical lists over grids. Lists are easier to scan, scroll naturally on mobile, and provide predictable eye movement from top to bottom.

### List item anatomy

Every list item follows a consistent pattern:

```
[Primary text                        ]
[Secondary info              Trailing]
```

Primary text is the item's name or title, displayed in the medium font size with medium weight. Secondary info sits below in a smaller, lighter style. The trailing element is optional and can be a status label, a percentage, or a small icon.

For Street Keeper streets:

```
Park Lane
5 / 8 segments completed              62%
```

Or for completed streets:

```
High Street
12 / 12 segments completed              ✓
```

### List vs grid

Use vertical lists for: streets, runs, activities, achievements, challenge members, and any item where the user needs to read text.

Use grids only for: badges, small visual icons, or items where comparison across a row is useful. Street Keeper is unlikely to need grids in its initial version.

### Dividers

Strava uses very thin dividers between list items, or no dividers at all when spacing is sufficient. If dividers are used, they should be 1px and span from the left edge of the text content, not the full width of the screen. This is called an "inset divider" and it visually groups the icon or avatar with its text while separating items from each other.

### How this maps to Nielsen's heuristics

**Heuristic 6 — Recognition rather than recall.** Lists display all items so the user can browse rather than having to remember street names or search for them.

**Heuristic 4 — Consistency and standards.** Every list item follows the same structure. Users learn the pattern once and can scan quickly.

---

## Part 6 — Displaying Metrics and Data

Strava is fundamentally a data display application. Its core skill is showing dense numeric information without overwhelming the user.

### Progressive disclosure

The first screen shows only totals and highlights. Detail is hidden behind a tap. This is the single most important data display principle to borrow.

For Street Keeper:

**Dashboard (first view):** Total streets completed, percentage coverage, current streak (if implemented), active challenge name. Four to six pieces of data maximum.

**Detail view (after tap):** Full street list, segment breakdowns, run history for a specific street, individual completion timestamps.

Never show on the first screen: raw coordinate data, debug information, confidence scores, internal IDs, processing timestamps, or any backend detail. These belong in an advanced or developer view, if they are shown at all.

### Metric display pattern

When showing a number, always pair it with a label. The number should be large; the label should be small and sit directly above or below it.

```
Streets Completed        (label, small, muted)
42                        (metric, large, bold)
```

Not:

```
You have completed 42 streets.
```

The first pattern is scannable in under a second. The second requires reading a full sentence. Strava uses the first pattern everywhere.

When showing multiple metrics side by side, use equal-width columns with consistent alignment. For mobile, two or three metrics per row is the maximum before it becomes cramped.

```
┌─────────┬─────────┬─────────┐
│ Distance│ Streets │ Coverage│
│  12.4km │    42   │   32%   │
└─────────┴─────────┴─────────┘
```

### Progress indicators

Text first, bar second. A progress bar without a number is ambiguous. Always show the numeric value ("42 / 128" or "32%") alongside any visual progress indicator.

Progress bars should be thin (4–8px height). They are supporting elements, not the primary information. The number does the communicating; the bar provides a quick visual reference.

### How this maps to Nielsen's heuristics

**Heuristic 1 — Visibility of system status.** Every metric tells the user exactly where they stand. There is no guesswork about progress.

**Heuristic 7 — Flexibility and efficiency of use.** Progressive disclosure serves both novice users (who see a clean summary) and advanced users (who can tap through to detail).

**Heuristic 8 — Aesthetic and minimalist design.** Showing only what matters now keeps the interface focused. Detail exists but is not forced on the user.

---

## Part 7 — Navigation

Strava uses a bottom navigation bar with five items: Home, Maps, Record, Groups, and Profile. This follows the standard mobile pattern established by most social and utility apps.

### Bottom navigation rules

Use a bottom navigation bar with four to five items maximum. Each item should have both an icon and a short text label. Icon-only navigation is harder to learn and violates the recognition-over-recall principle.

The currently active item should be visually distinct through weight or opacity, not through colour alone (since colour is not being addressed yet). A bolder icon or underline can indicate the active tab.

The centre position can be given a visually prominent treatment (slightly raised, different background) if there is a single primary action like "Record" or "Upload."

For Street Keeper, a reasonable navigation structure might be: Dashboard, Map, Upload, Challenges, Profile.

### Screen-level navigation

Within screens, use a simple top bar with a back arrow on the left and the screen title centred or left-aligned. Action buttons (edit, share, settings) sit on the right side of the top bar.

Breadcrumbs are unnecessary for a mobile-first app. The back arrow provides sufficient wayfinding when paired with clear screen titles.

### How this maps to Nielsen's heuristics

**Heuristic 3 — User control and freedom.** The back arrow is always present. Users can always return to the previous screen without losing their place.

**Heuristic 4 — Consistency and standards.** Bottom navigation is the standard mobile pattern. Users of any other app will immediately understand how to move around.

**Heuristic 6 — Recognition rather than recall.** Labelled navigation items mean users do not need to memorise what each icon means.

---

## Part 8 — Feedback and System Status

Strava provides immediate feedback for every action: uploads show a processing indicator, completed runs show a confirmation, and errors display clear messages.

### After GPX upload or Strava sync

Show a processing state with a simple text message: "Processing your run..." accompanied by a subtle animation such as a spinner or pulsing indicator. When processing completes, show a brief success state: "Run processed — 4 new streets found." This should appear as a transient notification (toast) that disappears after a few seconds, or as an inline status update on the upload screen.

### When something goes wrong

Error messages must follow three rules: state what happened in plain language, explain why it happened if possible, and suggest what the user can do next.

Good: "Could not process this file. The GPX data does not contain any location points. Please check that the file was exported correctly from your device."

Bad: "Error 422: Unprocessable entity."

Bad: "Something went wrong. Please try again."

### Empty states

When a list has no items — for example, a new user with no completed streets — show a helpful message rather than a blank screen. Explain what the screen is for and what action the user should take to populate it.

Example: "No streets completed yet. Upload a run or connect your Strava account to get started."

### How this maps to Nielsen's heuristics

**Heuristic 1 — Visibility of system status.** Processing indicators tell the user the system is working. Success messages confirm the action was completed.

**Heuristic 9 — Help users recognise, diagnose, and recover from errors.** Plain-language error messages with suggested next steps prevent users from feeling stuck.

---

## Part 9 — Language and Labelling

### Use runner's language, not developer's language

Strava uses terms that runners understand: "activity" not "GPS trace", "segment" not "edge", "personal record" not "local maxima."

For Street Keeper, use:

- "Street" not "way" or "edge" or "OSM entity"
- "Completed" not "traversed" or "coverage threshold met"
- "Partial" not "incomplete" or "below threshold"
- "Run" or "Activity" not "GPX file" or "track"
- "Connect Strava" not "OAuth authorise"
- "Processing" not "map matching"

### How this maps to Nielsen's heuristics

**Heuristic 2 — Match between system and real world.** The interface speaks the user's language. Technical implementation details are invisible. A runner should never need to understand GPS, GPX, or map matching to use the app.

---

## Part 10 — Full Heuristic Checklist for Street Keeper

This section maps each of Nielsen's 10 heuristics to specific, implementable design decisions for Street Keeper. Use this as a checklist during development.

### 1. Visibility of system status

- Show a processing indicator during GPX upload and street matching.
- Display "last synced" timestamp when connected to Strava or Garmin.
- Progress bars and completion percentages on every challenge view.
- Toast notifications when new streets are found after a sync.
- Clear "Connected" or "Not connected" status for API integrations.

### 2. Match between system and real world

- Use "streets", "runs", "completed", "partial" throughout.
- Map views should show recognisable street names and familiar geography.
- Avoid technical jargon in any user-facing text.
- Progress metaphors should feel natural: percentages, counts, streaks.

### 3. User control and freedom

- Back button on every screen.
- Cancel option alongside every confirmation action.
- Ability to disconnect Strava or Garmin without losing data.
- No irreversible actions without a confirmation step.
- Users can manually mark a street as completed if automatic detection misses it (future feature, but design for it now).

### 4. Consistency and standards

- Same card layout on every screen.
- Same button hierarchy everywhere: one primary, secondaries below.
- Same typography scale and spacing throughout.
- Bottom navigation with labelled icons.
- Same progress language everywhere: "X / Y streets, Z% complete."

### 5. Error prevention

- Validate GPX files before processing and show a clear message if invalid.
- One primary action per screen to prevent wrong taps.
- Confirmation before leaving a challenge or deleting data.
- Disable the upload button until a file is selected.
- Prevent duplicate uploads of the same activity.

### 6. Recognition rather than recall

- Show street names, not IDs.
- Display all relevant stats on summary cards without requiring navigation.
- Labelled navigation icons.
- Persistent challenge name and progress visible on the dashboard.
- Recent activities listed with dates and key metrics.

### 7. Flexibility and efficiency of use

- Simple default view for new users.
- Optional detail views for advanced users who want segment-level data.
- Quick-access upload or sync button in the navigation.
- Allow keyboard shortcuts on web for power users (future consideration).

### 8. Aesthetic and minimalist design

- No decorative elements that do not serve a function.
- Whitespace as the primary separator.
- Maximum four font sizes, two weights.
- Only essential information on the first view; detail on tap.
- No colour dependence for communicating state (use text labels alongside any visual indicators).

### 9. Help users recognise, diagnose, and recover from errors

- Plain-language error messages with suggested fixes.
- Show partial progress even when a run fails to process completely.
- Never show "you failed" states; show "not yet started" or "in progress" instead.
- Retry options for failed uploads.
- Helpful empty states that guide the user toward their first action.

### 10. Help and documentation

- The interface should be self-explanatory for basic tasks.
- Use text labels over ambiguous icons.
- Provide a brief onboarding flow explaining the core concept: upload runs, see streets, track progress.
- Contextual tooltips or info icons for complex features (such as how street matching works).
- No hidden gestures or swipe-to-reveal actions that require discovery.

---

## Part 11 — What Not to Do (Lessons from Strava's Mistakes)

Strava's February 2025 mobile UI update drew significant criticism from its community. The key complaints, documented across their Community Hub, offer useful negative lessons:

**Do not cram all information onto one screen.** Strava attempted to show maps, stats, and photos on a single activity view. Users reported it felt cluttered and difficult to parse. The previous design, which used a summary view with taps through to detail, was preferred. This reinforces progressive disclosure.

**Do not hide the most important content.** The update buried photos behind a small thumbnail. In Street Keeper's context, this means the map view and completion stats should be immediately visible, not hidden behind taps or small icons.

**Do not remove existing functionality in a redesign.** Users were frustrated when photo captions became invisible and map controls were removed. When iterating on Street Keeper's UI, preserve existing interaction paths even as new features are added.

**Do not ship without testing on real devices.** The update caused frequent crashes and performance issues. For Street Keeper, test every interaction on an actual mobile device before considering a screen complete.

---

## Part 12 — Component Quick Reference

This table summarises every component type, its purpose, and key specifications.

| Component          | Purpose                  | Height            | Padding           | Max items per screen |
| ------------------ | ------------------------ | ----------------- | ----------------- | -------------------- |
| Primary button     | Main action              | 44–48px           | 12px V, 24px H    | 1                    |
| Secondary button   | Support action           | 44–48px           | 12px V, 24px H    | 2–3                  |
| Ghost button       | Low-commitment action    | 44px touch target | 8px V, 16px H     | As needed            |
| Summary card       | Overview metrics         | Auto              | 16–24px all sides | 1 per screen         |
| Progress card      | Street completion        | Auto              | 16px all sides    | In list              |
| List item          | Street or activity entry | 56–72px           | 16px H, 12px V    | In scrolling list    |
| Bottom nav         | App navigation           | 56px              | 8px V             | 4–5 items            |
| Top bar            | Screen title and back    | 44–56px           | 16px H            | 1 per screen         |
| Toast notification | Feedback message         | Auto              | 12px all sides    | 1 at a time          |
| Progress bar       | Visual completion        | 4–8px height      | 0px (inside card) | Paired with text     |
| Metric block       | Key number display       | Auto              | 8px V             | 2–3 per row          |

---

## Part 13 — Implementation Order

Given that Street Keeper is transitioning from backend to frontend, the recommended order for implementing these UI components is:

1. **Spacing system and typography.** Define the CSS custom properties for spacing and the type scale. These underpin everything else and take 30 minutes to set up.

2. **Button components.** Build three button variants (primary, secondary, ghost) as reusable React components. These are used on every screen.

3. **Card components.** Build the summary card and progress card. These will be used on the dashboard and street list views.

4. **List items.** Build the standard list item component for streets and activities.

5. **Navigation.** Implement the bottom navigation bar and top bar.

6. **Feedback states.** Add toast notifications, loading spinners, empty states, and error messages.

7. **Metric display.** Build the metric block component for the dashboard.

Each component should be built in isolation, tested for correct spacing and touch targets, and then assembled into screens. This approach matches the incremental development methodology already used for the backend.

---

## References

Apple Inc. (n.d.) _Human Interface Guidelines: Layout_. Available at: https://developer.apple.com/design/human-interface-guidelines/layout (Accessed: February 2026).

Google (n.d.) _Material Design: Accessibility — Touch target size_. Available at: https://support.google.com/accessibility/android/answer/7101858 (Accessed: February 2026).

Hoober, S. (2022) _Touch Design for Mobile Interfaces_. A Book Apart.

Nielsen, J. (1994) 'Heuristic evaluation', in Nielsen, J. and Mack, R.L. (eds.) _Usability Inspection Methods_. New York: John Wiley & Sons.

Nielsen, J. (2020) '10 Usability Heuristics for User Interface Design', _Nielsen Norman Group_. Available at: https://www.nngroup.com/articles/ten-usability-heuristics/ (Accessed: February 2026).

Smashing Magazine (2023) 'Accessible Target Sizes Cheatsheet'. Available at: https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/ (Accessed: February 2026).

W3C (2018) 'Understanding Success Criterion 2.5.5: Target Size', _Web Content Accessibility Guidelines (WCAG) 2.1_. Available at: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html (Accessed: February 2026).
