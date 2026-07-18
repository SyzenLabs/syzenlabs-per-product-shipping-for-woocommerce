# Syzenlabs Per Product Shipping for WooCommerce — Clone-First Implementation Plan

**Project:** Syzenlabs Per Product Shipping for WooCommerce
**Plugin slug:** `syzenlabs-per-product-shipping-for-woocommerce`
**Text domain:** `syzenlabs-per-product-shipping-for-woocommerce`
**PHP namespace:** `SYZEPPS`
**Code prefix:** `syzepps`
**Initial version:** `1.0.0`
**Primary platform:** WordPress + WooCommerce
**Source baseline:** Authorized WowShipping codebase copied into this plugin directory
**Last updated:** 2026-07-18

---

## 0. Executive summary

Build the new per-product shipping plugin by adapting the copied WowShipping project in place.

This is not a greenfield scaffold task. The copied plugin already provides the build chain, WordPress/WooCommerce boot pattern, React admin shell, shared UI components, styling system, REST conventions, option-backed storage pattern, packaging scripts, and generated-asset layout. Implementation must modify, rename, or disconnect those files before creating replacements.

Primary approach:

1. Rebrand and isolate every runtime identity so WowShipping and this plugin can coexist.
2. Repair the copied bootstrap and build configuration before feature work.
3. Remove the license subsystem and all license-dependent code.
4. Disconnect old table-rate, carrier, analytics, promotion, and global-method runtime paths.
5. Keep unused copied files temporarily when they are not loaded. Remove them only after the new plugin works end to end.
6. Preserve close visual and structural parity with the WowShipping admin by restoring and adapting its React shell, WordPress component compositions, shared UI components, contexts, tokens, and interaction patterns inside this plugin.
7. Use `@wordpress/components` and `@wordpress/dataviews` as the default admin UI primitives. Raw HTML controls and new bespoke replacements are prohibited when WordPress or the authorized WowShipping source already provides the required component.
8. Keep the copied UI self-contained under the new plugin. It must never import runtime code or assets from an installed WowShipping plugin.
9. Rename only the requested rule page paths:
   - `shipping-methods` to `rules`
   - `shipping-methods-add-edit` to `rule-edit`
   - `shipping-methods-instance-add-edit` to `rule-add`
10. Treat `includes/` as the exception: PHP files may be rewritten, renamed, or deleted when the old responsibilities do not fit.
11. Build the plugin in working vertical slices: bootstrap, shared admin UI foundation, basic WooCommerce method, one product rule, variation rules, destination matching, bulk management, import/export, then cleanup.

The finished plugin solves one job: merchants define shipping costs for simple products and variable-product families from one product-first flow, optionally by destination with a line cost applied once and an item cost multiplied by quantity, while each WooCommerce shipping-zone method instance controls standalone package aggregation, default cost, handling fees, and suppression of Free Shipping or Local Pickup. Product-level Adjust Shipping Costs can instead add resolved configured costs to other non-free, non-`syzepps_wc_method` rates.

---

## 1. Confirmed decisions

### 1.1 Source reuse

- The copied WowShipping codebase is authorized for direct reuse.
- Existing PHP, React, SCSS, build, and utility code may be adapted.
- Old WowShipping and WPXPO product identity must not appear in the new plugin's runtime UI, public copy, generated assets, package metadata, or release artifact.
- GPL notices and third-party license obligations remain applicable.

### 1.2 Existing-file-first rule

- Modify or rename an existing file when its responsibility still fits.
- Do not create a parallel implementation beside an existing one.
- New files are allowed only when no existing file maps cleanly to the required responsibility.
- Tests may add new files because the copied project has no configured automated test suite.
- Unused copied files may remain during development if they are unreachable from the runtime boot/import graph.

### 1.3 PHP exception

- `includes/` contains large table-rate, promotion, analytics, and carrier-specific systems that do not fit this plugin.
- PHP files may be rewritten from scratch, renamed, or deleted.
- Prefer clean domain ownership over preserving an unsuitable PHP class only to avoid a file change.
- Do not eagerly delete unrelated PHP before the replacement path works, except for the license subsystem, which must be removed early.

### 1.4 React path decision

Use these physical page paths and runtime routes:

| Current copied path | Target path | Target route | Treatment |
| --- | --- | --- | --- |
| `src/pages/shipping-methods/` | `src/pages/rules/` | `rules` | Rename and repurpose as product/variation rule list. |
| `src/pages/shipping-methods-add-edit/` | `src/pages/rule-edit/` | `rule-edit/:id` | Rename and repurpose existing form and subcomponents. |
| `src/pages/shipping-methods-instance-add-edit/` | `src/pages/rule-add/` | `rule-add` | Rename and rewrite as rule creation flow. |

Rules:

- Keep other useful `src/` paths unchanged.
- Delete `src/pages/license/` and remove its imports, menu entry, route, helpers, and localized data.
- Keep shared layout, UI primitives, hooks, contexts, and SCSS in their current structure unless a later task proves they cannot serve the new plugin.
- Do not create separate `product-rates` or `import-export` page trees. Product-rate import/export belongs inside the Rules experience.
- WooCommerce shipping method instance settings use native `WC_Shipping_Method` form fields rendered in WooCommerce's shipping-zone modal for both create and edit; they do not need a dedicated React page.
- The React Rules dashboard is the sole editing surface for product and variation shipping configuration. Do not register fields or save handlers on WooCommerce product or variation edit screens.

### 1.5 Generated files

Do not hand-edit:

- `assets/js/*`
- compiled files under `assets/css/*`
- `src/style-generated.css`
- generated language files
- `build/*`
- `vendor_prefixed/*`

Change source/configuration, then rebuild.

### 1.6 Binding admin UI architecture

The active WowShipping source at `/home/sam/Local Sites/shippingrule/app/public/wp-content/plugins/wow-table-rate-shipping` is the authoritative UI reference. Syzenlabs must look and behave like a self-contained sibling product, not an independently designed WordPress admin screen.

Required rules:

- Copy and adapt the relevant WowShipping source into this plugin. Never import runtime modules, styles, images, or built assets from the sibling plugin directory.
- Use `@wordpress/components` for buttons, cards, stacks, typography, inputs, selects, toggles, checkboxes, tooltips, modals, notices, spinners, and other available primitives.
- Use `@wordpress/dataviews/wp` for the Rules collection rather than a hand-built `widefat` table.
- Restore and adapt WowShipping's useful compositions before creating anything new: header/navigation, popup layout, select, multi-select, file uploader, prompt, sidebar, badge, skeleton, toast, and their supporting contexts.
- Keep component composition, spacing, control sizing, loading states, empty states, confirmation flows, and responsive behavior close to WowShipping. Product-specific data and copy may differ; the design language may not.
- Preserve the target package's component APIs, including its current experimental WordPress primitives where no stable direct equivalent is already used by the target. Do not replace them with custom HTML merely because the export is experimental.
- Port and rename the target SCSS tokens and narrowly required WordPress/DataViews overrides from `wtrs` to `syzepps`. Scope plugin styling under `.syzepps-admin` or the plugin mount/portal so both plugins can run together without CSS leakage.
- A custom component is allowed only when neither WordPress Components nor an existing WowShipping composition supplies the behavior. The implementation task must record that gap and build the smallest composition from WordPress primitives.
- Do not use browser `alert()`, `confirm()`, or `prompt()` for product UI. Use the adapted Prompt/Modal and Toast/Notice flows.
- Do not ship raw `<button>`, `<input>`, `<select>`, or bespoke tables as substitutes for available WordPress/WowShipping components. Semantic HTML inside a component is still allowed where no higher-level primitive exists, such as the destination-rate grid after its interactive controls use WordPress components.
- Copy only active, reusable UI and its dependencies. License, Pro, AI, promotions, carriers, analytics, tutorials, remote marketing, and WPXPO-specific UI remain excluded.

This section is an acceptance contract, not a styling preference. A screen that implements the workflow but ignores this architecture is incomplete.

---

## 2. Baseline study findings

### 2.1 Copied structure

At the initial clone-first planning baseline, excluding hidden agent state, worktrees, vendors, and build output, the copied project contained 268 files and its main source trees matched WowShipping:

| Area | Copied files | Finding |
| --- | ---: | --- |
| `includes/` | 30 | Full table-rate backend, REST, admin, promotion, and compatibility code was present at baseline. |
| `src/` | 141 | The full React admin app and reusable component system were present at baseline. |
| `carriers/` | 22 | The live-rate subsystem was present but is out of scope. |
| `assets/` | 35 | Old generated and branded assets were present. |
| `languages/` | 16 | Old WowShipping translations were present. |
| `scripts/` | 4 | Version, dependency-key, build-open, and AI translation scripts were present. |
| `traits/` | 1 | The reusable singleton trait was present. |

The copied tree differs from the source mainly by:

- renamed root plugin file: `syzenlabs-per-product-shipping-for-woocommerce.php`
- added `docs/plan.md`
- omitted original project docs
- omitted `composer.json`, `composer.lock`, `vendor/`, and `vendor_prefixed/`

### 2.2 Current bootstrap is not a valid new-plugin bootstrap

`syzenlabs-per-product-shipping-for-woocommerce.php` currently:

- still uses namespace `WTRS`
- still defines `WTRS_*` constants
- still declares WowShipping text domain/package identity
- still describes table rates and live carriers
- does not call `spl_autoload_register( 'wtrs_autoloader' )`
- no longer loads the omitted prefixed Composer autoloader
- instantiates `WTRS\Includes\Init`

