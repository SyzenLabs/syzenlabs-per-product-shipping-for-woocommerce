<?php
/**
 * Option-backed product-family rule repository.
 *
 * @package syzenlabs-per-product-shipping
 */

namespace SYZEPPS\Includes;

use SYZEPPS\Includes\Utils\Sanitizer;

defined( 'ABSPATH' ) || exit;

/**
 * Stores normalized product-family shipping rules in WordPress options.
 */
class DB {
	const RATES_OPTION    = 'syzepps-product-rates';
	const SETTINGS_OPTION = 'syzepps-settings';

	/**
	 * Cached normalized rate data.
	 *
	 * @var array|null
	 */
	private $data;

	/**
	 * Return normalized rate data.
	 *
	 * @return array
	 */
	public function get_data() {
		if ( null !== $this->data ) {
			return $this->data;
		}

		$data = get_option( self::RATES_OPTION, array() );
		if ( ! is_array( $data ) || ! isset( $data['version'] ) || SYZEPPS_RULE_VER !== (int) $data['version'] ) {
			$data = array();
		}

		$this->data = array(
			'version'    => SYZEPPS_RULE_VER,
			'products'   => isset( $data['products'] ) && is_array( $data['products'] ) ? $data['products'] : array(),
			'variations' => isset( $data['variations'] ) && is_array( $data['variations'] ) ? $data['variations'] : array(),
		);

		return $this->data;
	}

	/**
	 * Replace all rate data after complete sanitization.
	 *
	 * @param array $data Data to store.
	 * @return bool
	 */
	public function replace_data( $data ) {
		$clean = array(
			'version'    => SYZEPPS_RULE_VER,
			'products'   => array(),
			'variations' => array(),
		);
		foreach ( isset( $data['products'] ) && is_array( $data['products'] ) ? $data['products'] : array() as $product_id => $record ) {
			$product_id = absint( $product_id );
			if ( ! $product_id ) {
				continue;
			}
			$clean['products'][ $product_id ]                          = Sanitizer::record( $record );
			$clean['products'][ $product_id ]['adjust_shipping_costs'] = ! empty( $record['adjust_shipping_costs'] );
		}
		foreach ( isset( $data['variations'] ) && is_array( $data['variations'] ) ? $data['variations'] : array() as $variation_id => $record ) {
			$variation_id = absint( $variation_id );
			$parent_id    = absint( isset( $record['parent_id'] ) ? $record['parent_id'] : 0 );
			if ( ! $variation_id || ! $parent_id ) {
				continue;
			}
			$clean['variations'][ $variation_id ]                                  = Sanitizer::record( $record );
			$clean['variations'][ $variation_id ]['parent_id']                     = $parent_id;
			$clean['variations'][ $variation_id ]['enable_per_variation_shipping'] = ! empty( $record['enable_per_variation_shipping'] );
		}

		$this->data = $clean;
		return update_option( self::RATES_OPTION, $clean, false );
	}

	/**
	 * Get one aggregate product family.
	 *
	 * @param int $product_id Parent or simple product ID.
	 * @return array|null
	 */
	public function get_family( $product_id ) {
		$product_id = absint( $product_id );
		$data       = $this->get_data();
		if ( ! isset( $data['products'][ $product_id ] ) ) {
			return null;
		}

		$variations = array();
		foreach ( $data['variations'] as $variation_id => $record ) {
			if ( absint( isset( $record['parent_id'] ) ? $record['parent_id'] : 0 ) === $product_id ) {
				$variations[ $variation_id ] = $record;
			}
		}

		return array(
			'product_id' => $product_id,
			'product'    => $data['products'][ $product_id ],
			'variations' => $variations,
		);
	}

	/**
	 * Save one complete family atomically.
	 *
	 * @param int   $product_id Product ID.
	 * @param array $payload Family payload.
	 * @return array
	 */
	public function save_family( $product_id, $payload ) {
		$product_id = absint( $product_id );
		$data       = $this->get_data();
		$existing   = $this->get_family( $product_id );
		$family     = Sanitizer::family( $product_id, $payload, $existing ? $existing : array() );

		$data['products'][ $product_id ] = $family['product'];
		foreach ( $data['variations'] as $variation_id => $record ) {
			if ( absint( isset( $record['parent_id'] ) ? $record['parent_id'] : 0 ) === $product_id ) {
				unset( $data['variations'][ $variation_id ] );
			}
		}
		$data['variations'] = $data['variations'] + $family['variations'];
		$this->data         = $data;
		update_option( self::RATES_OPTION, $data, false );

		return $this->get_family( $product_id );
	}

	/**
	 * Delete a complete family.
	 *
	 * @param int $product_id Product ID.
	 * @return bool
	 */
	public function delete_family( $product_id ) {
		$product_id = absint( $product_id );
		$data       = $this->get_data();
		unset( $data['products'][ $product_id ] );
		foreach ( $data['variations'] as $variation_id => $record ) {
			if ( absint( isset( $record['parent_id'] ) ? $record['parent_id'] : 0 ) === $product_id ) {
				unset( $data['variations'][ $variation_id ] );
			}
		}
		$this->data = $data;
		return update_option( self::RATES_OPTION, $data, false );
	}

	/**
	 * Delete one variation override.
	 *
	 * @param int $variation_id Variation ID.
	 * @return bool
	 */
	public function delete_variation( $variation_id ) {
		$data = $this->get_data();
		unset( $data['variations'][ absint( $variation_id ) ] );
		$this->data = $data;
		return update_option( self::RATES_OPTION, $data, false );
	}

	/**
	 * Return settings.
	 *
	 * @return array
	 */
	public function get_settings() {
		$settings = get_option( self::SETTINGS_OPTION, array() );
		return Sanitizer::settings( is_array( $settings ) ? $settings : array() );
	}

	/**
	 * Save settings.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	public function update_settings( $settings ) {
		$settings = Sanitizer::settings( is_array( $settings ) ? $settings : array() );
		update_option( self::SETTINGS_OPTION, $settings, true );
		return $settings;
	}
}
