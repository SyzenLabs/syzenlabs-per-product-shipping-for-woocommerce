# Task Completion

- No project-wide automated test suite configured in `package.json`.
- JS/admin source changes: run `npm run lint` for `src/` when practical; `npm run format` only for source formatting changes.
- Packaging/release/version changes: check `package.json`, `readme.txt`, `wow-table-rate-shipping.php`, and `scripts/ver-updater.js` together; release scripts require matching changelog entry.
- PHP carrier/shipping behavior changes: validate with the narrowest executable PHP syntax/check command available plus local WordPress/WooCommerce behavior when possible.
- Do not hand-edit generated assets; rebuild only when the deliverable explicitly requires packaged output.