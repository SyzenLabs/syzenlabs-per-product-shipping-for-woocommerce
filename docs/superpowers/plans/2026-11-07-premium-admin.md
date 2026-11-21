# Premium Admin Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the admin presentation with a polished, accessible React workspace while preserving shipping behavior.

**Architecture:** React Router hash routes share a scoped application shell. Locally owned Radix/shadcn components and Tailwind tokens provide the UI; existing WordPress REST endpoints remain the persistence boundary.

**Tech Stack:** React, React Router, Radix UI/shadcn patterns, Tailwind 3, Lucide, Motion, `@wordpress/scripts`, webpack, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-premium-admin-design.md`

## Global Constraints

- `@wordpress/scripts` and webpack are required.
- Preserve current shipping data, backend semantics, localization, RTL, and unrelated worktree changes.
- Keep styles scoped to the plugin and share WordPress's React runtime.
- No merchant database mutations during tests; no automatic commit or push.

## Review Focus

- Legacy line/item costs, empty values, and zero must survive edits; reject negative/non-finite costs.
- All router exits and browser unloads must protect unsaved edits, including sidebar navigation.
- An old product-search or page request must not replace a newer response.
- Import preview tokens must be invalidated when either the file or import mode changes.
- Partial deletion errors must refresh actual server state and retain a useful error message.

### Task 1: Foundation and test harness

Files: `package.json`, `webpack.config.js`, `tailwind.config.js`, `postcss.config.js`, `components.json`, `tests/admin/*`, `playwright.config.cjs`.

- [x] Preserve lockfile and baseline; document pre-existing check failures.
- [x] Add browser workflows for the new landing page. Establish the red/green cycle with shipping-data unit tests before implementation; exercise the compiled application during browser verification.
- [x] Install compatible UI dependencies with lifecycle scripts disabled.
- [x] Compile prefixed scoped Tailwind through the WordPress webpack configuration.

### Task 2: Shell, navigation, and primitives

Files: `src/index.js`, `src/components/ui/*`, `src/components/layout/*`, `src/context/*`, `src/styles/*`.

- [x] Implement branded responsive shell and hash routes, including legacy redirects.
- [x] Add Radix dialogs, switches, checkboxes, selects, and menus with shared button/input/badge primitives.
- [x] Add scoped design tokens, motion policy, error boundary, prompts, and toasts.

### Task 3: Rules and import workflows

Files: `src/pages/rules/*`, `src/pages/settings/*`, `src/hooks/*`, `src/lib/*`.

- [x] Build server-driven search/filter/pagination and selection with loading/error/empty states.
- [x] Preserve confirmed bulk deletion and CSV export.
- [x] Implement preview/commit import dialog with invalidation and visible preview errors.
- [x] Build settings panel with retention toggle and shipping-zone access.

### Task 4: Rule editor

Files: `src/pages/rule-edit/*`, `src/lib/rules.js`, `src/lib/rules.test.js`.

- [x] Write and run failing tests for valid/invalid costs, legacy values, enabled overrides, and reorder boundaries.
- [x] Implement validated product-family editing, searchable product picker, and override sections.
- [x] Protect unsaved navigation; show accurate save state and navigate a newly created rule to its edit URL.
- [x] Keep row priorities editable with keyboard controls as well as dragging.

### Task 5: Verify and finish

Files: `includes/class-init.php`, `gulpfile.mjs`, `README.md`, test and design evidence.

- [x] Enqueue webpack CSS without WordPress component/DataViews styles and preserve generated dependency metadata.
- [x] Run production build, lint, focused unit tests, and browser workflows; fix observed failures.
- [x] Verify responsive screenshots, keyboard interactions, reduced motion, accessibility, and distribution contents.
- [x] Complete a fresh whole-change review and address important findings.
- [x] Update the plan with actual verification results and leave changes uncommitted.


## Execution notes

- The user delegated visual direction and requested execution without further design checkpoints. Work stays in the requested checkout; unrelated changes remain untouched. No commits or pushes were made.
- Baseline production JavaScript was approximately 1.84 MiB. Baseline ESLint reported two unused imports in the old editor, replaced during this rebuild.
- Cost-validation tests failed before `src/lib/rules.js` existed, then passed. Review exposed the backend's explicit-empty legacy row shape; two additional tests reproduced that defect before the helper was corrected.
- A single translated entry was retained after review of WordPress translation loading. Native route splitting would require additional catalog handling. A production-size advisory remains, with a substantially smaller bundle than baseline.
- Review corrections include legacy payload preservation, skip-link focus, settings navigation guards, RTL switch direction, Radix menu direction, and invalid product routes.
- CSV preview responses are revision-checked; changing the input invalidates both existing and in-flight previews.
- Verification and screenshots are recorded in `docs/admin-redesign/verification.md`.


## Navigation revision from user feedback

The user requested the Order Return plugin's design language and rejected the extra sidebar. The workspace now follows that reference's white header, underlined horizontal navigation, local Inter font, full-width main area, and footer proportions. Promotional sidebar content and the main setup banner were removed. Shipping guidance lives in a keyboard-accessible help dialog. The existing WordPress scripts/webpack build, scoped primitives, routing, data protection, and shipping workflows remain in place.

The layout regression test failed against the sidebar before replacement. Verification includes the full workflow suite, navbar placement, bundled font loading, help-dialog keyboard focus, accessibility, and viewport containment. Inter's SIL Open Font License is included in the runtime assets.
