<?php
/**
 * Hostile-input CSV parser for product-family rules.
 *
 * @package syzenlabs-per-product-shipping
 */

namespace SYZEPPS\Includes\Utils;

use SYZEPPS\Includes\DB;

defined( 'ABSPATH' ) || exit;

/**
 * Imports and validates product-family shipping rules from CSV.
 */
class ImportHelper {
	const MAX_BYTES = 2097152;
	const HEADERS   = array( 'product_identifier', 'product_id', 'sku', 'variation_id', 'enable_per_variation_shipping', 'adjust_shipping_costs', 'country', 'state', 'city', 'postcode', 'line_cost', 'item_cost', 'calculation_mode', 'fallback_cost' );

	/**
	 * Parse and validate a CSV without writing.
	 *
	 * @param string $path Uploaded temporary path.
	 * @param string $mode update, skip, or replace.
	 * @return array|\WP_Error
	 */
	public function prepare( $path, $mode = 'update' ) {
		if ( ! is_readable( $path ) || filesize( $path ) > self::MAX_BYTES ) {
			return new \WP_Error( 'syzepps_invalid_file', __( 'The CSV is missing or exceeds 2 MB.', 'syzenlabs-per-product-shipping' ), array( 'status' => 400 ) );
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- Streaming is required to parse valid multiline CSV fields without loading a hostile upload into memory.
		$handle = fopen( $path, 'r' );
		if ( false === $handle ) {
			return new \WP_Error( 'syzepps_invalid_file', __( 'The CSV could not be read.', 'syzenlabs-per-product-shipping' ), array( 'status' => 400 ) );
		}
		$headers = fgetcsv( $handle );
		if ( self::HEADERS !== $headers ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- This closes the validated upload stream opened above.
			fclose( $handle );
			return new \WP_Error( 'syzepps_invalid_headers', __( 'The CSV headers do not match the export format.', 'syzenlabs-per-product-shipping' ), array( 'status' => 400 ) );
		}

		$db       = new DB();
		$data     = $db->get_data();
		$families = array();
		$errors   = array();
		$row      = 1;
		// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition -- Each iteration must advance before any validation branch continues.
		while ( false !== ( $values = fgetcsv( $handle ) ) ) {
			++$row;
			if ( count( $values ) !== count( self::HEADERS ) ) {
				$errors[] = array(
					'row'     => $row,
					'message' => __( 'Column count does not match the header.', 'syzenlabs-per-product-shipping' ),
				);
				continue;
			}
			$item       = array_combine( self::HEADERS, $values );
			$product_id = absint( $item['product_id'] );
			if ( ! $product_id && $item['sku'] ) {
				$product_id = absint( wc_get_product_id_by_sku( sanitize_text_field( $item['sku'] ) ) );
			}
			$product = $product_id ? wc_get_product( $product_id ) : null;
			if ( $product && $product->is_type( 'variation' ) ) {
				$product_id = $product->get_parent_id();
				$product    = wc_get_product( $product_id );
			}
			if ( ! $product || ! ( $product->is_type( 'simple' ) || $product->is_type( 'variable' ) ) ) {
				$errors[] = array(
					'row'     => $row,
					'message' => __( 'Product target is missing or ineligible.', 'syzenlabs-per-product-shipping' ),
				);
				continue;
			}
			foreach ( array( 'line_cost', 'item_cost' ) as $cost_field ) {
				if ( '' !== $item[ $cost_field ] && ( ! is_numeric( $item[ $cost_field ] ) || (float) $item[ $cost_field ] < 0 ) ) {
					$errors[] = array(
						'row'     => $row,
						'message' => __( 'Line cost and item cost must be non-negative numbers or empty.', 'syzenlabs-per-product-shipping' ),
					);
					continue 2;
				}
			}
			if ( ! isset( $families[ $product_id ] ) ) {
				$existing = $db->get_family( $product_id );
				if ( 'skip' === $mode && $existing ) {
					continue;
				}
				$families[ $product_id ] = 'replace' === $mode || ! $existing ? array(
					'product'    => array( 'rules' => array() ),
					'variations' => array(),
				) : $existing;
			}
			$variation_id = absint( $item['variation_id'] );
			$record       =& $families[ $product_id ]['product'];
			if ( $variation_id ) {
				$variation = wc_get_product( $variation_id );
				if ( ! $variation || $variation->get_parent_id() !== $product_id ) {
					$errors[] = array(
						'row'     => $row,
						'message' => __( 'Variation does not belong to the product.', 'syzenlabs-per-product-shipping' ),
					);
					continue;
				}
				if ( ! isset( $families[ $product_id ]['variations'][ $variation_id ] ) ) {
					$families[ $product_id ]['variations'][ $variation_id ] = array(
						'parent_id' => $product_id,
						'rules'     => array(),
					);
				}
				$record                                  =& $families[ $product_id ]['variations'][ $variation_id ];
				$record['enable_per_variation_shipping'] = self::boolean( $item['enable_per_variation_shipping'] );
			}
			$families[ $product_id ]['product']['adjust_shipping_costs'] = self::boolean( $item['adjust_shipping_costs'] );
			$record['calculation_mode']                                  = sanitize_key( $item['calculation_mode'] );
			$record['fallback_cost']                                     = Sanitizer::decimal_or_empty( $item['fallback_cost'] );
			if ( '' !== $item['line_cost'] || '' !== $item['item_cost'] ) {
				$record['rules'][] = array(
					'id'        => 'rule_' . $row,
					'country'   => $item['country'],
					'state'     => $item['state'],
					'city'      => $item['city'],
					'postcode'  => $item['postcode'],
					'line_cost' => $item['line_cost'],
					'item_cost' => $item['item_cost'],
				);
			}
			unset( $record );
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- This closes the validated upload stream opened above.
		fclose( $handle );

		foreach ( $families as $product_id => $family ) {
			$existing                        = $db->get_family( $product_id );
			$clean                           = Sanitizer::family( $product_id, $family, $existing ? $existing : array() );
			$data['products'][ $product_id ] = $clean['product'];
			foreach ( $data['variations'] as $variation_id => $record ) {
				if ( absint( isset( $record['parent_id'] ) ? $record['parent_id'] : 0 ) === $product_id ) {
					unset( $data['variations'][ $variation_id ] );
				}
			}
			$data['variations'] += $clean['variations'];
		}

		return array(
			'data'    => $data,
			'summary' => array(
				'families' => count( $families ),
				'errors'   => count( $errors ),
			),
			'errors'  => $errors,
		);
	}

	/**
	 * Parse common CSV booleans.
	 *
	 * @param string $value Value.
	 * @return bool
	 */
	private static function boolean( $value ) {
		return in_array( strtolower( trim( (string) $value ) ), array( '1', 'true', 'yes', 'on' ), true );
	}
}
