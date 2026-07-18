<?php
/**
 * Plugin Name: Syzenlabs Per Product Shipping for WooCommerce
 * Description: Configure shipping costs per product, variation, and destination.
 * Version:     1.0.0
 * Author:      SyzenLabs
 * Requires Plugins: woocommerce
 * Text Domain: syzenlabs-per-product-shipping-for-woocommerce
 * Domain Path: /languages
 * License:     GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

defined( 'ABSPATH' ) || exit;

define( 'SYZEQL_VER', '1.0.0' );
define( 'SYZEPPS_URL', plugin_dir_url( __FILE__ ) );
define( 'SYZEPPS_BASE', plugin_basename( __FILE__ ) );
define( 'SYZEPPS_PATH', plugin_dir_path( __FILE__ ) );
define( 'SYZEPPS_RULE_VER', 1 );

if ( ! function_exists( 'syzepps_autoloader' ) ) {
	/**
	 * Load plugin classes from their namespace.
	 *
	 * @param string $class_name Fully qualified class name.
	 * @return void
	 */
	function syzepps_autoloader( $class_name ) {
		$namespace = 'SYZEPPS\\';
		$length    = strlen( $namespace );

		if ( 0 !== strncmp( $namespace, $class_name, $length ) ) {
			return;
		}

		$segments  = explode( '\\', substr( $class_name, $length ) );
		$class     = array_pop( $segments );
		$directory = strtolower( implode( '/', $segments ) );
		$prefix    = false !== strpos( $directory, 'traits' ) ? 'trait-' : 'class-';
		$class     = strtolower( preg_replace( '/([a-z])([A-Z])/', '$1-$2', $class ) );
		$file      = SYZEPPS_PATH . ( $directory ? $directory . '/' : '' ) . $prefix . $class . '.php';

		if ( is_readable( $file ) ) {
			require_once $file;
		}
	}
}

spl_autoload_register( 'syzepps_autoloader' );

if ( ! function_exists( 'syzepps_init' ) ) {
	/**
	 * Start the plugin.
	 *
	 * @return void
	 */
	function syzepps_init() {
		new SYZEPPS\Includes\Init();
	}
}

syzepps_init();
