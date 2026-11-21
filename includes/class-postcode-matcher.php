<?php
/**
 * Postcode pattern matching.
 *
 * @package syzenlabs-per-product-shipping
 */

namespace SYZEPPS\Includes;

defined( 'ABSPATH' ) || exit;

/**
 * Matches customer postcodes against configured patterns.
 */
class PostcodeMatcher {
	/**
	 * Match exact values, wildcards, numeric ranges, or comma lists.
	 *
	 * @param string $postcode Customer postcode.
	 * @param string $patterns Stored patterns.
	 * @return bool
	 */
	public static function matches( $postcode, $patterns ) {
		$postcode = self::normalize( $postcode );
		$patterns = trim( (string) $patterns );
		if ( '' === $patterns ) {
			return true;
		}

		foreach ( explode( ',', $patterns ) as $pattern ) {
			$pattern = self::normalize( $pattern );
			if ( '' === $pattern ) {
				continue;
			}

			if ( false !== strpos( $pattern, '*' ) ) {
				$regex = '/^' . str_replace( '\\*', '.*', preg_quote( $pattern, '/' ) ) . '$/i';
				if ( preg_match( $regex, $postcode ) ) {
					return true;
				}
				continue;
			}

			if ( preg_match( '/^(\d+)\s*-\s*(\d+)$/', $pattern, $range ) ) {
				if ( ctype_digit( $postcode ) && (int) $range[1] <= (int) $range[2] && (int) $postcode >= (int) $range[1] && (int) $postcode <= (int) $range[2] ) {
					return true;
				}
				continue;
			}

			if ( $postcode === $pattern ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Normalize case and whitespace without removing meaningful punctuation.
	 *
	 * @param string $value Value.
	 * @return string
	 */
	private static function normalize( $value ) {
		return strtoupper( preg_replace( '/\s+/', '', trim( (string) $value ) ) );
	}
}
