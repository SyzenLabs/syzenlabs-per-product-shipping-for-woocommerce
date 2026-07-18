# Core

- WooCommerce shipping extension. Boot path: `wow-table-rate-shipping.php` defines constants/autoloads prefixed Composer deps then instantiates `WTRS\Includes\Init`; `includes/class-init.php` gates on WooCommerce active and wires REST/admin/global method.
- Source roots: PHP core in `includes/`; carrier live-rate system in `carriers/`; React admin source in `src/`; SCSS in `src/scss/`.
- Generated outputs: avoid hand-editing `assets/js/*`, `assets/css/*`, `build/*`, `vendor_prefixed/*` when source exists.
- Carrier code: inspect owner class before UI/generated assets. Key refs: `carriers/class-live-rate-manager.php`, `includes/class-wow-shipping-method.php`, `includes/rest/class-rest.php`.
- Related memories: tech stack `mem:tech_stack`; style/conventions `mem:conventions`; task finish checks `mem:task_completion`; commands `mem:suggested_commands`.