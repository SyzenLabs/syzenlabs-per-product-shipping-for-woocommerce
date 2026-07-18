# Suggested Commands

Run from plugin root.

- `npm run setup`: install npm deps and prefixed Composer deps.
- `npm run dev`: Gulp + webpack watch.
- `npm run start`: webpack watch only.
- `gulp watch`: SCSS/Tailwind watch only.
- `npm run lint`: ESLint with `--fix` for `src/`.
- `npm run format`: Prettier for `src/`.
- `npm run build`: production build, prefixed Composer install, package generation, opens build folder.
- `npm run release`: version update, build, i18n, package output.
- `npm run release:ci`: CI-friendly package build without opening build folder.
- No automated test suite in `package.json`; validate with narrow relevant command and local WordPress/WooCommerce behavior. Use tool-native `find`/`search`/`read` rather than shell `ls`/`grep`/`cat` in this harness.