The first implementation task must repair this before any feature work. Do not debug later admin or shipping behavior on top of this bootstrap.

### 2.3 Current runtime loads unrelated systems

`includes/class-init.php` currently loads or instantiates:

- live carrier manager
- table-rate REST controllers
- old WooCommerce hooks
- Modern Cart compatibility for old free-shipping rules
- global WowShipping method
- old import helper
- WowAddons and WowRevenue promotions
- WPXPO product promotion UI
- license state and renewal data
- old admin notices and deactivation logic

The new `Init` must register only the new plugin's active services. Dormant files are acceptable; dormant hooks are not.

### 2.4 Current build and release configuration still targets WowShipping

Observed hard-coded contracts:

| File | Existing contract that must change |
| --- | --- |
| `package.json` | package name, POT path/slug, Composer-dependent scripts |
| `package-lock.json` | old package identity and dependency graph |
| `webpack.config.js` | entry/output name `wtrs-backend` |
| `gulpfile.mjs` | `wtrs-*` CSS names, old package folder/ZIP name, old release worktree flow |
| `.eslintrc` | global `wtrsAdmin` |
| `.gitignore` | generated `wtrs-*` asset names |
| `scripts/ver-updater.js` | `WTRS_VER` and `wow-table-rate-shipping.php` |
| `scripts/ai-translate-i18n.mjs` | old POT path and `WTRS_I18N_LOCALES` |
| `scoper.inc.php` | vendor prefix `WTRS_Vendor` |
| `bitbucket-pipelines-original.yml` | old WordPress.org slug, old repository, and old credentials names |
| `readme.txt` and `README.md` | WowShipping product, marketing, author, install, and support copy |
| `uninstall.php` | old options, carrier secrets, scheduled hooks, and method ID |

`gulp package-ci` also prepares a release worktree and force-pushes the old release branch/tag to the old repository. It must not be run until replaced or disabled.

### 2.5 Composer decision

The copied plugin has no `composer.json` or prefixed vendor tree. WowShipping used Composer only for the carrier box-packing dependency, which is out of scope.

Decision for initial implementation:

- do not restore the carrier Composer dependency
- remove `composer install-prefixed` from active npm build/release scripts
- do not require `vendor_prefixed/vendor/autoload.php` from the new bootstrap
- leave `scoper.inc.php` dormant until final cleanup, or delete it after confirming no PHP dependency needs prefixing
- add Composer later only if a real new-plugin dependency requires it

This keeps the cloned structure where useful without preserving a broken dependency pipeline.

### 2.6 Post-baseline admin UI regression

A 2026-07-14 comparison of the active source trees found:

- WowShipping has 103 JavaScript source files; 68 import `@wordpress/components`.
- Syzenlabs has 10 JavaScript source files; none import `@wordpress/components`.
- The Syzenlabs implementation replaced the copied shell and component inventory with raw inputs, selects, buttons, tables, headings, WordPress CSS utility classes, browser prompts, and approximately 6 KB of bespoke admin SCSS.
- Shared WowShipping assets such as PopupLayout, DataViews composition, Select, MultiSelect, FileUploader, Prompt, Sidebar, Badge, Skeleton, Toast, navigation contexts, UI tokens, and WordPress/DataViews overrides are absent from the active Syzenlabs source.

This is the UI architecture mistake this revision corrects. Do not incrementally skin the custom shell. Restore the authorized WowShipping UI foundation, adapt it to the per-product domain, and then remove the superseded custom markup and styles.

---

## 3. Product scope

### 3.1 Product promise

> Configure WooCommerce shipping costs per product family, including separate destination line/item costs, complete variation overrides, standalone calculation, other-method cost adjustment, bulk management, and CSV import/export.

### 3.2 In scope

1. Safe plugin bootstrap and WooCommerce dependency guard.
2. WooCommerce shipping method registration.
3. Shipping-zone method instances, enabled or disabled through WooCommerce's native zone control.
4. Product-level rates.
5. Variation-level rates with explicit parent inheritance or complete per-variation overrides.
6. Product-level Adjust Shipping Costs for simple products and variable-product parents; resolved configured costs are added to other shipping methods except Free Shipping and `syzepps_wc_method`.
7. Destination matching by country, state, city, and postcode.
8. Postcode exact, wildcard, numeric range, and comma-list matching.
9. Destination-rate cost components:
   - line cost applied once to the matching cart line, regardless of quantity
   - item cost multiplied by the matching cart-line quantity
   - both components may be configured on the same destination row and are added together
10. Fallback and legacy single-cost modes:
   - per order
   - per item
   - per line item
   - per quantity step
11. Ordered destination rows; the first matching row wins.
12. Shipping-method calculation methods:
   - sum all resolved product components
   - use the highest resolved product component
   - use the lowest resolved product component
13. Instance-level default product cost for shippable products without a configured product or variation rate.
14. Per-product and per-order handling fees, each configurable as fixed or percentage.
15. Optional suppression of Free Shipping and Local Pickup rates in the same package when this method produces a rate.
16. Zero-valued line costs, item costs, and fallback costs as valid configured free-shipping rates.
17. Product-family Rules list, searchable product-first add/edit flow, and bulk rate action.
18. Product/variation rule CSV import/export with dry run.
19. HPOS audit and declaration.
20. Classic and block cart/checkout support through WooCommerce shipping APIs.
21. Security, i18n, tests, and release packaging.

### 3.3 Out of scope

1. Carrier/live-rate integrations.
2. Box packing or advanced package splitting.
3. Full table-rate engine.
4. Generic cart/customer condition builder.
5. Formula parser.
6. Visibility control for shipping methods other than Free Shipping and Local Pickup.
7. Persistent debug logs or analytics tables.
8. Full simulator page.
9. Marketplace/vendor shipping.
10. Onboarding wizard.
11. External management API.
12. Migration from unrelated shipping plugins.
13. License activation, renewal, expiry, feature gating, or paid-tier logic.
14. WPXPO product promotion, plugin installer, sales banners, or remote marketing notices.
15. Analytics and order-log UI.

---

## 4. Runtime identity and coexistence contract

Every active runtime identity must use the new plugin namespace/prefix. WowShipping may be active at the same time.

| Contract | New value |
| --- | --- |
| PHP namespace | `SYZEPPS` |
| Constants | `SYZEPPS_VER`, `SYZEPPS_URL`, `SYZEPPS_BASE`, `SYZEPPS_PATH`, `SYZEPPS_RULE_VER` |
| Autoloader function | `syzepps_autoloader()` |
| Init function | `syzepps_init()` |
| Shipping method ID | `syzepps_wc_method` |
| REST namespace | `syzepps/v1` |
| Admin page slug | `syzepps-dashboard` |
| JS localized global | `syzeppsAdmin` |
| Webpack entry | `syzepps-backend` |
| Script/style handles | `syzepps-*` |
| Root DOM ID | `syzepps-dashboard-wrap` |
| Nonce action | `syzepps-nonce` |
| CSS scope | `.syzepps-admin` |
| Product-rate option | `syzepps-product-rates` |
| Settings option | `syzepps-settings` |
| Text domain | `syzenlabs-per-product-shipping-for-woocommerce` |

Coexistence requirements:

