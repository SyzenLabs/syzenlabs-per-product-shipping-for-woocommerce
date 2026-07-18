<?php
/**
 * Syzenlabs Per Product Shipping uninstall.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

$syzepps_settings = get_option( 'syzepps-settings', array() );
if ( ! empty( $syzepps_settings['remove_data_on_uninstall'] ) ) {
	delete_option( 'syzepps-product-rates' );
	delete_option( 'syzepps-settings' );

	global $wpdb;
	$syzepps_pattern = $wpdb->esc_like( 'woocommerce_syzepps_wc_method_' ) . '%' . $wpdb->esc_like( '_settings' );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- The Options API cannot enumerate wildcard instance keys, and uninstall queries must not be cached.
	$syzepps_options = $wpdb->get_col(
		$wpdb->prepare( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $syzepps_pattern )
	);
	foreach ( $syzepps_options as $syzepps_option ) {
		delete_option( $syzepps_option );
	}
}
