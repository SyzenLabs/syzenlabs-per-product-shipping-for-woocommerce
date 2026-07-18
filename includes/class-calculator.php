<?php
/**
 * Pure package rule resolution and arithmetic.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

namespace SYZEPPS\Includes;

defined( 'ABSPATH' ) || exit;

/**
 * Resolves package rules and calculates shipping costs.
 */
class Calculator {
	/**
	 * Calculate standalone and adjusted components for one package.
	 *
	 * @param array $package WooCommerce package.
	 * @param array $data Normalized repository data.
	 * @param array $settings Shipping-method instance settings.
	 * @return array
	 */
	public static function calculate( $package, $data, $settings = array() ) {
		$destination = isset( $package['destination'] ) && is_array( $package['destination'] ) ? $package['destination'] : array();
		$components  = array();
		$adjustments = array();
		$lines       = array();
		$per_order   = array();

		foreach ( isset( $package['contents'] ) && is_array( $package['contents'] ) ? $package['contents'] : array() as $line_key => $line ) {
			$product = isset( $line['data'] ) ? $line['data'] : null;
			if ( ! $product || ( method_exists( $product, 'needs_shipping' ) && ! $product->needs_shipping() ) || ( method_exists( $product, 'is_virtual' ) && $product->is_virtual() ) ) {
				continue;
			}

			$quantity     = max( 0, (float) ( isset( $line['quantity'] ) ? $line['quantity'] : 0 ) );
			$product_id   = method_exists( $product, 'get_id' ) ? absint( $product->get_id() ) : absint( isset( $line['product_id'] ) ? $line['product_id'] : 0 );
			$variation_id = absint( isset( $line['variation_id'] ) ? $line['variation_id'] : 0 );
			$parent_id    = $variation_id && method_exists( $product, 'get_parent_id' ) ? absint( $product->get_parent_id() ) : absint( isset( $line['product_id'] ) ? $line['product_id'] : $product_id );
			$family_id    = $parent_id ? $parent_id : $product_id;
			$parent       = isset( $data['products'][ $family_id ] ) ? $data['products'][ $family_id ] : null;
			$variation    = $variation_id && isset( $data['variations'][ $variation_id ] ) ? $data['variations'][ $variation_id ] : null;
			$record       = $variation && ! empty( $variation['enable_per_variation_shipping'] ) ? $variation : $parent;
			$adjust       = $parent && ! empty( $parent['adjust_shipping_costs'] );
			$resolved     = self::resolve_record( $record, $destination );
			$amount       = null;
			$configured   = false;

			if ( $resolved['configured'] ) {
				$configured = true;
				if ( $resolved['destination_rate'] ) {
					$amount = $resolved['line_cost'] + ( $resolved['item_cost'] * $quantity );
				} else {
					$mode       = isset( $record['calculation_mode'] ) ? $record['calculation_mode'] : 'per_line';
					$dedupe_key = $family_id . ':' . ( $variation && ! empty( $variation['enable_per_variation_shipping'] ) ? $variation_id : 'parent' );
					$amount     = self::apply_mode( $resolved['cost'], $quantity, $mode, isset( $record['quantity_step'] ) ? $record['quantity_step'] : 1, $dedupe_key, $per_order );
				}
			} elseif ( ! $adjust && '' !== (string) ( isset( $settings['default_product_cost'] ) ? $settings['default_product_cost'] : '' ) ) {
				$amount = max( 0, (float) $settings['default_product_cost'] ) * $quantity;
			}

			$line_result = array(
				'key'       => $line_key,
				'quantity'  => $quantity,
				'amount'    => null === $amount ? 0.0 : $amount,
				'available' => null !== $amount,
				'adjusted'  => $adjust && $configured,
				'tax_class' => method_exists( $product, 'get_tax_class' ) ? $product->get_tax_class() : '',
			);

			if ( $line_result['adjusted'] ) {
				$adjustments[] = $line_result;
			} elseif ( $line_result['available'] ) {
				$lines[]      = $line_result;
				$components[] = $line_result['amount'];
			}
		}

		$method           = isset( $settings['calculation_method'] ) ? $settings['calculation_method'] : 'sum';
		$base             = self::aggregate( $components, $method );
		$product_handling = self::product_handling( $lines, $settings );
		$available        = ! empty( $components );
		$order_handling   = $available ? self::order_handling( $base + $product_handling, $settings ) : 0.0;

		return array(
			'available'        => $available,
			'base'             => $base,
			'product_handling' => $product_handling,
			'order_handling'   => $order_handling,
			'total'            => $base + $product_handling + $order_handling,
			'adjustment'       => array_sum( array_column( $adjustments, 'amount' ) ),
			'adjustments'      => $adjustments,
		);
	}

