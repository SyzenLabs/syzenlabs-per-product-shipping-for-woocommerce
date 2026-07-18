# Tech Stack

- Backend: PHP plugin under namespace `WTRS\`; PHP 7.4 compatibility required.
- Platform: WordPress + WooCommerce APIs; REST namespace `wow-table-rate-shipping/v1`.
- Frontend: React admin app in `src/`; localized runtime contract via global `wtrsAdmin`.
- Build: npm package scripts, webpack for JS, Gulp/Tailwind/SCSS for styles, Composer prefixing into `vendor_prefixed/`.
- Release/version files must align: `package.json`, plugin header and `WTRS_VER` in `wow-table-rate-shipping.php`, `readme.txt`; enforced by `scripts/ver-updater.js`.