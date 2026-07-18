<?php
/**
 * Rule and settings sanitization.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

namespace SYZEPPS\Includes\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * Sanitizes shipping rules and plugin settings.
 */
class Sanitizer {
	const MODES = array( 'per_order', 'per_item', 'per_line', 'per_quantity_step' );

	/**
	 * Sanitize a product or variation rate record.
	 *
	 * @param array $record Raw record.
	 * @param array $existing Existing record whose compatible unknown fields are retained.
	 * @return array
	 */
	public static function record( $record, $existing = array() ) {
		$record   = is_array( $record ) ? $record : array();
		$existing = is_array( $existing ) ? $existing : array();
		$result   = array_merge( $existing, $record );
		$mode     = isset( $record['calculation_mode'] ) ? sanitize_key( $record['calculation_mode'] ) : ( isset( $existing['calculation_mode'] ) ? $existing['calculation_mode'] : 'per_line' );

		$result['calculation_mode'] = in_array( $mode, self::MODES, true ) ? $mode : 'per_line';
		$result['quantity_step']    = max( 1, absint( isset( $record['quantity_step'] ) ? $record['quantity_step'] : ( isset( $existing['quantity_step'] ) ? $existing['quantity_step'] : 1 ) ) );
		$result['fallback_cost']    = self::decimal_or_empty( isset( $record['fallback_cost'] ) ? $record['fallback_cost'] : ( isset( $existing['fallback_cost'] ) ? $existing['fallback_cost'] : '' ) );
		$result['rules']            = array();

		foreach ( isset( $record['rules'] ) && is_array( $record['rules'] ) ? $record['rules'] : array() as $index => $rule ) {
			if ( ! is_array( $rule ) ) {
				continue;
			}
			$line_cost   = self::decimal_or_empty( isset( $rule['line_cost'] ) ? $rule['line_cost'] : '' );
			$item_cost   = self::decimal_or_empty( isset( $rule['item_cost'] ) ? $rule['item_cost'] : '' );
			$legacy_cost = self::decimal_or_empty( isset( $rule['cost'] ) ? $rule['cost'] : '' );
			if ( '' === $line_cost && '' === $item_cost && '' === $legacy_cost ) {
				continue;
			}
			$clean = array(
				'id'        => ! empty( $rule['id'] ) ? sanitize_key( $rule['id'] ) : 'rule_' . ( $index + 1 ),
				'country'   => strtoupper( sanitize_text_field( isset( $rule['country'] ) ? $rule['country'] : '' ) ),
				'state'     => strtoupper( sanitize_text_field( isset( $rule['state'] ) ? $rule['state'] : '' ) ),
				'city'      => sanitize_text_field( isset( $rule['city'] ) ? $rule['city'] : '' ),
				'postcode'  => sanitize_text_field( isset( $rule['postcode'] ) ? $rule['postcode'] : '' ),
				'line_cost' => $line_cost,
				'item_cost' => $item_cost,
			);
			if ( '' === $line_cost && '' === $item_cost ) {
				$clean['cost']      = $legacy_cost;
				$clean['cost_type'] = 'fixed';
			}
			$result['rules'][] = $clean;
		}

		return $result;
	}

	/**
	 * Sanitize a complete product family.
	 *
	 * @param int   $product_id Product ID.
	 * @param array $payload Raw family payload.
	 * @param array $existing Existing stored data.
	 * @return array
	 */
	public static function family( $product_id, $payload, $existing = array() ) {
		$payload                          = is_array( $payload ) ? $payload : array();
		$existing                         = is_array( $existing ) ? $existing : array();
		$product_id                       = absint( $product_id );
		$product                          = self::record( isset( $payload['product'] ) ? $payload['product'] : $payload, isset( $existing['product'] ) ? $existing['product'] : array() );
		$product['adjust_shipping_costs'] = ! empty( $payload['product']['adjust_shipping_costs'] ) || ( ! isset( $payload['product'] ) && ! empty( $payload['adjust_shipping_costs'] ) );

		$variations = array();
		foreach ( isset( $payload['variations'] ) && is_array( $payload['variations'] ) ? $payload['variations'] : array() as $variation_id => $variation ) {
			$variation_id = absint( $variation_id );
			if ( ! $variation_id || ! is_array( $variation ) ) {
				continue;
			}
			$current                                = isset( $existing['variations'][ $variation_id ] ) ? $existing['variations'][ $variation_id ] : array();
			$clean                                  = self::record( $variation, $current );
			$clean['parent_id']                     = $product_id;
			$clean['enable_per_variation_shipping'] = ! empty( $variation['enable_per_variation_shipping'] );
			$variations[ $variation_id ]            = $clean;
		}

		return array(
			'product'    => $product,
			'variations' => $variations,
		);
	}

	/**
	 * Sanitize plugin settings.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	public static function settings( $settings ) {
		return array( 'remove_data_on_uninstall' => ! empty( $settings['remove_data_on_uninstall'] ) );
	}

	/**
	 * Sanitize a non-negative decimal while preserving empty values and zero.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	public static function decimal_or_empty( $value ) {
		if ( '' === $value || null === $value ) {
			return '';
		}
		$value = function_exists( 'wc_format_decimal' ) ? wc_format_decimal( $value ) : preg_replace( '/[^0-9.\-]/', '', (string) $value );
		if ( '' === $value || ! is_numeric( $value ) ) {
			return '';
		}
		return (string) max( 0, (float) $value );
	}
}
