<?php
/**
 * Product-family CSV export.
 *
 * @package syzenlabs-per-product-shipping
 */

namespace SYZEPPS\Includes\Utils;

defined( 'ABSPATH' ) || exit;

/**
 * Exports product-family shipping rules as CSV.
 */
class ExportHelper {
	/**
	 * Build an escaped CSV for selected or all product families.
	 *
	 * @param array      $data Repository data.
	 * @param array|null $selected Selected product IDs.
	 * @return string
	 */
	public function build( $data, $selected = null ) {
		$selected = is_array( $selected ) ? array_map( 'absint', $selected ) : null;
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- A temporary PHP stream avoids filesystem writes while preserving RFC 4180 encoding.
		$handle = fopen( 'php://temp', 'w+' );
		fputcsv( $handle, ImportHelper::HEADERS );
		foreach ( isset( $data['products'] ) ? $data['products'] : array() as $product_id => $record ) {
			$product_id = absint( $product_id );
			if ( null !== $selected && ! in_array( $product_id, $selected, true ) ) {
				continue;
			}
			$product = wc_get_product( $product_id );
			$sku     = $product ? $product->get_sku() : '';
			$this->write_record( $handle, $product_id, $sku, 0, $record, false, ! empty( $record['adjust_shipping_costs'] ) );
			foreach ( isset( $data['variations'] ) ? $data['variations'] : array() as $variation_id => $variation ) {
				if ( absint( isset( $variation['parent_id'] ) ? $variation['parent_id'] : 0 ) !== $product_id ) {
					continue;
				}
				$this->write_record( $handle, $product_id, $sku, absint( $variation_id ), $variation, ! empty( $variation['enable_per_variation_shipping'] ), ! empty( $record['adjust_shipping_costs'] ) );
			}
		}
		rewind( $handle );
		$csv = stream_get_contents( $handle );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- This closes the temporary PHP stream opened above.
		fclose( $handle );
		return $csv;
	}

	/**
	 * Write one record as one fallback row plus destination rows.
	 *
	 * @param resource $handle Stream.
	 * @param int      $product_id Product ID.
	 * @param string   $sku SKU.
	 * @param int      $variation_id Variation ID.
	 * @param array    $record Record.
	 * @param bool     $enabled Variation enabled.
	 * @param bool     $adjust Adjust setting.
	 * @return void
	 */
	private function write_record( $handle, $product_id, $sku, $variation_id, $record, $enabled, $adjust ) {
		$rules = isset( $record['rules'] ) && is_array( $record['rules'] ) && $record['rules'] ? $record['rules'] : array( array() );
		foreach ( $rules as $rule ) {
			$line_cost = isset( $rule['line_cost'] ) ? $rule['line_cost'] : '';
			$item_cost = isset( $rule['item_cost'] ) ? $rule['item_cost'] : '';
			if ( '' === $line_cost && '' === $item_cost && isset( $rule['cost'] ) ) {
				if ( 'per_item' === ( isset( $record['calculation_mode'] ) ? $record['calculation_mode'] : 'per_line' ) ) {
					$item_cost = $rule['cost'];
				} else {
					$line_cost = $rule['cost'];
				}
			}
			$row = array(
				$product_id,
				$product_id,
				$sku,
				$variation_id ? $variation_id : '',
				$enabled ? '1' : '0',
				$adjust ? '1' : '0',
				isset( $rule['country'] ) ? $rule['country'] : '',
				isset( $rule['state'] ) ? $rule['state'] : '',
				isset( $rule['city'] ) ? $rule['city'] : '',
				isset( $rule['postcode'] ) ? $rule['postcode'] : '',
				$line_cost,
				$item_cost,
				isset( $record['calculation_mode'] ) ? $record['calculation_mode'] : 'per_line',
				isset( $record['fallback_cost'] ) ? $record['fallback_cost'] : '',
			);
			fputcsv( $handle, array_map( array( $this, 'safe_cell' ), $row ) );
		}
	}

	/**
	 * Prevent spreadsheet formula execution.
	 *
	 * @param mixed $value Cell value.
	 * @return string
	 */
	private function safe_cell( $value ) {
		$value = (string) $value;
		return preg_match( '/^[=+\-@]/', $value ) ? "'" . $value : $value;
	}
}
