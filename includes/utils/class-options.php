<?php
/**
 * WooCommerce submenu and React mount.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

namespace SYZEPPS\Includes\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the plugin administration page.
 */
class Options {
	/**
	 * Register administration hooks.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_page' ), 99 );
		add_filter( 'plugin_action_links_' . SYZEPPS_BASE, array( $this, 'plugin_actions' ) );
	}

	/**
	 * Register the plugin submenu.
	 *
	 * @return void
	 */
	public function register_page() {
		add_submenu_page( 'woocommerce', __( 'Per Product Shipping', 'syzenlabs-per-product-shipping-for-woocommerce' ), __( 'Per Product Shipping', 'syzenlabs-per-product-shipping-for-woocommerce' ), 'manage_woocommerce', 'syzepps-dashboard', array( $this, 'render_page' ) );
	}

	/**
	 * Render the self-contained React root.
	 *
	 * @return void
	 */
	public function render_page() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You are not allowed to manage shipping rules.', 'syzenlabs-per-product-shipping-for-woocommerce' ) );
		}
		echo '<div id="syzepps-dashboard-wrap" class="syzepps-admin"></div>';
	}

	/**
	 * Add one settings action.
	 *
	 * @param array $links Plugin links.
	 * @return array
	 */
	public function plugin_actions( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'admin.php?page=syzepps-dashboard#settings' ) ) . '">' . esc_html__( 'Settings', 'syzenlabs-per-product-shipping-for-woocommerce' ) . '</a>' );
		return $links;
	}
}
