# Syzenlabs Per Product Shipping for WooCommerce

A self-contained WooCommerce extension for product-family, variation, and destination shipping costs.

## Development

```sh
npm install
npm run dev
npm run lint
npm run build
```

`npm run build` compiles the scoped admin CSS, builds the React application with `@wordpress/scripts`, and creates `build/syzenlabs-per-product-shipping-for-woocommerce.zip`. Publishing commands remain disabled until a Syzenlabs release destination is configured.

Runtime source lives in `includes/`, `src/`, and the root plugin file. Files in `assets/`, `languages/`, and `build/` are generated.

## TODO
- [] Settings link at Product Edit shipping and Shipping settings