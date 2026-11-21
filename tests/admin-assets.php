<?php
/** Isolated asset-enqueue contract. No WordPress bootstrap or database is loaded. */
define( 'ABSPATH', __DIR__ . '/' );
$GLOBALS['asset_calls'] = array();
$GLOBALS['asset_rtl'] = false;
function add_action( ...$args ) {}
function plugin_dir_url( $file ) { return 'https://example.test/plugins/shipping/'; }
function plugin_dir_path( $file ) { return dirname( $file ) . '/'; }
function plugin_basename( $file ) { return basename( $file ); }
function wp_enqueue_script( ...$args ) { $GLOBALS['asset_calls']['script'] = $args; }
function wp_set_script_translations( ...$args ) { $GLOBALS['asset_calls']['translations'] = $args; }
function wp_localize_script( ...$args ) { $GLOBALS['asset_calls']['config'] = $args; }
function wp_enqueue_style( ...$args ) { $GLOBALS['asset_calls']['style'] = $args; }
function wp_create_nonce( $action ) { return 'isolated-' . $action; }
function admin_url( $url ) { return 'https://example.test/wp-admin/' . $url; }
function get_woocommerce_currency() { return 'USD'; }
function get_bloginfo( $field ) { return 'Isolated test store'; }
function is_rtl() { return $GLOBALS['asset_rtl']; }
function esc_html__( $text, $domain ) { return $text; }
function wp_die( $message ) { throw new RuntimeException( $message ); }
function check_asset( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }
require dirname( __DIR__ ) . '/syzenlabs-per-product-shipping.php';
$init = new \SYZEPPS\Includes\Init();
$init->admin_assets( 'dashboard' );
check_asset( array() === $GLOBALS['asset_calls'], 'Assets leaked onto another admin page.' );
foreach ( array( false, true ) as $rtl ) {
	$GLOBALS['asset_calls'] = array();
	$GLOBALS['asset_rtl'] = $rtl;
	$init->admin_assets( 'woocommerce_page_syzepps-dashboard' );
	$calls = $GLOBALS['asset_calls'];
	check_asset( 'syzepps-backend' === $calls['script'][0], 'The entry handle changed.' );
	check_asset( in_array( 'react', $calls['script'][2], true ) && in_array( 'wp-element', $calls['script'][2], true ), 'The shared WordPress React runtime is missing.' );
	check_asset( ! in_array( 'wp-components', $calls['script'][2], true ), 'Legacy controls are still loaded.' );
	$css = $rtl ? 'syzepps-backend-rtl.css' : 'syzepps-backend.css';
	check_asset( SYZEPPS_URL . 'assets/js/' . $css === $calls['style'][1], 'Wrong webpack stylesheet was enqueued.' );
	check_asset( is_readable( SYZEPPS_PATH . 'assets/js/' . $css ), 'The generated CSS is absent.' );
	check_asset( array() === $calls['style'][2], 'Legacy WordPress component CSS is still required.' );
	check_asset( 'syzepps-backend' === $calls['translations'][0], 'Translations are not attached to the entry.' );
	check_asset( 'syzenlabs-per-product-shipping' === $calls['translations'][1], 'The translation domain does not match the plugin slug.' );
	check_asset( 'USD' === $calls['config'][2]['currency'] && 'isolated-wp_rest' === $calls['config'][2]['nonce'], 'Runtime configuration is incomplete.' );
}
echo "Admin assets: screen scoping, shared React, translations, nonce, currency, LTR and RTL passed.\n";
