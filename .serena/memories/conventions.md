# Conventions

- PHP 7.4-compatible syntax only; no PHP 8-only constructs.
- Plugin classes use `WTRS\` namespace. PHP file names: `class-{kebab-case}.php`; traits: `trait-{kebab-case}.php`.
- Use `traits/trait-singleton.php` for long-lived singleton services; do not invent another lifecycle pattern.
- Backend code should use WordPress sanitization, escaping, nonces, and `WP_Error` patterns.
- REST routes use namespace `wow-table-rate-shipping/v1`.
- Admin app consumes localized `wtrsAdmin`; preserve shape when changing enqueue/localization.
- Prefer minimal source edits in `src/`, `src/scss/`, `includes/`, `carriers/`, `traits/`; generated assets are build outputs.
- Shipping/carrier logic changes start in owning PHP class and DTO/packer path, not compiled assets.