<?php
/**
 * WooCommerce registration, product fields, and package-rate filters.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

namespace SYZEPPS\Includes\Utils;

use SYZEPPS\Includes\Calculator;
use SYZEPPS\Includes\DB;
use SYZEPPS\Includes\ShippingMethod;

defined( 'ABSPATH' ) || exit;

/**
 * Coordinates WooCommerce hooks used by the plugin.
 */
class Hooks {
	/**
	 * Rule repository.
	 *
	 * @var DB
	 */
	private $db;

	/**
	 * Register WooCommerce hooks.
	 */
	public function __construct() {
		$this->db = new DB();
		add_filter( 'woocommerce_shipping_methods', array( $this, 'register_method' ) );
		add_filter( 'woocommerce_package_rates', array( $this, 'filter_package_rates' ), 100, 2 );
		add_action( 'before_delete_post', array( $this, 'delete_product_data' ) );
	}

	/**
	 * Register the shipping method.
	 *
	 * @param array $methods Methods.
	 * @return array
	 */
	public function register_method( $methods ) {
		$methods['syzepps_wc_method'] = ShippingMethod::class;
		return $methods;
	}

	/**
	 * Add adjusted product costs and apply guarded suppression settings.
	 *
	 * @param array $rates Calculated rates.
	 * @param array $package Package.
	 * @return array
	 */
	public function filter_package_rates( $rates, $package ) {
		$result = Calculator::calculate( $package, $this->db->get_data() );
		if ( $result['adjustment'] > 0 ) {
			foreach ( $rates as $rate ) {
				if ( in_array( $rate->get_method_id(), array( 'free_shipping', 'syzepps_wc_method' ), true ) ) {
					continue;
				}
				$rate->set_cost( (float) $rate->get_cost() + $result['adjustment'] );
				$method = $rate->get_instance_id() ? \WC_Shipping_Zones::get_shipping_method( $rate->get_instance_id() ) : null;
				if ( $method && isset( $method->tax_status ) && 'taxable' === $method->tax_status ) {
					$rate->set_taxes( $this->merge_adjustment_taxes( $rate->get_taxes(), $result['adjustments'] ) );
				}
			}
		}

		$hide_free   = false;
		$hide_pickup = false;
		foreach ( $rates as $rate ) {
			if ( 'syzepps_wc_method' !== $rate->get_method_id() || ! $rate->get_instance_id() ) {
				continue;
			}
			$settings    = get_option( 'woocommerce_syzepps_wc_method_' . absint( $rate->get_instance_id() ) . '_settings', array() );
			$hide_free   = $hide_free || 'yes' === ( isset( $settings['ignore_free_shipping'] ) ? $settings['ignore_free_shipping'] : 'no' );
			$hide_pickup = $hide_pickup || 'yes' === ( isset( $settings['ignore_local_pickup'] ) ? $settings['ignore_local_pickup'] : 'no' );
		}
		foreach ( $rates as $rate_id => $rate ) {
			if ( ( $hide_free && 'free_shipping' === $rate->get_method_id() ) || ( $hide_pickup && 'local_pickup' === $rate->get_method_id() ) ) {
				unset( $rates[ $rate_id ] );
			}
		}
		return $rates;
	}

	/**
	 * Add tax for adjusted components using each product tax class.
	 *
	 * @param array $taxes Existing rate taxes.
	 * @param array $adjustments Adjustment lines.
	 * @return array
	 */
	private function merge_adjustment_taxes( $taxes, $adjustments ) {
		$taxes = is_array( $taxes ) ? $taxes : array();
		foreach ( $adjustments as $line ) {
			$line_taxes = \WC_Tax::calc_shipping_tax( $line['amount'], \WC_Tax::get_shipping_tax_rates( $line['tax_class'] ) );
			foreach ( $line_taxes as $tax_id => $amount ) {
				$taxes[ $tax_id ] = ( isset( $taxes[ $tax_id ] ) ? (float) $taxes[ $tax_id ] : 0 ) + $amount;
			}
		}
		return $taxes;
	}


	/**
	 * Remove deleted product data.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function delete_product_data( $post_id ) {
		$data = $this->db->get_data();
		if ( isset( $data['variations'][ $post_id ] ) ) {
			$this->db->delete_variation( $post_id );
		} elseif ( isset( $data['products'][ $post_id ] ) ) {
			$this->db->delete_family( $post_id );
		}
	}
}