- No active `WTRS\` classes, `WTRS_*` constants, `wtrs_*` functions/hooks, `wtrsAdmin` global, `wtrs-*` handles, or `wtrs_wc_method` registration.
- The new uninstall process must never delete WowShipping options, methods, credentials, transients, or scheduled hooks.
- Dormant copied files may contain old identifiers during development only when they are not autoloaded, included, imported, enqueued, or packaged for release.
- Before release, stale identity search must be clean in shipped source and generated assets, except preserved third-party/legal attribution where required.

---

## 5. Structure adaptation plan

### 5.1 Root and build files

Modify existing files:

- `syzenlabs-per-product-shipping-for-woocommerce.php`
- `package.json`
- `package-lock.json`
- `webpack.config.js`
- `gulpfile.mjs`
- `tailwind.config.js` only if content paths change
- `.eslintrc`
- `.gitignore`
- `scripts/ver-updater.js`
- `scripts/update-deps-key.mjs`
- `scripts/open-build.js` if package output path changes
- `scripts/ai-translate-i18n.mjs`
- `uninstall.php`
- `readme.txt`
- `README.md`

Do not run old release automation until its repository, slug, credentials, artifact path, and push behavior are explicitly replaced.

### 5.2 PHP treatment

#### Reuse and rewrite in place

| Existing file | New responsibility |
| --- | --- |
| `includes/class-init.php` | Minimal dependency-aware plugin boot and asset enqueue. |
| `includes/class-db.php` | Option-backed product/variation rule repository; rename only if a clearer repository name is chosen. |
| `includes/class-wow-shipping-method.php` | Rename/rewrite as the per-product `WC_Shipping_Method`. |
| `includes/rest/class-rest.php` | Admin-only rules/settings/import/export routes. |
| `includes/utils/class-hooks.php` | Shipping registration, package-rate filtering, and product/variation delete cleanup; no product-editor fields or saves. |
| `includes/utils/class-options.php` | WooCommerce submenu and React mount. |
| `includes/utils/class-sanitizer.php` | Product-rule and settings boundary sanitization. |
| `includes/utils/class-plugin-actions.php` | Settings link only; no upgrade/license links. |
| `includes/utils/class-import-helper.php` | Product/variation rule import and dry run. |
| `includes/utils/class-export-helper.php` | Product/variation rule export. |
| `traits/trait-singleton.php` | Existing singleton lifecycle where appropriate. |

#### Disconnect first; delete later after replacement works

- `carriers/`
- `includes/class-condition-evaluator.php`
- `includes/class-conditions.php`
- `includes/class-handling-fee.php`
- `includes/class-method-helper.php`
- `includes/class-rule-visibility.php`
- `includes/class-wow-shipping-global-method.php`
- `includes/class-zone-validator.php`
- `includes/compatibility/class-modern-cart-compatibility.php`
- `includes/rest/class-analytics-rest.php`
- `includes/rest/class-carrier-rest.php`
- old condition and shipping-region routes not used by per-product rules

No old subsystem may remain hooked while merely being "unused" in the UI.

#### Remove early

- `includes/class-xpo.php`
- `includes/class-wow-addons-promotion.php`
- `includes/class-wow-revenue-promotion.php`
- license/renewal branches in `includes/utils/class-plugin-actions.php`
- license-dependent code in `includes/utils/class-flags.php`
- remote promotion/license notice logic in `includes/utils/class-notice.php`
- old plugin installer/deactivation marketing code when no new-plugin responsibility remains

### 5.3 React treatment

#### Restore and adapt the WowShipping foundation

If an authorized source file was deleted from the current Syzenlabs tree, copy it from the active WowShipping source and adapt it locally. Restore only the dependency closure required by the active screens.

Required foundation:

- `src/index.js`, using the adapted provider and navigation composition rather than an isolated local router shell
- `src/components/layout/header/`, stripped of AI, Pro, license, promotion, and remote-account controls
- `src/components/layout/popup-layout/` for Rule add/edit
- `src/components/ui/badge/`
- `src/components/ui/file-uploader/`
- `src/components/ui/multi-select/` where multi-value selection is required
- `src/components/ui/prompt/`
- `src/components/ui/select/` and `select-compact/` where their target behavior is required
- `src/components/ui/sidebar/` where import or focused side-panel flows use it
- `src/components/ui/skeleton/`
- `src/components/ui/toast/`
- `src/context/nav-context.js`
- `src/context/toast-context.js`
- `src/context/prompt-context.js`
- `src/context/shipping-rule-config-context.js`, repurposed for product-family API state
- `src/context/shipping-zone-context.js` or `shipping-options-context.js` only when an active screen still owns that data
- `src/utils/wpc-config.js` and only generic, local utility functions used by the restored components
- `src/scss/_variables-tokens.scss`, narrowly required WordPress/DataViews overrides, component SCSS, page SCSS, and the backend entry

Rename component names, CSS classes, variables, DOM IDs, text domains, and product copy from `wtrs` to `syzepps`. Remove old business behavior; preserve the component composition and visual system.

Restore package dependencies required by the adapted source, including `@wordpress/dataviews`, `@wordpress/icons`, and `@wordpress/api-fetch` when imported. Continue using `@wordpress/scripts` so WordPress package imports are externalized and recorded in generated asset metadata.

#### WordPress-components-first rule

Active pages must compose the same families of primitives used by WowShipping:

- layout: `Card`, `CardHeader`, `CardBody`, `Flex`, `HStack`, `VStack`, `Grid`, and `Divider`
- content: `Heading`, `Text`, `Badge`, icons, and tooltips
- forms: `InputControl`, `SelectControl`, `ToggleControl`, `CheckboxControl`, `FormToggle`, and related wrappers
- actions and state: `Button`, `Modal`, `Notice`, `Spinner`, and adapted Prompt, Toast, and Skeleton compositions
- collections: `DataViews` from `@wordpress/dataviews/wp`

Do not retain the current raw-control implementation beside the restored component implementation. One active component system is allowed.

#### Rename and repurpose pages

- `src/pages/shipping-methods/` to `src/pages/rules/`
- `src/pages/shipping-methods-add-edit/` to `src/pages/rule-edit/`
- `src/pages/shipping-methods-instance-add-edit/` to `src/pages/rule-add/`

`rule-add` and `rule-edit` share the same adapted product-family form, PopupLayout, validation rendering, destination-rate editor, Prompt, Toast, and loading components. They must not duplicate form markup.

#### Remove from runtime

- license page and components
- Pro, renew, expired-license, AI, and account controls
- analytics/order-log route
- WPXPO plugins route
- carrier forms and carrier metadata
- support, tutorial, review, and marketing widgets
- Konami/easter-egg behavior

Files unrelated to licensing may stay dormant until final cleanup. License code itself must be deleted, not merely hidden. No excluded UI may be copied back as an accidental dependency of a restored shared component.

### 5.4 Admin navigation

Initial active navigation:

1. Overview
2. Rules
3. Settings

Rules routes:

- `#rules`
- `#rule-add`
- `#rule-edit/{product_id}`

Import/export is a section or action within Rules, not a separate top-level page.

---

## 6. License subsystem removal contract

Removal is complete only when all conditions pass:

1. Delete `src/pages/license/`.
2. Remove `License` imports, route creation, and menu insertion.
3. Remove `showLicensePage()`, `getLicense()`, `getRenewLink()`, `isExpiredUser()`, and equivalent helpers.
4. Remove `isActive`, `license`, `isExpired`, `renewLink`, and `show_lic_page` from localized JS data.
5. Remove all reads/writes of `edd_wtrs_license_key` and `edd_wtrs_license_data`.
6. Remove `WTRS_PRO_VER` and equivalent paid-tier checks from the new runtime.
7. Delete `includes/class-xpo.php` after all references are removed.
8. Remove renew/expiry UI from header buttons, notices, Pro wrappers, and overview cards.
9. Remove remote license/account URLs and activation/deactivation requests.
10. Do not migrate, clear, or alter old WowShipping license data; it belongs to the other plugin.
11. Rebuild JS/CSS so generated assets contain no license UI or old localized contract.
12. Verify a source search for license identifiers has no executable matches. GPL header text using the word "License" is expected and not part of this subsystem.

---

## 7. Core data model

### 7.1 WordPress option storage

Use WordPress options, following the useful storage pattern from the copied `DB` class. Do not use product meta or custom tables in v1.

| Option | Autoload | Purpose |
| --- | --- | --- |
| `syzepps-product-rates` | no | Product and variation settings and destination rules. |
| `syzepps-settings` | yes | Small plugin-wide settings only. |

Shape:

```json
{
  "version": 1,
  "products": {
    "123": {
      "adjust_shipping_costs": false,
      "calculation_mode": "per_line",
      "fallback_cost": "",
      "rules": [
        {
          "id": "rule_01",
          "country": "US",
          "state": "CA",
          "city": "",
          "postcode": "90000-96999",
          "line_cost": "12.50",
          "item_cost": "2.00"
        }
      ]
    }
  },
  "variations": {
    "456": {
      "parent_id": 123,
      "enable_per_variation_shipping": false,
      "calculation_mode": "parent",
      "fallback_cost": "",
      "rules": []
    }
  }
}
```

Repository requirements:

- Product-family Rules UI, import/export, checkout, and deletion cleanup use one repository; WooCommerce product and variation edit screens do not edit this data.
- Product and variation IDs are array keys, not separate options; every variation record retains its `parent_id`.
- `adjust_shipping_costs` exists only on simple/parent product records and applies to every variation in that product family.
- `enable_per_variation_shipping` is the sole variation inheritance switch. `false` uses the parent record; `true` makes the variation table and fallback a complete override with no parent fallback.
- Large rate data uses `update_option( 'syzepps-product-rates', $data, false )`.
- Settings use `update_option( 'syzepps-settings', $settings, true )` only while the data remains small.
- Product deletion removes its record and child variation records; variation deletion removes only that child record.
- Reads validate option type and version before use.
- Writes sanitize the complete affected product family before persistence.

### 7.2 WooCommerce instance settings

WooCommerce owns these settings per shipping-zone method instance:

| Setting | Type | Purpose |
| --- | --- | --- |
| Title (`title`) | string | Checkout label. |
| Tax status (`tax_status`) | enum | `taxable` or `none`. |
| Calculation Method (`calculation_method`) | enum | **Sum** (`sum`), **Highest** (`highest`), or **Lowest** (`lowest`); combines resolved base product components for the package. |
| Default product cost (`default_product_cost`) | non-negative decimal or empty | Cost per shippable unit when neither a variation override nor inherited/product rate is configured. Empty means no default component. |
| Handling fee (per product) type (`product_handling_fee_type`) | enum | `none`, `fixed`, or `percentage`. |
| Handling fee (per product) (`product_handling_fee`) | non-negative decimal | Fixed fee per shippable unit, or percentage of each line's resolved base component. |
| Handling fee (per order) type (`order_handling_fee_type`) | enum | `none`, `fixed`, or `percentage`. |
| Handling fee (per order) (`order_handling_fee`) | non-negative decimal | Fixed fee once per package, or percentage of the aggregated base plus per-product handling subtotal. |
| Ignore Free Shipping (`ignore_free_shipping`) | checkbox | Remove `free_shipping` rates from the package when this method produces an available rate. |
| Ignore Local Pickup (`ignore_local_pickup`) | checkbox | Remove `local_pickup` rates from the package when this method produces an available rate. |

WooCommerce's shipping-zone control remains the only enable/disable owner. Fee type `none` disables its paired amount. Percentage values use `100` for 100%; all monetary calculations retain WooCommerce decimal precision until the final rate is passed to WooCommerce.

