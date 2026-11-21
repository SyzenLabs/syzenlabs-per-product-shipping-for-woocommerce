# Premium shipping administration

The merchant should be able to find a product, understand its shipping configuration, and change destination rates without fighting WordPress controls. The user requested React, shadcn UI, React Router, smooth animation, and a premium finish, with `@wordpress/scripts` and webpack required. They delegated the visual direction and waived further design checkpoints.

## Direction and approaches

Use the existing Syzenlabs Order Return admin as the visual reference: a white brand header, a horizontal navigation bar with underlined active tabs, locally bundled Inter typography, neutral workspace surfaces, and full-width content. The user explicitly rejected the secondary sidebar. Use the [box symbol](../../branding/2026-10-30/reference-box/icon.svg) and teal/citrus palette while matching the reference header height, navigation spacing, content gutters, panel shape, typography, and control density. Keep shipping-zone guidance in an accessible workspace-help dialog rather than a promotional banner.

## Scope

- Shipping Rules becomes the landing page; redirect the former Overview route.
- A searchable, paginated rules table includes type filtering, selection, confirmed deletion, and CSV export.
- Import stays a focused dialog with file/mode selection, explicit preview, errors, and confirmed commit. Changing the file or mode invalidates the preview.
- A dedicated routed rule editor supports searchable products, parent rates, variation overrides, line/item costs, fallback costs, and accessible row reordering. All navigation protects unsaved changes.
- Replace the one-toggle settings page with a useful compact settings panel including shipping-zone access and clearly explained data retention.
- Keep backend shipping calculation and storage semantics intact. Use existing authenticated REST endpoints and nonce middleware. No new tracking, external runtime services, or fake analytics.
- Provide loading, empty, error, retry, saving, and success states. Prevent stale responses and duplicate submissions.

## Technical contract

Use React Router's hash data router to coexist with `admin.php?page=syzepps-dashboard` and support navigation blocking. Keep legacy `#rules`, `#rule-add`, `#rule-edit/ID`, and `#settings` links functional. Components are JavaScript, locally owned, with Radix focus and keyboard behavior, CVA variants, Lucide icons, and Tailwind 3 with prefixed utilities and no global preflight. Styles and portals stay within the plugin root. Build CSS and JS through the existing `@wordpress/scripts` webpack base; Gulp only packages the distribution. Respect WordPress localization, RTL, and shared React dependencies.

Use short opacity/transform transitions and Radix state animations, honoring `prefers-reduced-motion`. Avoid remote fonts and ornamental charts. Horizontal navigation stays above the content at every screen size. Secondary header utilities simplify on small screens, with shipping zones also available through help and settings. Tables scroll within their containers; the page must not overflow at 320, 768, 1024, or 1440 px.

## Verification

Run a production build and ESLint. Add focused regression coverage for cost validation, legacy values, and priority movement, plus browser workflow tests using the actual compiled bundle and WordPress vendor scripts with an isolated REST fixture server. Cover navigation, save/reload, variation overrides, unsaved changes, search/filter/pagination, CSV preview invalidation, errors, settings, keyboard dialogs, reduced motion, and responsive layouts. Inspect screenshots and run accessibility checks. Do not mutate or activate plugins on the merchant database.

## Workspace

The requested checkout already contains unrelated deleted `.serena` files, lockfile edits, and untracked branding. Preserve them, retain an original lockfile snapshot, and leave the implementation reviewable in the requested checkout without committing or pushing.
