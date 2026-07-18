=== Syzenlabs Per Product Shipping for WooCommerce ===
Contributors: syzenlabs
Tags: woocommerce, shipping, per product shipping, variation shipping
Requires at least: 6.0
Tested up to: 7.0
Requires PHP: 7.4
WC requires at least: 7.0
WC tested up to: 10.0
Stable tag: 1.0.0
License: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Configure standalone or adjusted WooCommerce shipping costs by product family, variation, and destination.

== Description ==

Syzenlabs Per Product Shipping adds a WooCommerce shipping-zone method backed by product-family rules.

Features:

* Rules for simple products and variable-product parents.
* Complete per-variation overrides or explicit parent inheritance.
* Ordered country, state, city, and postcode destination rows.
* Exact, wildcard, numeric-range, and comma-list postcode matching.
* Sum, highest, or lowest package aggregation.
* Default product cost and fixed or percentage handling fees per product and per order.
* Optional product costs added to eligible existing shipping methods.
* Optional Free Shipping and Local Pickup suppression when this method is available.
* Bulk fixed-cost updates and CSV dry-run, import, and export.

== Installation ==

1. Install and activate WooCommerce.
2. Upload and activate this plugin.
3. Add “Per Product Shipping” to a WooCommerce shipping zone and configure its instance settings.
4. Open WooCommerce > Per Product Shipping and create product-family rules.

== Pricing ==

This plugin is 100% free forever. There is no paid or premium tier — no purchases, subscriptions, or feature locks.

== Development ==

The plugin is open source and contributions are welcome. Please submit pull requests or open issues on the [GitHub repository](https://github.com/SyzenLabs/syzenlabs-per-product-shipping-for-woocommerce).

== Frequently Asked Questions ==

= Does a variation fall back to its parent? =

A variation follows its parent while Enable Per Variation Shipping is off. When enabled, the variation is a complete override and does not fall back to its parent.

= Which destination row wins? =

The first matching row in stored order. If no row matches, the selected record's fallback applies when configured.

= Can configured costs adjust another shipping method? =

Yes. Adjust Shipping Costs adds resolved configured product costs to eligible non-free methods. It never changes Free Shipping or any Per Product Shipping rate.

== Changelog ==

= 1.0.0 - 18 Jul 2026 =
* Initial release.