The method must declare WooCommerce's `instance-settings-modal` support so creating or editing a zone instance keeps the merchant in the shipping-zone screen and renders these native fields in a modal.

---

## 8. Core runtime responsibilities

### 8.1 Bootstrap and `Init`

- Define and use `SYZEPPS_*` constants.
- Register `syzepps_autoloader()` before constructing `SYZEPPS\Includes\Init`.
- Do not require a missing Composer autoloader.
- Exit safely outside WordPress.
- Delay WooCommerce-specific registration until WooCommerce is available.
- Show one local admin notice when WooCommerce is unavailable; no remote notice system.
- Register only active new-plugin services.
- Enqueue new asset handles only on the plugin admin page and relevant WooCommerce method screen.
- Localize only data consumed by the active React app.

### 8.2 Per-product shipping method

The renamed/rebuilt shipping method:

- extends `WC_Shipping_Method`
- uses ID `syzepps_wc_method`
- defines and sanitizes the native instance fields in section 7.2 and declares `instance-settings-modal` support
- implements `calculate_shipping( $package )`
- delegates product lookup, destination matching, aggregation, and fee logic to calculator/repository services
- calls `$this->add_rate()` only when result policy permits
- filters package rates for Adjust Shipping Costs and the two explicit suppression settings; adjustment excludes `free_shipping` and every `syzepps_wc_method` rate
- contains no product matching, postcode parsing, aggregation, or fee arithmetic business logic

### 8.3 Rule repository

- Read/write option-backed parent/simple product records and child variation overrides.
- Return one aggregate product-family payload to Rules add/edit while retaining normalized child records internally.
- Normalize IDs, decimal strings, fallback/legacy modes, `adjust_shipping_costs`, `enable_per_variation_shipping`, fallback costs, and destination-row line/item costs.
- Support parent/simple product list and search data without loading WooCommerce products one by one.
- Delete a product family or individual variation record when its WooCommerce entity is permanently deleted.

### 8.4 Package context and calculator

- Build destination and line-item context once per package.
- Resolve an enabled variation override before parent product rules; an enabled override with no matching row or variation fallback never falls back to the parent.
- Match country, state, city, and postcode deterministically.
- Use destination rows in stored order; the first match wins.
- Resolve a matching destination row as `line_cost + ( item_cost × cart-line quantity )`; either component may be empty, and configured zero values remain valid.
- Apply per-order, per-item, per-line, and per-quantity-step modes only to fallback and retained legacy single-cost rules.
- Route each resolved configured component according to its simple/parent product's `adjust_shipping_costs` value: standalone component when disabled, other-method surcharge when enabled.
- Use instance default product cost only for standalone lines without a configured product/variation amount; it never creates an Adjust Shipping Costs surcharge.
- Combine standalone base components with the instance calculation method: sum, highest, or lowest.
- Calculate per-product handling for standalone shippable units and add those fees after base aggregation so `highest` and `lowest` never discard handling owed for other standalone products.
- Calculate one per-order handling fee when the standalone method is available, after base aggregation and per-product handling.
- Sum adjusted configured components separately and apply that surcharge to every existing package rate except `free_shipping` and `syzepps_wc_method`.
- Treat zero as a valid resolved amount at every stage.
- Return standalone availability and totals plus the separate other-method surcharge.

### 8.5 Postcode matching

Support:

- exact value
- `*` wildcard
- numeric inclusive range such as `90000-96999`
- comma-separated values/patterns
- case and whitespace normalization

Invalid numeric ranges fail closed without warnings or fatal errors.

---

## 9. Calculation contract

For each package:

1. Ignore non-shippable/virtual-only lines according to WooCommerce product behavior.
2. Select the line's record:
   1. for a variation with `enable_per_variation_shipping: true`, select only that variation record
   2. otherwise select the simple/parent product record
   3. never fall back to the parent after selecting an enabled variation override
3. Resolve the selected record:
   1. use the first matching destination row
   2. calculate a matching row as `line_cost + ( item_cost × cart-line quantity )`; an empty component contributes zero
   3. otherwise use that selected record's fallback when configured
   4. preserve configured zero line, item, and fallback values as available
4. Route a configured resolved component using the simple/parent product's `adjust_shipping_costs`:
   1. `false`: include it in the standalone `syzepps_wc_method` calculation
   2. `true`: exclude it from `syzepps_wc_method` and include it only in the other-method surcharge
5. For an unadjusted line with no configured resolved component, use `default_product_cost` per shippable unit when configured. The instance default never contributes to the other-method surcharge.
6. Apply destination line/item arithmetic directly. Apply the selected record's cost mode only to its fallback or a retained legacy single-cost rule. The instance default always applies per shippable unit.
7. Combine standalone base components using `calculation_method`:
   - `sum`: sum every standalone component
   - `highest`: use the single highest standalone component
   - `lowest`: use the single lowest standalone component
8. Calculate per-product handling across standalone shippable units, independent of which standalone base component `highest` or `lowest` selected:
   - fixed: fee amount multiplied by standalone package-line quantity
   - percentage: fee percentage multiplied by that line's standalone resolved base component; a line without a standalone base component contributes zero percentage fee
9. Add the per-product handling subtotal to the aggregated standalone base.
10. Apply per-order handling once when the standalone method is available:
    - fixed: add the fee amount once
    - percentage: multiply the fee percentage by aggregated standalone base plus per-product handling subtotal
11. Add one `syzepps_wc_method` rate when any unadjusted configured/default base component or applicable fixed handling fee makes it available.
12. Hide `syzepps_wc_method` when no standalone component is available and standalone handling contributes no fixed amount.
13. Sum all adjusted configured components and add that surcharge to each existing package rate except Free Shipping and `syzepps_wc_method`; do not create a new rate from the surcharge.

Precedence:

1. enabled variation override, including its own no-match/fallback outcome
2. parent/simple product record when no variation override is enabled
3. instance default product cost for an unadjusted standalone line only

Cost modes for fallback and retained legacy single-cost product/variation rates:

| Mode | Behavior |
| --- | --- |
| `per_order` | Apply the fallback/legacy cost once per package calculation. |
| `per_item` | Multiply the fallback/legacy cost by matching quantity. |
| `per_line` | Apply the fallback/legacy cost once for each matching cart line. |
| `per_quantity_step` | Apply the fallback/legacy cost once for each configured quantity step, with rounding behavior documented and tested. |

Destination line/item arithmetic, fallback cost mode, aggregation, fee type, and adjustment routing are separate concepts. A destination row with a configured `0` line or item cost, or a fallback cost of `0`, remains configured and available. WooCommerce handles shipping taxes and display formatting through standard rate APIs.

### 9.1 Adjust Shipping Costs

- Expose `adjust_shipping_costs` in the Rules add/edit dashboard for simple products and variable-product parents only; every child variation follows the parent value.
- Apply adjustment through WooCommerce's package-rate filter after rates are calculated.
- Sum only configured destination/fallback components routed to adjustment; exclude instance default cost and standalone handling fees.
- Add the surcharge to every package rate except method ID `free_shipping` and method ID `syzepps_wc_method`.
- Never add the surcharge to this plugin's own rate, including another instance of `syzepps_wc_method`; this prevents charging the same product through both paths.
- Never alter Free Shipping.
- Treat configured costs as tax-exclusive. When the target method is taxable, calculate and merge surcharge taxes through WooCommerce shipping-tax APIs using the package product tax classes; do not add display-inclusive amounts directly.
- Do not create a shipping rate when no eligible other method exists.

### 9.2 Other-method suppression

- Apply suppression through WooCommerce's package-rate filter after rates are calculated and adjusted.
- Scope the decision to the current package and the exact Per Product method instance.
- Suppress `free_shipping` only when `ignore_free_shipping` is enabled.
- Suppress `local_pickup` only when `ignore_local_pickup` is enabled.
- Remove all matching rates by method ID, including multiple instances.
- Suppress neither method when this Per Product instance did not add an available rate; this prevents the settings from leaving the customer with no shipping option.
- Never suppress unrelated carrier or custom shipping methods.

---

## 10. Admin UI plan
### 10.0 Binding component and visual contract

Every active admin screen must be rebuilt from the self-contained WowShipping-derived foundation in sections 1.6 and 5.3:

| Syzenlabs surface | Required reference composition |
| --- | --- |
| Global shell | Adapted WowShipping Header using `Card`, `CardBody`, `HStack`, navigation context, local logo/product name, and no Pro/AI/marketing controls. |
| Overview | WowShipping page container, cards, stacks/grid, typography, skeletons, and local-only guidance. |
| Rules | WowShipping shipping-methods Card/header composition plus `DataViews`, WordPress filters/actions, adapted badges, loading skeleton, and empty state. |
| Rule add/edit | WowShipping PopupLayout, fixed header action composition, WordPress controls, adapted shared form sections, Prompt, Toast, and Skeleton. |
| Settings | WowShipping Card/stack/form composition using WordPress controls; no parallel custom settings design. |
| Import/export | Adapted FileUploader, Sidebar/Modal, Prompt, Toast, Button, Spinner/Skeleton, and error-state patterns. |

The current bespoke `syzepps-header`, raw toolbar, `widefat` Rules table, raw fieldsets/controls, browser prompts, and duplicated custom visual treatments are migration inputs only. Remove them when the corresponding adapted screen works.

