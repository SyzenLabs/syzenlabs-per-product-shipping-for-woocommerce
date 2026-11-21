# Syzenlabs Per Product Shipping for WooCommerce

A self-contained WooCommerce extension for product, variation, and destination shipping costs.

The admin workspace follows the Syzenlabs Order Return plugin with a white brand header, horizontal tab navigation, full-width content, and locally bundled Inter typography. It uses React, React Router 7, locally owned shadcn UI components built on Radix, Tailwind CSS 3, Lucide icons, and Motion. It shares WordPress's React runtime. `@wordpress/scripts` and its webpack configuration compile the JavaScript and scoped CSS; Gulp creates the installable ZIP.

## Development

Use Node.js 20 or newer and npm 10 or newer. On this workstation Node is available through nvm.

```sh
npm ci --ignore-scripts
npm run dev
```

The watch command writes assets directly to `assets/js/`. Open **WooCommerce → Per Product Shipping** on the Local site to see changes. Development does not require a separate frontend server.

```sh
npm run lint
npm run test:unit
npm run test:admin
npm run build
```

`npm run build` compiles with `wp-scripts build` and creates `build/syzenlabs-per-product-shipping.zip`. Publishing commands remain disabled until a release destination is configured.

Browser tests load the real compiled assets and WordPress vendor/admin styles against an isolated REST fixture server. They do not activate plugins or read/write the merchant database. The fixture finds WordPress three directories above the plugin, or at `SYZEPPS_WP_ROOT`. Tests use installed Google Chrome when available; otherwise install Chromium with `npx playwright install chromium`. `SYZEPPS_CHROMIUM_PATH` can select an existing Chromium binary.

Run the PHP asset contract in the Local Site Shell with `npm run test:php`. This standalone test checks enqueue scoping, shared dependencies, translations, configuration, and both generated stylesheets without loading WordPress or connecting to a database.

## Interface structure

- `src/index.js`: React Router hash routes, providers, and error boundaries.
- `src/components/ui/`: locally owned shadcn/Radix primitives; configured in `components.json`.
- `src/components/layout/`: responsive brand header, horizontal navigation, and shipping help dialog.
- `src/pages/rules/`: searchable, paginated product rules, selection, CSV import/export.
- `src/pages/rule-edit/`: product selection, destination rates, priorities, fallback costs, and variation overrides.
- `src/pages/settings/`: uninstall retention and WooCommerce shipping-zone access.
- `src/hooks/`: cancellable remote data and unsaved-navigation protection.
- `src/styles/admin.css`: scoped design tokens, layout, responsive rules, and reduced-motion behavior.

Shipping Rules replaces the old Overview page. Existing `#overview`, `#rules`, `#rule-add`, `#rule-edit/ID`, and `#settings` links remain supported. CSV import stays within the rules workspace and always previews before a confirmed commit.

The bundled Inter font uses the SIL Open Font License, included in `assets/fonts/inter-LICENSE.txt`.

Tailwind utilities use the `tw-` prefix and are restricted to the plugin root. Preflight is disabled; Radix portals remain inside that root. The build emits LTR and RTL CSS. All translated screens stay in one entry so WordPress can load their catalog through `wp_set_script_translations`.

The interface follows [shadcn's manual installation model](https://ui.shadcn.com/docs/installation/manual), [React Router's hash routing](https://reactrouter.com/api/data-routers/createHashRouter), and the [WordPress scripts build configuration](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/).
