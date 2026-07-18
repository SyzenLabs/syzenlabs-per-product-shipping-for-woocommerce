<?php
/**
 * Minimal dependency-aware plugin boot.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

namespace SYZEPPS\Includes;

use SYZEPPS\Includes\Rest\Rest;
use SYZEPPS\Includes\Utils\Hooks;
use SYZEPPS\Includes\Utils\Options;

defined( 'ABSPATH' ) || exit;

/**
 * Boots plugin services after WooCommerce is available.
 */
class Init {
	/**
	 * Register plugin lifecycle hooks.
	 */
	public function __construct() {
		add_action( 'plugins_loaded', array( $this, 'load' ), 20 );
		add_action( 'before_woocommerce_init', array( $this, 'declare_hpos_compatibility' ) );
	}

	/**
	 * Register only active plugin services after dependencies load.
	 *
	 * @return void
	 */
	public function load() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', array( $this, 'woocommerce_notice' ) );
			return;
		}

		new Hooks();
		new Options();
		new Rest();
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_assets' ) );
	}

	/**
	 * Show one local dependency notice.
	 *
	 * @return void
	 */
	public function woocommerce_notice() {
		if ( current_user_can( 'activate_plugins' ) ) {
			echo '<div class="notice notice-error"><p>' . esc_html__( 'Syzenlabs Per Product Shipping requires WooCommerce.', 'syzenlabs-per-product-shipping-for-woocommerce' ) . '</p></div>';
		}
	}

	/**
	 * Declare HPOS compatibility after confirming no direct order storage access.
	 *
	 * @return void
	 */
	public function declare_hpos_compatibility() {
		if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', SYZEPPS_BASE, true );
		}
	}

	/**
	 * Enqueue self-contained admin assets only on this plugin page.
	 *
	 * @param string $hook Current admin hook.
	 * @return void
	 */
	public function admin_assets( $hook ) {
		if ( 'woocommerce_page_syzepps-dashboard' !== $hook ) {
			return;
		}

		$script = SYZEPPS_PATH . 'assets/js/syzepps-backend.js';
		$asset  = SYZEPPS_PATH . 'assets/js/syzepps-backend.asset.php';
		if ( ! is_readable( $script ) || ! is_readable( $asset ) ) {
			wp_die( esc_html__( 'Admin assets are missing. Run the plugin build first.', 'syzenlabs-per-product-shipping-for-woocommerce' ) );
		}
		$metadata = require $asset;
		wp_enqueue_script( 'syzepps-backend', SYZEPPS_URL . 'assets/js/syzepps-backend.js', isset( $metadata['dependencies'] ) ? $metadata['dependencies'] : array(), isset( $metadata['version'] ) ? $metadata['version'] : SYZEPPS_VER, true );
		wp_set_script_translations( 'syzepps-backend', 'syzenlabs-per-product-shipping-for-woocommerce', SYZEPPS_PATH . 'languages' );
		wp_localize_script(
			'syzepps-backend',
			'syzeppsAdmin',
			array(
				'nonce'            => wp_create_nonce( 'wp_rest' ),
				'shippingZonesUrl' => admin_url( 'admin.php?page=wc-settings&tab=shipping' ),
			)
		);

		$datatable_style_file = is_rtl() ? 'syzepps-backend-datatable-rtl.css' : 'syzepps-backend-datatable.css';
		$datatable_style      = SYZEPPS_PATH . 'assets/css/' . $datatable_style_file;
		if ( is_readable( $datatable_style ) ) {
			wp_enqueue_style( 'syzepps-backend-datatable', SYZEPPS_URL . 'assets/css/' . $datatable_style_file, array(), filemtime( $datatable_style ) );
		}

		$style = SYZEPPS_PATH . 'assets/css/syzepps-backend.css';
		if ( is_readable( $style ) ) {
			wp_enqueue_style( 'syzepps-backend', SYZEPPS_URL . 'assets/css/syzepps-backend.css', array( 'wp-components' ), filemtime( $style ) );
		}
	}
}