Visual parity means the two plugins share density, spacing rhythm, typography hierarchy, control sizes, card treatment, navigation behavior, responsive breakpoints, loading/empty/error states, and interaction feedback. Exact product copy, data fields, routes, branding, and excluded commercial features remain Syzenlabs-specific.

Accessibility remains binding: visible labels or screen-reader labels, correct heading order, keyboard operation, focus management for Prompt/Modal/Sidebar, non-color-only status, and usable layouts at 320, 768, 1024, and 1440 CSS pixels.


### 10.1 Overview

Reuse `src/pages/overview/` and its layout shell. Replace old analytics, promotions, carrier cards, reviews, and WPXPO cross-sells with local plugin guidance:

- total configured simple/parent product families and enabled variation overrides
- quick link to add a rule
- quick link to WooCommerce shipping zones
- concise explanation of product, variation, destination, and adjustment precedence

No remote marketing content.

### 10.2 Rules list

Path: `src/pages/rules/`
Route: `#rules`

Restore and adapt WowShipping's shipping-methods Card/header/DataViews composition and shared filters.

Required behavior:

- list one row per configured simple product or variable-product parent; never list variations as independent top-level records
- search by parent/simple product name, SKU, and ID
- filter by product type, category, and shipping class where practical
- show product target, product type, enabled variation-override count, destination-row count, fallback state, and Adjust Shipping Costs state
- link to `#rule-add`
- link each product-family record to `#rule-edit/{product_id}`
- bulk set line cost and item cost at the product-family boundary
- import/export actions in the same page

### 10.3 Rule add

Path: `src/pages/rule-add/`
Route: `#rule-add`

- begin with a searchable product selector; search simple and parent products by name, SKU, and ID, never select a variation independently
- show no rate fields until a product is selected
- prevent accidental duplicate product-family records
- for a simple product, then show its destination rate table with separate Line cost and Item cost columns, fallback cost, and Adjust Shipping Costs checkbox directly
- for a variable product, then show one accordion for the parent and one accordion for each variation
- put the parent destination table with separate Line cost and Item cost columns, parent fallback cost, and Adjust Shipping Costs checkbox in the parent accordion
- put Enable Per Variation Shipping in every variation accordion
- when a variation checkbox is disabled, show that it follows parent rates and do not expose editable variation rate/fallback fields
- when enabled, reveal that variation's destination table with separate Line cost and Item cost columns and its fallback cost; this is a complete override and never falls back to the parent
- do not expose calculation mode in the Rules builder; preserve each record's stored mode
- present each destination rate set in a table with one rate per row
- sort rows only through their drag handles; show no priority column or sorting buttons
- outline the destination row currently hovered during dragging
- treat the top rate as highest priority; the first matching rate wins
- label and validate Line cost as a tax-exclusive amount applied once to the cart line and Item cost as a tax-exclusive amount multiplied by quantity
- validate the complete product family before save
- save the parent and all variation states atomically through `syzepps/v1`
- return to Rules with a toast and visible saved product-family record

### 10.4 Rule edit

Path: `src/pages/rule-edit/`
Route: `#rule-edit/{product_id}`

- load one simple/parent product family and all of its variation states
- reuse the same product selector summary and adapted form components as Rule add; the saved target is not replaceable
- render simple products directly and variable products as parent/variation accordions exactly as in Rule add
- preserve calculation modes and unknown compatible fields during updates
- show each enabled record's destination rates in the same drag-sortable table as Rule add
- show validation errors at the product, variation, field, and row level
- support deleting the complete product-family rule with confirmation
- return to Rules after successful deletion

### 10.5 Settings

Reuse `src/pages/settings/`.

Plugin-wide React setting:

- remove plugin data on uninstall toggle

Shipping calculation method, default product cost, handling fees, and Free Shipping/Local Pickup suppression belong to each WooCommerce shipping-zone method instance. WooCommerce must render the native `WC_Shipping_Method` form fields in its create/edit modal; do not duplicate them in the React Settings page.

Do not include licensing, carrier credentials, remote notices, analytics logging, or marketing preferences.

### 10.6 WooCommerce product and variation edit screens

Per-product and per-variation shipping configuration belongs exclusively to the React Rules dashboard. The native WooCommerce product editor must not render or save this plugin's shipping fields.

Requirements:

- do not register `woocommerce_product_options_shipping_product_data` fields
- do not register `woocommerce_process_product_meta` save handling
- do not register `woocommerce_product_after_variable_attributes` fields
- do not register `woocommerce_save_product_variation` save handling
- preserve permanent-delete cleanup so deleting a WooCommerce product removes its family record and deleting a variation removes only that variation record
- direct merchants to Rules add/edit for Adjust Shipping Costs, fallback/legacy modes, fallback costs, destination rows, and variation inheritance/override settings

---

## 11. Admin REST API

Namespace: `syzepps/v1`