	/**
	 * Resolve the first matching row, then fallback.
	 *
	 * @param array|null $record Record.
	 * @param array      $destination Destination.
	 * @return array
	 */
	private static function resolve_record( $record, $destination ) {
		if ( ! is_array( $record ) ) {
			return array(
				'configured'       => false,
				'destination_rate' => false,
				'cost'             => 0.0,
				'line_cost'        => 0.0,
				'item_cost'        => 0.0,
			);
		}
		foreach ( isset( $record['rules'] ) && is_array( $record['rules'] ) ? $record['rules'] : array() as $rule ) {
			if ( ! self::matches_destination( $rule, $destination ) ) {
				continue;
			}
			$has_line = array_key_exists( 'line_cost', $rule ) && '' !== (string) $rule['line_cost'];
			$has_item = array_key_exists( 'item_cost', $rule ) && '' !== (string) $rule['item_cost'];
			if ( $has_line || $has_item ) {
				return array(
					'configured'       => true,
					'destination_rate' => true,
					'cost'             => 0.0,
					'line_cost'        => $has_line ? max( 0, (float) $rule['line_cost'] ) : 0.0,
					'item_cost'        => $has_item ? max( 0, (float) $rule['item_cost'] ) : 0.0,
				);
			}
			if ( array_key_exists( 'cost', $rule ) && '' !== (string) $rule['cost'] ) {
				return array(
					'configured'       => true,
					'destination_rate' => false,
					'cost'             => max( 0, (float) $rule['cost'] ),
					'line_cost'        => 0.0,
					'item_cost'        => 0.0,
				);
			}
		}
		if ( array_key_exists( 'fallback_cost', $record ) && '' !== (string) $record['fallback_cost'] ) {
			return array(
				'configured'       => true,
				'destination_rate' => false,
				'cost'             => max( 0, (float) $record['fallback_cost'] ),
				'line_cost'        => 0.0,
				'item_cost'        => 0.0,
			);
		}
		return array(
			'configured'       => false,
			'destination_rate' => false,
			'cost'             => 0.0,
			'line_cost'        => 0.0,
			'item_cost'        => 0.0,
		);
	}

	/**
	 * Match all populated destination fields.
	 *
	 * @param array $rule Rule.
	 * @param array $destination Destination.
	 * @return bool
	 */
	private static function matches_destination( $rule, $destination ) {
		foreach ( array( 'country', 'state' ) as $field ) {
			$wanted = strtoupper( trim( isset( $rule[ $field ] ) ? (string) $rule[ $field ] : '' ) );
			$actual = strtoupper( trim( isset( $destination[ $field ] ) ? (string) $destination[ $field ] : '' ) );
			if ( '' !== $wanted && $wanted !== $actual ) {
				return false;
			}
		}
		$city = trim( isset( $rule['city'] ) ? (string) $rule['city'] : '' );
		if ( '' !== $city && 0 !== strcasecmp( $city, trim( isset( $destination['city'] ) ? (string) $destination['city'] : '' ) ) ) {
			return false;
		}
		return PostcodeMatcher::matches( isset( $destination['postcode'] ) ? $destination['postcode'] : '', isset( $rule['postcode'] ) ? $rule['postcode'] : '' );
	}

	/**
	 * Apply a record cost mode.
	 *
	 * @param float  $cost Cost.
	 * @param float  $quantity Quantity.
	 * @param string $mode Mode.
	 * @param int    $step Quantity step.
	 * @param string $key Record key.
	 * @param array  $per_order Seen per-order keys.
	 * @return float
	 */
	private static function apply_mode( $cost, $quantity, $mode, $step, $key, &$per_order ) {
		switch ( $mode ) {
			case 'per_order':
				if ( isset( $per_order[ $key ] ) ) {
					return 0.0;
				}
				$per_order[ $key ] = true;
				return $cost;
			case 'per_item':
				return $cost * $quantity;
			case 'per_quantity_step':
				return $cost * ceil( $quantity / max( 1, absint( $step ) ) );
			case 'per_line':
			default:
				return $cost;
		}
	}

	/**
	 * Aggregate base components.
	 *
	 * @param array  $components Components.
	 * @param string $method Method.
	 * @return float
	 */
	private static function aggregate( $components, $method ) {
		if ( empty( $components ) ) {
			return 0.0;
		}
		if ( 'highest' === $method ) {
			return max( $components );
		}
		if ( 'lowest' === $method ) {
			return min( $components );
		}
		return array_sum( $components );
	}

	/**
	 * Calculate per-product handling.
	 *
	 * @param array $lines Standalone lines.
	 * @param array $settings Settings.
	 * @return float
	 */
	private static function product_handling( $lines, $settings ) {
		$type = isset( $settings['product_handling_fee_type'] ) ? $settings['product_handling_fee_type'] : 'none';
		$fee  = max( 0, (float) ( isset( $settings['product_handling_fee'] ) ? $settings['product_handling_fee'] : 0 ) );
		if ( 'fixed' === $type ) {
			return $fee * array_sum( array_column( $lines, 'quantity' ) );
		}
		if ( 'percentage' === $type ) {
			return array_sum( array_column( $lines, 'amount' ) ) * $fee / 100;
		}
		return 0.0;
	}

	/**
	 * Calculate per-order handling.
	 *
	 * @param float $basis Base plus product handling.
	 * @param array $settings Settings.
	 * @return float
	 */
	private static function order_handling( $basis, $settings ) {
		$type = isset( $settings['order_handling_fee_type'] ) ? $settings['order_handling_fee_type'] : 'none';
		$fee  = max( 0, (float) ( isset( $settings['order_handling_fee'] ) ? $settings['order_handling_fee'] : 0 ) );
		return 'fixed' === $type ? $fee : ( 'percentage' === $type ? $basis * $fee / 100 : 0.0 );
	}
}
