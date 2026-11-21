# Admin redesign verification — 7 November 2026

The requested checkout now contains the rebuilt React administration interface. Screenshots below use an isolated REST fixture with sample products and the site's real WordPress React vendor scripts and admin styles. They do not depict merchant data.

## Result

The visual reference is the current source of `syzenlabs-order-return-for-woocommerce/admin/src/main.jsx` and `admin/src/styles.css`. The supplied live URL redirected this session to WordPress login, so comparison used the local implementation without accessing merchant records.

React Router replaces the custom hash router. Locally owned shadcn/Radix primitives replace WordPress controls and DataViews. The workspace follows the Syzenlabs Order Return admin: white brand header, horizontal underlined navigation, local Inter typography, neutral full-width content, consistent panel spacing, keyboard interactions, and reduced-motion support. The extra sidebar and promotional setup banner are removed; shipping guidance is available in Workspace help. Shipping Rules replaces Overview; import/export remain in that workspace. Settings includes retention and shipping-zone access.

The required `@wordpress/scripts` webpack build remains responsible for JavaScript, Tailwind/PostCSS, shared React dependency metadata, and LTR/RTL styles. Gulp only packages runtime files. The distributed ZIP excludes source tooling, tests, documentation, and obsolete DataViews assets.

## Checks

| Check | Evidence |
| --- | --- |
| Clean dependency install | `npm ci --ignore-scripts --no-audit --no-fund` completed successfully with 1,757 packages. |
| ESLint | `npm run lint` passed. |
| Shipping data tests | `npm run test:unit`: 11 tests passed, including explicit-empty legacy records, zero, invalid numbers, enabled overrides, fallback validation, and reorder boundaries. |
| Browser workflows | `npm run test:admin`: all 21 tests passed in 34.1 seconds after the final production build. |
| Production build | `npm run build` passed and generated the installable ZIP. |
| PHP/bootstrap | Actual plugin bootstrap loaded with isolated WordPress stubs under Local PHP 8.2.29. Screen scoping, shared React, nonce/configuration, translations, LTR/RTL assets passed. |
| PHP syntax | Changed bootstrap and asset loader passed `php -l`. |
| Version updater | A version bump in a disposable copy retained the corrected constant and updated package metadata. |
| Package contents | 28 ZIP entries include the required bundle, both stylesheets, dependency metadata, corrected bootstrap, local Inter font, and its SIL Open Font License. No DataViews assets, tests, docs, or node_modules. |
| Runtime dependency audit | `npm audit --omit=dev`: zero vulnerabilities. |
| Independent review | Review findings corrected and rechecked; no remaining concrete important defects reported. |

Browser coverage includes product search, type filters, pagination, export, product creation, blank-cost validation, saving and reloading variations, unsaved navigation, confirmed deletion, CSV preview invalidation (including in-flight responses), confirmed import, settings persistence, permission failures, save failures, legacy calculations, row priority, stale search responses, RTL controls, invalid IDs, and keyboard dialog focus. Accessibility checks cover the rules list at 320, 768, 1024, and 1440 px plus the editor, settings, import dialog. Workspace help is also checked for opening, keyboard dismissal, and restored trigger focus. Checks wait for finite entrance transitions to finish before measuring text contrast. The page stays within the viewport at all four widths; tables scroll inside their containers.

## Review corrections

- Preserve backend legacy destinations with explicit blank line/item fields and a stored legacy cost. Location edits retain the original calculation; editing a cost normalizes its destination. The editor explains legacy conversion.
- Protect editor and settings changes through React Router and browser unload handlers. Prevent route exits during a pending save.
- Keep the skip link inside the current route and focus the content.
- Let generated RTL CSS position toggle thumbs; explicitly pass direction to Radix menus and selects.
- Reject invalid edit IDs before fetching or rendering a creation form.
- Keep translated pages in one registered script handle.
- Correct the bootstrap version constant and its updater so the localized version cannot trigger a fatal error.

## Remaining tooling observations

Webpack retains its standard size advisory for the roughly 418 KiB JavaScript bundle. It is about 78% smaller than the previous 1.84 MiB bundle. Screens remain in one entry to preserve WordPress translation loading through the existing handle.

The inherited development toolchain audit reports 87 advisories: 12 low, 32 moderate, 39 high, and 4 critical. `basic-ftp`, `proxy-addr`, `shell-quote`, and `websocket-driver` are development dependencies. They are absent from the distributed runtime ZIP, and the production dependency audit is clean. A non-mutating remediation preview proposed 125 package changes; the recommended WordPress scripts remediation also includes a major upgrade. That broader toolchain update is deferred to a separately tested change; review by 7 December 2026. No forced dependency upgrades or blanket lifecycle-script execution were performed.

## Workspace integrity

No merchant database was bootstrapped or modified during testing. No plugins were activated or deactivated. Existing `.serena` deletions and branding files were left untouched. The original modified lockfile was snapshotted before the required dependency updates. No commits or pushes were made.

## Previews

The previews were refreshed on 21 November 2026 to show the current admin interface with the box logo.

- [Desktop shipping rules](rules-desktop.png)
- [Mobile shipping rules](rules-mobile.png)
- [Rule editor](rule-editor.png)
- [Settings](settings.png)
- [CSV import](csv-import.png)
- [RTL shipping rules](rules-rtl.png)