Admin-only routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/products` | Search eligible simple products and variable-product parents by name, SKU, or ID; exclude independent variation selection. |
| `GET` | `/products/{product_id}` | Load product type plus parent/simple metadata and all child variations needed to build the editor. |
| `GET` | `/rules` | Paginated/searchable simple/parent product-family list. |
| `POST` | `/rules` | Create one product family, including parent settings and child variation states. |
| `GET` | `/rules/{product_id}` | Get one simple/parent product family with all variation states. |
| `PUT` | `/rules/{product_id}` | Atomically update one product family and its variation states. |
| `DELETE` | `/rules/{product_id}` | Delete the complete product-family record. |
| `POST` | `/rules/bulk` | Bulk line/item-cost update. |
| `GET` | `/settings` | Read plugin settings. |
| `POST` | `/settings` | Update plugin settings. |
| `POST` | `/rules/import/dry-run` | Parse and validate CSV without writes. |
| `POST` | `/rules/import/commit` | Commit a previously validated import. |
| `GET` | `/rules/export` | Export selected/all records. |

Requirements:

- capability `manage_woocommerce`
- `permission_callback` on every route
- nonce-authenticated admin requests
- explicit request schemas
- scalar sanitization and domain validation
- `WP_Error`/`WP_REST_Response` errors with useful messages
- no public management API
- no license, analytics, carrier-secret, plugin-install, or remote-marketing routes

---

## 12. Import/export

CSV columns:

```csv
product_identifier,product_id,sku,variation_id,enable_per_variation_shipping,adjust_shipping_costs,country,state,city,postcode,line_cost,item_cost,calculation_mode,fallback_cost
```

Import flow:

1. Upload CSV from Rules.
2. Enforce file-size limit.
3. Parse as hostile input.
4. Validate headers and rows.
5. Display dry-run counts and row errors.
6. Require explicit confirmation.
7. Apply valid import atomically at the option-record level.
8. Display committed/skipped/failed report.

`adjust_shipping_costs` is product-family data and must agree across rows for the same product. `enable_per_variation_shipping` controls whether variation rows are active overrides; disabled variations inherit the parent and ignore imported child rates until enabled.

Modes:

- update
- skip existing
- replace target record

Export must escape CSV correctly and contain no customer/order data.

---

## 13. Security and privacy

Every admin mutation requires:

- `manage_woocommerce`
- nonce validation
- sanitization
- domain validation
- escaped output

Additional requirements:

- Do not trust uploaded MIME type or extension alone.
- Prevent spreadsheet formula injection in exported cells.
- Do not persist full customer destination addresses.
- Make no remote requests by default.
- Remove copied deactivation feedback, plugin installation, promotion, account, and license requests.
- Never delete or mutate WowShipping data during activation, upgrade, or uninstall.

---

## 14. Compatibility and performance

### 14.1 Runtime compatibility

- PHP 7.4+; do not use PHP 8-only syntax.
- WordPress 6.0+.
- WooCommerce 7.0+.
- Test latest stable WordPress and WooCommerce before release.
- Use WooCommerce CRUD APIs for order data.
- Declare HPOS compatibility only after audit.
- Calculate rates only through WooCommerce shipping APIs.
- Do not depend on classic-checkout-only hooks.

### 14.2 Performance discipline

- Load `syzepps-product-rates` once per package calculation.
- Do not query products or terms repeatedly per line.
- Build package context once.
- Use request-local caches only when measurement supports them.
- Do not add custom tables.
- Keep rule matching deterministic and linear over relevant rows.

Internal targets:

| Scenario | Target |
| --- | ---: |
| 5 cart lines, 20 relevant rows | under 20 ms plugin calculation time |
| 20 cart lines, 200 relevant rows | under 75 ms plugin calculation time |
| 100 cart lines | no N+1 product/term query pattern |

These are engineering targets, not public claims without measurements.

---

## 15. Verification strategy

The original copied baseline had no automated test suite. The current plugin has narrow PHP test/smoke scripts but no frontend component or browser suite. Verification grows with the feature; admin UI proof therefore requires the source/build checks and real-browser scenarios below.

### 15.1 Bootstrap/config checks

- PHP syntax check for changed PHP files.
- `npm run build:webpack`.
- `npm run build:gulp`.
- Activate with WooCommerce active.
- Activate with WooCommerce inactive and observe graceful notice/no fatal.
- Load the admin page and inspect browser console/network.
- Activate beside WowShipping and confirm no duplicate class/function/global/asset conflict.

### 15.2 Pure logic tests

Add tests when calculator logic is introduced:

- postcode exact/wildcard/range/list
- malformed postcode range
- product per-item/per-line/per-order/per-step modes
- variation override and inheritance
- enabled variation with no destination match uses its variation fallback and never the parent
- Adjust Shipping Costs routes configured costs to other methods only
- adjustment excludes Free Shipping and every `syzepps_wc_method` instance
- mixed adjusted/unadjusted product package avoids double charging
- ordered first-match destination behavior
- zero fallback cost remains configured
- destination line cost applies once regardless of quantity
- destination item cost multiplies by quantity
- destination rows add line and item cost when both are configured
- zero line/item destination row remains configured
- aggregation across multiple matching products
- sum/highest/lowest aggregation, including zero and ties
- default product cost only for products without configured rates
- fixed and percentage per-product handling
- fixed and percentage per-order handling
- fee ordering with highest/lowest aggregation
- Free Shipping and Local Pickup suppression guards

### 15.3 Integration checks

- shipping method appears in zone selector
- creating and editing a shipping-zone method instance opens WooCommerce's native settings modal, and instance settings save
- WooCommerce product and variation edit screens contain no Syzenlabs shipping fields or save handlers
- REST permission checks
- calculation method, default cost, both handling-fee types/amounts, and both suppression checkboxes save per instance
- package-rate filtering removes only the enabled Free Shipping/Local Pickup methods when the Per Product rate is available
- product-first Rules flow hides rates until selection and renders variable-product accordions
- one Rules list/edit record owns the parent/simple product and every variation state
- Adjust Shipping Costs saves for simple products and variable-product parents only
- Rules add/edit/delete affects checkout
- import dry run does not write
- committed import affects checkout

### 15.4 E2E smoke checks

- simple product rule visible at checkout
- variation rule override visible at checkout
- enabled variation override with no matching row never falls back to parent
- simple-product Adjust Shipping Costs surcharge on Flat Rate but not Free Shipping or `syzepps_wc_method`
- mixed adjusted/unadjusted products produce exact standalone and other-method totals without double charging
- destination-specific rule
- classic cart/checkout
- block cart/checkout
- mixed-product package under sum, highest, and lowest
- unrated product using instance default cost
- fixed and percentage handling fee totals
- enabled and disabled Free Shipping/Local Pickup suppression
- HPOS enabled and disabled

### 15.5 Admin UI architecture and parity checks

- Inspect the active import graph: every screen uses the adapted shared foundation and `@wordpress/components`; Rules uses `@wordpress/dataviews/wp`.
- Confirm no active screen uses browser `alert()`, `confirm()`, or `prompt()`, or raw controls/tables as substitutes for available WordPress/WowShipping components.
- Build through `wp-scripts` and confirm generated asset metadata declares the WordPress package dependencies used by the source.
- Open WowShipping and Syzenlabs side by side at 320, 768, 1024, and 1440 CSS pixels. Compare header, page container, typography, cards, controls, spacing, loading, empty, error, modal/sidebar, toast, and table/DataViews behavior.
- Exercise Rules search, filters, selection, bulk actions, add, edit, delete confirmation, destination-row reordering, import dry run, import confirmation, export, loading, empty, and error states in a real browser.
- Navigate every action by keyboard; verify visible focus, Modal/Prompt/Sidebar focus management, screen-reader labels, heading order, and non-color-only status.
- Activate WowShipping beside Syzenlabs and confirm neither plugin's component styles, CSS variables, portals, header, or generated assets change the other plugin.
- Confirm the active Syzenlabs source and browser network log contain no runtime path into the sibling WowShipping plugin.

Visual verification must use the running WordPress admin. A source import or successful build alone does not prove parity.

No phase is complete because a file compiles; its user-visible path must work.

---

## 16. Implementation phases

### Phase 0 — Identity, bootstrap, and build safety

**Goal:** turn copied files into a non-conflicting, buildable plugin shell.

#### Ticket 0.1 — Repair and rebrand bootstrap

Files:

- `syzenlabs-per-product-shipping-for-woocommerce.php`
- `includes/class-init.php`
- `traits/trait-singleton.php` only if namespace change requires it

Tasks:

1. Replace plugin header, namespace, constants, functions, and package annotations.
2. Register `syzepps_autoloader()` before `Init` construction.
3. Remove missing prefixed Composer autoload requirement.
4. Reduce `Init` to WooCommerce guard plus explicitly active services.
5. Declare no compatibility flags until audited.

Acceptance:

- plugin activates without class-not-found fatal
- WooCommerce absence causes no fatal
- WowShipping can remain active simultaneously

#### Ticket 0.2 — Rebrand build outputs

Files:

- `package.json`
- `package-lock.json`
- `webpack.config.js`
- `gulpfile.mjs`
- `.eslintrc`
- `.gitignore`

Tasks:

1. Change package and output identities to `syzepps`/new slug.
2. Remove Composer-dependent active scripts.
3. Change CSS/JS generated filenames and ignore rules.
4. Make normal build/package commands local-only and safe.
5. Disable old CI force-push flow until new release destination exists.

Acceptance:

- webpack produces `assets/js/syzepps-backend.js` and asset metadata
- Gulp produces new-prefixed CSS
- no normal build command invokes missing Composer configuration
- no command used for local validation can push to old repository

#### Ticket 0.3 — Rebrand admin mount contract

Files:

- `includes/class-init.php`
- `includes/utils/class-options.php`
- `src/index.js`
- `.eslintrc`

Tasks:

1. Use new admin slug, DOM ID, handles, nonce, text domain, and `syzeppsAdmin` global.
2. Localize only current local settings/currency/zone data.
3. Enqueue only on the new plugin screen and relevant method settings screen.
4. Keep the mount ready for the adapted provider, navigation, Prompt, and Toast composition; do not establish a second custom shell.

Acceptance:

- the React mount loads on the plugin page
- no `wtrsAdmin` dependency exists in active imports
- browser console has no missing asset/global errors
- the mount and localized contract do not force raw markup or a parallel UI architecture

### Phase 1 — Remove licensing and detach old subsystems

**Goal:** eliminate license code and ensure old products do not execute.

#### Ticket 1.1 — Remove PHP license and promotion runtime

Files include:

- `includes/class-init.php`
- `includes/class-xpo.php`
- `includes/utils/class-plugin-actions.php`
- `includes/utils/class-flags.php`
- `includes/utils/class-notice.php`
- `uninstall.php`

Tasks:

1. Remove all EDD license reads, expiry checks, renew links, and paid-tier gates.
2. Delete `class-xpo.php` after removing references.
3. Remove remote promotion/plugin-install/deactivation behavior from active services.
4. Make uninstall target only new `syzepps` data.

Acceptance:

- executable PHP contains no EDD/WTRS license access
- new plugin makes no license/marketing request
- uninstall cannot delete WowShipping data

#### Ticket 1.2 — Remove React license runtime

Files include:

- `src/index.js`
- `src/pages/license/`
- `src/utils/index.js`
- `src/utils/constants.js`
- license-dependent header/notice/Pro components

Tasks:

1. Delete license page tree.
2. Remove route, menu item, helper functions, renew/expiry UI, and localized-field reads.
3. Remove old product/analytics routes from active navigation.
4. Leave unrelated unused files dormant if removal is not yet safe.

Acceptance:

- no License route/menu/UI
- no license helper import in active React graph
- rebuilt bundle contains no license activation/renewal behavior

#### Ticket 1.3 — Disconnect table-rate and carrier boot paths

Files:

- `includes/class-init.php`
- `includes/rest/class-rest.php`
- `includes/utils/class-hooks.php`
- `src/index.js`

Tasks:

1. Stop instantiating carrier, old analytics, old condition, old global method, and old import services.
2. Stop registering their REST routes and hooks.
3. Stop importing their React pages/providers from active entry.

Acceptance:

- old subsystems register no hooks/routes/methods
- dormant files cause no class-load errors

#### Ticket 1.4 — Restore the self-contained WowShipping UI foundation

Files include:

- `package.json` and `package-lock.json`
- `src/index.js`
- required paths under `src/components/layout/`, `src/components/ui/`, `src/context/`, `src/utils/`, and `src/scss/`

Tasks:

1. Copy the required component dependency closure from the active WowShipping source into this plugin.
2. Strip Pro, license, AI, promotion, carrier, analytics, tutorial, remote-account, and WPXPO dependencies before connecting the restored components to the active entry.
3. Rename `wtrs` component identities, CSS selectors, variables, text domains, assets, and product copy to `syzepps`.
4. Scope ported tokens, WordPress overrides, DataViews overrides, component styles, and page styles so the two plugins can coexist.
5. Restore required packages such as `@wordpress/dataviews`, `@wordpress/icons`, and `@wordpress/api-fetch`; build through `@wordpress/scripts`.
6. Replace the bespoke Syzenlabs header/router shell with the adapted Header, providers, navigation context, Prompt, Toast, and page container.
7. Delete superseded custom shell markup and styles after the adapted shell works.

Acceptance:

- Syzenlabs renders the adapted WowShipping header, page container, navigation, Prompt, Toast, and loading foundation using WordPress components
- source is fully local to this plugin and has no runtime import or asset path into the sibling WowShipping directory
- active imports contain no excluded commercial or unrelated product subsystem
- generated asset metadata contains the required WordPress package dependencies
- scoped styles do not change WowShipping when both plugins are active
- no second header, navigation system, toast system, prompt system, or design-token system remains active

### Phase 2 — Basic WooCommerce shipping method

**Goal:** add one native zone method with complete instance-level calculation controls.

#### Ticket 2.1 — Register method and settings

Tasks:

1. Rename/rewrite `includes/class-wow-shipping-method.php` for `SYZEPPS`.
2. Rewrite shipping registration in `includes/utils/class-hooks.php`.
3. Add native fields for title, tax status, calculation method, default product cost, per-product handling fee type/amount, per-order handling fee type/amount, Ignore Free Shipping, and Ignore Local Pickup.
4. Sanitize enums, checkboxes, empty default cost, and non-negative decimal amounts at the instance boundary.
5. Honor WooCommerce's native shipping-zone enable/disable control.
6. Support WooCommerce method instances without sharing settings between instances.

Acceptance:

- method appears in shipping-zone method selector
- every instance field saves and reloads without warnings
- separate zone instances retain separate setting values
- zone enable/disable control governs availability
- custom title appears at checkout

#### Ticket 2.2 — Hide when no product rule matches

Tasks:

1. Implement `calculate_shipping()` using product/variation records only.
2. Add no rate when no package line produces a matching component.
3. Preserve a matched destination row with zero line/item costs as an available free-shipping rate.

Acceptance:

- unmatched packages add no rate
- matched product rules add the exact calculated rate
- matched zero-valued line/item rules add a zero-cost rate

### Phase 3 — First product-rule vertical slice

**Goal:** create, edit, persist, and calculate one simple product rule.

#### Ticket 3.1 — Rewrite option repository

Tasks:

1. Repurpose `includes/class-db.php` for `syzepps-product-rates` and `syzepps-settings`.
2. Add versioned defaults and full-record sanitization.
3. Add product-family lookup and product/variation delete cleanup.

Acceptance:

- valid product record round-trips
- malformed option data returns safe defaults
- unrelated target data is preserved on update

#### Ticket 3.2 — Rewrite minimal rules REST

Tasks:

1. Replace old route registration in `includes/rest/class-rest.php`.
2. Add aggregate product-family list/create/read/update/delete routes plus explicit searchable product-target and product-family metadata routes.
3. Add capability, nonce, schema, sanitization, and errors.

Acceptance:

- administrator/shop manager with capability can manage rules
- customer/guest cannot
- invalid target, line cost, item cost, or fallback cost is rejected

#### Ticket 3.3 — Rebuild rule pages on the restored UI foundation

Tasks:

1. Rename/retain the three required page directories and update navigation constants, links, and hash parsing.
2. Build Rules from the adapted WowShipping Card/header/list composition and `DataViews`; do not retain the custom `widefat` table.
3. Build Rule add/edit in the adapted PopupLayout with shared fixed-header actions, Prompt, Toast, Skeleton, and one shared product-family form.
4. Use the adapted searchable Select and WordPress controls for product selection, destination Line cost and Item cost, fallback cost, adjustment, variation override, destination fields, and actions.
5. Make add product-first: search/select a simple or parent product before showing any rate fields.
6. Render simple-product fields directly; render a variable product as one parent accordion plus one accordion per variation.
7. Add parent/simple Adjust Shipping Costs and per-variation Enable Per Variation Shipping controls.
8. Hide variation rate/fallback inputs while inheriting; reveal them as a complete override when enabled.
9. Keep calculation mode out of the Rules builder while preserving stored record values.
10. Render the destination grid as a shared component; use WordPress Buttons, Icons, controls, Tooltip, Prompt, and accessible drag handles. Show no priority column or sorting buttons, and outline the hovered drop row.
11. Wire list/add/edit/delete to real aggregate product-family REST responses with adapted Toast, Notice, Prompt, Skeleton, empty, and error states; no placeholder data or browser dialogs.
12. Remove the superseded raw toolbar, raw form controls, duplicated add/edit markup, browser prompts, custom notices, and bespoke page styles.

Acceptance:

- Rules uses `DataViews` and the adapted WowShipping Card/header/filter/action composition
- Rule add/edit use PopupLayout and one shared WordPress-components-based family form
- no active Rules, Rule add, or Rule edit path uses browser dialogs or raw controls as substitutes for available components
- Rules list shows one row per simple/parent product family and no independent variation rows
- Rule add searches and selects a product before revealing fields
- simple products show a rate table with separate Line cost and Item cost columns, fallback cost, and Adjust Shipping Costs directly
- variable products show parent and variation accordions
- every variation follows parent rates until Enable Per Variation Shipping is checked
- enabled variations show their own rate table/fallback and never fall back to parent
- Rule add saves the complete product family atomically
- Rule edit changes the family without overwriting stored calculation modes
- destination rates render as drag-sortable rows without priority or sorting-button controls
- the hovered destination row gains an outline while dragging
- reordered rows persist, and checkout evaluates the top matching rate first
- delete uses the adapted Prompt and removes the complete product-family record
- loading, empty, validation, REST error, success, and unsaved-change states use the adapted shared feedback components
- direct hash navigation works

#### Ticket 3.4 — Apply one product destination rate at checkout

Tasks:

1. Build minimal package line context.
2. Load matching product record.
3. Calculate the matching destination row as line cost plus item cost multiplied by quantity.
4. Pass result through shipping method `add_rate()`.

Acceptance:

- rule saved in admin changes checkout rate
- unrelated product does not match
- unmatched packages hide the method

### Phase 4 — Product-family rules and data lifecycle

**Goal:** complete variation inheritance/override behavior in the Rules dashboard and keep stored records synchronized with WooCommerce deletions.

Tasks:

1. Implement disabled variation parent inheritance and enabled variation complete override in Rules add/edit.
2. Apply the parent/simple Adjust Shipping Costs value to every child variation.
3. Preserve stored fallback/legacy calculation modes without exposing them as editable product-screen fields.
4. Add product-family and individual variation delete cleanup.
5. Confirm no Syzenlabs product or variation fields/save handlers are registered in the native WooCommerce product editor.

Acceptance:

- Rules add/edit is the sole product-family shipping configuration surface
- disabled variation uses the parent record
- enabled variation override wins and never falls back to the parent
- simple and variable-parent Adjust Shipping Costs values round-trip through Rules
- deleting a product removes its complete family record
- deleting one variation removes only that variation record
- WooCommerce product and variation edit screens show no Syzenlabs shipping settings

### Phase 5 — Destination matcher, aggregation, fees, and suppression

**Goal:** complete deterministic package calculation and instance-level method behavior.

Tasks:

1. Add package context builder.
2. Add postcode matcher.
3. Add country/state/city/postcode matching.
4. Use stored destination-row order; the first match wins.
5. Add separate destination line and item costs, calculated as `line_cost + ( item_cost × quantity )`.
6. Retain per-order, per-item, per-line, and per-step modes for fallback and compatible legacy single-cost rules.
7. Add instance default product cost for products with no configured rate.
8. Add sum, highest, and lowest base-component aggregation.
9. Add fixed/percentage per-product handling, then fixed/percentage per-order handling in the documented order.
10. Add product-level Adjust Shipping Costs routing and guarded package-rate adjustment.
11. Add guarded Free Shipping and Local Pickup package-rate suppression.
12. Treat configured zero line, item, and fallback costs as available shipping.
13. Add pure logic tests.

Acceptance:

- exact, wildcard, range, and list postcode tests pass
- destination line cost applies once, item cost multiplies by quantity, and both add together on a matching row
- each fallback/legacy cost mode has observable checkout proof
- sum, highest, and lowest produce exact totals for mixed-product packages
- unrated products inherit instance default cost without overriding configured zero-cost rates
- fixed and percentage handling fees use the documented bases and order
- suppression removes only enabled Free Shipping/Local Pickup rates and only while this instance is available
- adjusted configured costs modify other rates except Free Shipping and every `syzepps_wc_method` rate
- adjusted products never contribute to the standalone method, preventing double charging
- enabled variation overrides never fall back to parent after a no-match result
- first matching destination row wins
- malformed settings and rules fail safely
- zero-valued line/item destination rows and zero fallback costs remain available

### Phase 6 — Bulk management and CSV

**Goal:** finish high-volume merchant workflows inside the restored Rules experience.

Tasks:

1. Add real pagination/search/filtering through the existing `DataViews` state contract and WordPress controls.
2. Add bulk line/item cost update through DataViews selection, WordPress Buttons/controls, adapted Prompt confirmation, and Toast feedback.
3. Adapt the restored FileUploader and import Sidebar/Modal composition.
4. Add CSV dry run, commit, and report using WordPress components for progress, errors, and actions.
5. Add selected/all export using the same action and feedback patterns.
6. Remove any temporary raw file input, browser prompt, parallel table selection, or custom import panel.

Acceptance:

- bulk line/item cost updates affect checkout
- Rules remains a single `DataViews` collection for filtering, selection, pagination, and actions
- dry run makes no write
- invalid rows report exact failures in the adapted import composition
- import confirmation and completion use Prompt/Toast rather than browser dialogs
- import cannot partially corrupt option data
- export round-trips supported fields

### Phase 7 — Compatibility and hardening

**Goal:** prove production behavior before deleting dormant code.

Tasks:

1. Complete security review.
2. Complete PHP 7.4 syntax and standards checks.
3. Test classic and block cart/checkout.
4. Audit and test HPOS; then declare compatibility.
5. Measure representative calculator scenarios.
6. Run both plugins together for collision testing.

Acceptance:

- no known fatal or security issue
- classic and block checkout show correct rate
- HPOS declaration matches observed behavior
- no runtime identity collision with WowShipping

### Phase 8 — Final cleanup and release

**Goal:** remove copied baggage only after new plugin works.

Tasks:

1. Delete unreachable carrier, table-rate, analytics, promotion, and old compatibility PHP.
2. Delete dormant React carrier, analytics, plugin-promotion, Pro, support-marketing, and superseded old rule-builder files; retain the adapted shared UI dependency closure used by active Syzenlabs screens.
3. Delete unused WowShipping images and translations; keep only locally owned, rebranded assets required by the adapted shell.
4. Remove genuinely unused dependencies from `package.json`; regenerate the lockfile without removing packages used by the restored WordPress/DataViews component system.
5. Remove dormant Composer/scoper/release files if still unnecessary.
6. Rebuild all generated assets.
7. Regenerate POT and release readme.
8. Replace release automation with new repository/WordPress.org configuration or keep it disabled.
9. Build and inspect release ZIP contents.

Acceptance:

- release ZIP contains only required plugin files
- no old product identity or license subsystem remains
- no dormant source is accidentally shipped
- version matches plugin header, package, readme, and artifact
- install/activate/checkout smoke passes from release ZIP
- adapted WordPress/WowShipping-derived components, contexts, tokens, and styles required by active screens remain shipped and functional

---

## 17. Configuration cutover checklist

Before feature implementation moves beyond Phase 0:

- [ ] Root plugin header uses new product identity.
- [ ] `SYZEPPS` namespace and constants load.
- [ ] Autoloader is registered.
- [ ] No missing Composer autoloader is required.
- [ ] Package name and lockfile identify new plugin.
- [ ] Webpack/Gulp produce new asset names.
- [ ] Enqueue code expects those exact asset names.
- [ ] ESLint declares `syzeppsAdmin`, not `wtrsAdmin`.
- [ ] Admin slug, DOM ID, nonce, handles, method ID, and REST namespace use `syzepps`.
- [ ] Old release push flow is disabled.
- [ ] New uninstall code targets only new plugin data.

Before feature implementation moves beyond Phase 1:

- [ ] Required WowShipping layouts, UI components, contexts, tokens, and WordPress/DataViews overrides are restored locally.
- [ ] `package.json` includes every package imported by the adapted source, and generated asset metadata lists its WordPress dependencies.
- [ ] The active shell uses the adapted Header, navigation provider, Prompt, Toast, page container, and loading components.
- [ ] No active module imports runtime code or assets from the sibling WowShipping plugin.
- [ ] No Pro, license, AI, carrier, analytics, tutorial, promotion, remote-account, or WPXPO dependency entered the active graph.
- [ ] Ported CSS uses `syzepps` identities and is scoped so WowShipping remains unchanged.
- [ ] The bespoke Syzenlabs header/router design and duplicate component systems are removed.

Before release:

- [ ] Version updater targets new main file and `SYZEPPS_VER`.
- [ ] POT generation targets new text domain and slug.
- [ ] Translation script uses new POT/environment names or is removed.
- [ ] Package folder and ZIP use new slug.
- [ ] Readme/changelog contain only new product claims.
- [ ] Generated asset and language filenames use new identity.
- [ ] Release destination and credentials are new and verified.

---

## 18. Definition of done for v1

1. Installs and activates on a clean WordPress/WooCommerce site.
2. Fails gracefully when WooCommerce is inactive.
3. Can run beside WowShipping without collisions.
4. Contains no license activation, renewal, expiry, or feature-gating subsystem.
5. Per-product rates work for simple products.
6. Per-variation rates work with override and inheritance.
7. Country/state/city/postcode rules work.
8. Exact/wildcard/range/list postcodes work.
9. Destination line cost applies once, item cost multiplies by quantity, and both add together; all four fallback/legacy cost modes work.
10. Sortable destination-table order determines priority; the top matching rate wins.
11. Zero-valued destination line/item rules provide free shipping.
12. Unmatched packages hide the method.
13. `rules`, `rule-add`, and `rule-edit` routes work.
14. Bulk line/item cost action works.
15. CSV dry-run/import/export works with the simplified schema.
16. Classic checkout works.
17. Block checkout works.
18. HPOS compatibility is audited, tested, and declared accurately.
19. Security and capability checks pass review.
20. User-facing strings use the new text domain.
21. Generated assets use the new identity.
22. Old WowShipping product identity, marketing, licensing, carrier, and analytics behavior is absent from shipped runtime.
23. Release ZIP contains no accidental source/build/vendor baggage.
24. Release ZIP passes fresh install and checkout smoke tests.
25. Sum, highest, and lowest instance calculation methods produce exact package totals.
26. Instance default product cost applies only to products without configured rates.
27. Fixed and percentage per-product handling fees apply to every shippable product unit using the documented bases.
28. Fixed and percentage per-order handling fees apply once using the documented bases.
29. Ignore Free Shipping suppresses only `free_shipping` rates for packages where this method is available.
30. Ignore Local Pickup suppresses only `local_pickup` rates for packages where this method is available.
31. Rules list and edit ownership is one simple/parent product family, with no independent top-level variation records.
32. Rule add requires searchable product selection before showing rates.
33. Variable products render one parent accordion and one accordion per variation.
34. Enable Per Variation Shipping switches from parent inheritance to a complete variation override.
35. Adjust Shipping Costs works for simple products and variable-product parents and never changes Free Shipping or any `syzepps_wc_method` rate.
36. Mixed adjusted and unadjusted products do not double charge.
37. Every active React screen uses `@wordpress/components` as its primitive component system.
38. Rules uses `DataViews` from `@wordpress/dataviews/wp`, not a hand-built `widefat` table.
39. Rule add/edit use the adapted PopupLayout and one shared product-family form.
40. Header/navigation, Prompt, Toast, Skeleton, Select, FileUploader, badges, and relevant shared compositions are locally adapted from WowShipping rather than independently replaced.
41. Active product UI contains no browser dialogs or raw controls used as substitutes for available WordPress/WowShipping components.
42. Syzenlabs has close WowShipping visual and structural parity across the four documented viewport widths and all loading, empty, error, confirmation, and success states.
43. Both plugins can run together without runtime component dependencies, CSS-variable collisions, style leakage, or generated-asset conflicts.
44. Keyboard navigation, focus handling, labels, heading order, and non-color-only status meet the accessibility checks in section 15.5.

---

## 19. Agent operating rules

1. Read this plan and the actual target files before editing.
2. Treat the current directory as an existing copied application, not an empty scaffold.
3. Modify or rename existing files before adding files.
4. Follow the exact React page mapping in section 1.4.
5. Keep other useful React paths stable.
6. Delete license code; do not hide it behind a flag.
7. Disconnect old hooks/imports before treating old files as dormant.
8. Do not hand-edit generated assets.
9. Do not run the inherited `release`, `release:ci`, or `package-ci` flows until Phase 0 makes them safe.
10. Do not restore carrier Composer dependencies.
11. Keep PHP 7.4 compatibility.
12. Use WordPress/WooCommerce sanitization, escaping, nonce, capability, CRUD, and `WP_Error` patterns.
13. Keep shipping method class thin.
14. Use one repository for Rules UI, import/export, checkout, and WooCommerce product/variation deletion cleanup; do not add product-editor fields or save handlers.
15. Do not create a second condition engine, UI component library, navigation system, or build pipeline.
16. Leave unrelated dormant files alone until the new path works.
17. After behavior works, perform the final stale-code and release cleanup in Phase 8.
18. Verify each phase through its real user path before continuing.
19. Treat the active WowShipping source path in section 1.6 as the authoritative UI reference.
20. Copy required UI source into this plugin and adapt it locally; never create a runtime dependency on the sibling plugin.
21. Use WordPress Components and the existing WowShipping compositions before writing raw controls or a new custom primitive.
22. Use `DataViews` for Rules and the adapted PopupLayout for Rule add/edit.
23. Do not use browser dialogs for product UI.
24. Do not keep a fallback or parallel custom UI after its adapted replacement works.
25. Preserve close WowShipping density, spacing, typography, control, card, navigation, responsive, and feedback patterns while removing excluded product-specific behavior.
26. Scope all restored styles and test both plugins together before accepting a UI ticket.
27. Verify UI tickets in the running WordPress admin at the four viewport widths in section 15.5; build success alone is insufficient.

---

## 20. Final priority order

1. Repair bootstrap and runtime identity.
2. Make build/package commands safe and new-prefixed.
3. Remove licensing and detach old runtime systems.
4. Restore the self-contained WowShipping UI foundation and remove the parallel custom shell.
5. Register the basic WooCommerce shipping method.
6. Deliver one real product rule from the adapted admin UI to checkout.
7. Finish the product-first Rules, Rule add, and Rule edit flows on DataViews, PopupLayout, WordPress controls, and shared feedback components.
8. Complete variation inheritance/overrides in Rules and product/variation deletion cleanup without WooCommerce product-editor settings.
9. Add destination matching, separate line/item destination costs, fallback/legacy cost modes, Adjust Shipping Costs, instance aggregation, default cost, handling fees, and guarded method suppression.
10. Add bulk line/item cost management and CSV inside the adapted Rules experience.
11. Prove visual parity, accessibility, Blocks, HPOS, security, performance, and coexistence.
12. Delete dormant copied baggage and superseded custom UI without removing the active shared component foundation.
13. Build and smoke-test the release ZIP.

Small, working vertical slices take priority over a broad scaffold. The authorized WowShipping component system is the required admin foundation; old runtime behavior and the superseded custom Syzenlabs shell are not.