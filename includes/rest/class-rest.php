<?php
/**
 * Admin-only REST API.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

namespace SYZEPPS\Includes\Rest;

use SYZEPPS\Includes\DB;
use SYZEPPS\Includes\Utils\ExportHelper;
use SYZEPPS\Includes\Utils\ImportHelper;

defined( 'ABSPATH' ) || exit;

/**
 * Registers and serves the authenticated administration REST API.
 */
class Rest {
	const NS = 'syzepps/v1';

	/**
	 * Rule repository.
	 *
	 * @var DB
	 */
	private $db;

	/**
	 * Register REST API hooks.
	 */
	public function __construct() {
		$this->db = new DB();
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the complete admin contract.
	 *
	 * @return void
	 */
	public function register_routes() {
		$permission = array( $this, 'permission' );
		register_rest_route(
			self::NS,
			'/products',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'products' ),
				'permission_callback' => $permission,
				'args'                => array(
					'search'   => array(
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '',
					),
					'page'     => array(
						'sanitize_callback' => 'absint',
						'default'           => 1,
					),
					'per_page' => array(
						'sanitize_callback' => 'absint',
						'default'           => 20,
					),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/products/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'product' ),
				'permission_callback' => $permission,
				'args'                => $this->id_args(),
			)
		);
		register_rest_route(
			self::NS,
			'/rules',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'rules' ),
					'permission_callback' => $permission,
					'args'                => array(
						'search'   => array(
							'sanitize_callback' => 'sanitize_text_field',
							'default'           => '',
						),
						'page'     => array(
							'sanitize_callback' => 'absint',
							'default'           => 1,
						),
						'per_page' => array(
							'sanitize_callback' => 'absint',
							'default'           => 20,
						),
						'filters'  => array(
							'sanitize_callback' => array( $this, 'sanitize_filters' ),
							'default'           => array(),
						),
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_rule' ),
					'permission_callback' => $permission,
					'args'                => array(
						'product_id' => array(
							'required'          => true,
							'sanitize_callback' => 'absint',
							'validate_callback' => function ( $value ) {
								return $value > 0; },
						),
						'product'    => array(
							'required' => true,
							'type'     => 'object',
						),
						'variations' => array(
							'type'    => 'object',
							'default' => array(),
						),
					),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/rules/import/dry-run',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'import_dry_run' ),
				'permission_callback' => $permission,
			)
		);
		register_rest_route(
			self::NS,
			'/rules/import/commit',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'import_commit' ),
				'permission_callback' => $permission,
				'args'                => array(
					'token' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_key',
					),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/rules/export',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'export' ),
				'permission_callback' => $permission,
				'args'                => array( 'product_ids' => array( 'type' => 'array' ) ),
			)
		);
		register_rest_route(
			self::NS,
			'/rules/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_rule' ),
					'permission_callback' => $permission,
					'args'                => $this->id_args(),
				),
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'update_rule' ),
					'permission_callback' => $permission,
					'args'                => $this->id_args(),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_rule' ),
					'permission_callback' => $permission,
					'args'                => $this->id_args(),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'settings' ),
					'permission_callback' => $permission,
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_settings' ),
					'permission_callback' => $permission,
					'args'                => array(
						'remove_data_on_uninstall' => array(
							'type'    => 'boolean',
							'default' => false,
						),
					),
				),
			)
		);
	}

	/**
	 * Enforce WooCommerce management capability. REST cookie authentication enforces the nonce.
	 *
	 * @return bool
	 */
	public function permission() {
		return current_user_can( 'manage_woocommerce' );
	}

	/**
	 * Decode the controlled DataViews filter payload.
	 *
	 * @param mixed $value Query value.
	 * @return array
	 */
	public function sanitize_filters( $value ) {
		$filters = is_string( $value ) ? json_decode( wp_unslash( $value ), true ) : $value;
		return is_array( $filters ) ? array_slice( $filters, 0, 10 ) : array();
	}

	/**
	 * Search eligible simple and parent products.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function products( $request ) {
		$page     = max( 1, $request->get_param( 'page' ) );
		$per_page = min( 100, max( 1, $request->get_param( 'per_page' ) ) );
		$args     = array(
			'type'     => array( 'simple', 'variable' ),
			'status'   => array( 'publish', 'draft', 'private' ),
			'page'     => $page,
			'limit'    => $per_page,
			'paginate' => true,
			'orderby'  => 'name',
			'order'    => 'ASC',
		);
		$search   = trim( (string) $request->get_param( 'search' ) );

		if ( '' !== $search ) {
			$args['include'] = \WC_Data_Store::load( 'product' )->search_products( $search, '', false, true );
			if ( empty( $args['include'] ) ) {
				return new \WP_REST_Response(
					array(
						'items'      => array(),
						'pagination' => array(
							'page'       => $page,
							'perPage'    => $per_page,
							'totalItems' => 0,
							'totalPages' => 0,
						),
					)
				);
			}
		}

		$query = wc_get_products( $args );
		$items = array_map( array( $this, 'product_summary' ), $query->products );
		return new \WP_REST_Response(
			array(
				'items'      => $items,
				'pagination' => array(
					'page'       => $page,
					'perPage'    => $per_page,
					'totalItems' => (int) $query->total,
					'totalPages' => (int) $query->max_num_pages,
				),
			)
		);
	}

	/**
	 * Load product metadata and all variations.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function product( $request ) {
		$product = $this->eligible_product( $request['id'] );
		if ( is_wp_error( $product ) ) {
			return $product;
		}
		$item               = $this->product_summary( $product );
		$item['variations'] = array();
		if ( $product->is_type( 'variable' ) ) {
			_prime_post_caches( $product->get_children(), false, false );
			foreach ( $product->get_children() as $variation_id ) {
				$variation = wc_get_product( $variation_id );
				if ( $variation ) {
					$item['variations'][] = array(
						'id'   => $variation_id,
						'name' => $variation->get_name(),
						'sku'  => $variation->get_sku(),
					);
				}
			}
		}
		return new \WP_REST_Response( $item );
	}

	/**
	 * List configured families with pagination and search.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function rules( $request ) {
		$data = $this->db->get_data();
		$ids  = array_map( 'absint', array_keys( $data['products'] ) );
		_prime_post_caches( $ids, false, false );
		$search = strtolower( trim( $request->get_param( 'search' ) ) );
		$items  = array();
		foreach ( $ids as $id ) {
			$product = wc_get_product( $id );
			if ( ! $product ) {
				continue;
			}
			if ( $search && false === strpos( strtolower( $product->get_name() . ' ' . $product->get_sku() . ' ' . $id ), $search ) ) {
				continue;
			}
			$items[] = $this->product_summary( $product );
		}
		$items    = $this->filter_items( $items, $request->get_param( 'filters' ) );
		$page     = max( 1, $request->get_param( 'page' ) );
		$per_page = min( 100, max( 1, $request->get_param( 'per_page' ) ) );
		$total    = count( $items );
		return new \WP_REST_Response(
			array(
				'items'      => array_slice( $items, ( $page - 1 ) * $per_page, $per_page ),
				'pagination' => array(
					'page'       => $page,
					'perPage'    => $per_page,
					'totalItems' => $total,
					'totalPages' => max( 1, (int) ceil( $total / $per_page ) ),
				),
			)
		);
	}

	/**
	 * Create a product-family rule.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_rule( $request ) {
		$id = absint( $request['product_id'] );
		if ( $this->db->get_family( $id ) ) {
			return new \WP_Error( 'syzepps_duplicate', __( 'This product family already has a rule.', 'syzenlabs-per-product-shipping-for-woocommerce' ), array( 'status' => 409 ) );
		}
		return $this->save_request_family( $id, $request );
	}

	/**
	 * Return a product-family rule.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_rule( $request ) {
		$family = $this->db->get_family( $request['id'] );
		if ( ! $family ) {
			return new \WP_Error( 'syzepps_not_found', __( 'Rule not found.', 'syzenlabs-per-product-shipping-for-woocommerce' ), array( 'status' => 404 ) );
		}
		$metadata_request = new \WP_REST_Request( 'GET', '/' );
		$metadata_request->set_param( 'id', $request['id'] );
		$metadata = $this->product( $metadata_request );
		return new \WP_REST_Response( array_merge( $family, array( 'target' => is_wp_error( $metadata ) ? null : $metadata->get_data() ) ) );
	}

	/**
	 * Update a product-family rule.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_rule( $request ) {
		if ( ! $this->db->get_family( $request['id'] ) ) {
			return new \WP_Error( 'syzepps_not_found', __( 'Rule not found.', 'syzenlabs-per-product-shipping-for-woocommerce' ), array( 'status' => 404 ) );
		}
		return $this->save_request_family( absint( $request['id'] ), $request );
	}

	/**
	 * Delete a product-family rule.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_rule( $request ) {
		$this->db->delete_family( $request['id'] );
		return new \WP_REST_Response( null, 204 );
	}

	/**
	 * Validate an uploaded CSV without persisting it.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function import_dry_run( $request ) {
		$files = $request->get_file_params();
		$file  = isset( $files['file'] ) && is_array( $files['file'] ) ? $files['file'] : array();
		if ( empty( $file['tmp_name'] ) || ! is_string( $file['tmp_name'] ) || empty( $file['name'] ) || ! is_string( $file['name'] ) || ! empty( $file['error'] ) || 'csv' !== wp_check_filetype( $file['name'], array( 'csv' => 'text/csv' ) )['ext'] ) {
			return new \WP_Error( 'syzepps_upload_failed', __( 'Choose a valid CSV file.', 'syzenlabs-per-product-shipping-for-woocommerce' ), array( 'status' => 400 ) );
		}
		$mode   = $request->get_param( 'mode' );
		$mode   = is_string( $mode ) ? sanitize_key( $mode ) : 'update';
		$mode   = in_array( $mode, array( 'update', 'skip', 'replace' ), true ) ? $mode : 'update';
		$result = ( new ImportHelper() )->prepare( $file['tmp_name'], $mode );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$token = wp_generate_password( 20, false, false );
		set_transient( 'syzepps_import_' . get_current_user_id() . '_' . $token, $result, 15 * MINUTE_IN_SECONDS );
		unset( $result['data'] );
		$result['token'] = $token;
		return new \WP_REST_Response( $result );
	}

	/**
	 * Commit a previously validated CSV import.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function import_commit( $request ) {
		$key    = 'syzepps_import_' . get_current_user_id() . '_' . sanitize_key( $request['token'] );
		$result = get_transient( $key );
		if ( ! is_array( $result ) || empty( $result['data'] ) ) {
			return new \WP_Error( 'syzepps_import_expired', __( 'The validated import expired. Run the dry run again.', 'syzenlabs-per-product-shipping-for-woocommerce' ), array( 'status' => 410 ) );
		}
		$this->db->replace_data( $result['data'] );
		delete_transient( $key );
		return new \WP_REST_Response(
			array(
				'committed' => $result['summary']['families'],
				'failed'    => $result['summary']['errors'],
				'errors'    => $result['errors'],
			)
		);
	}

	/**
	 * Export selected product-family rules.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function export( $request ) {
		$selected = $request->get_param( 'product_ids' );
		return new \WP_REST_Response(
			array(
				'filename' => 'syzepps-product-rates.csv',
				'csv'      => ( new ExportHelper() )->build( $this->db->get_data(), $selected ),
			)
		);
	}

	/**
	 * Return plugin settings.
	 *
	 * @return \WP_REST_Response
	 */
	public function settings() {
		return new \WP_REST_Response( $this->db->get_settings() );
	}

	/**
	 * Save plugin settings.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function save_settings( $request ) {
		return new \WP_REST_Response( $this->db->update_settings( $request->get_json_params() ) );
	}

	/**
	 * Validate target and persist one family.
	 *
	 * @param int              $id Product ID.
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	private function save_request_family( $id, $request ) {
		$product = $this->eligible_product( $id );
		if ( is_wp_error( $product ) ) {
			return $product;
		}
		$params = $request->get_json_params();
		$family = $this->db->save_family(
			$id,
			array(
				'product'    => isset( $params['product'] ) ? $params['product'] : array(),
				'variations' => isset( $params['variations'] ) ? $params['variations'] : array(),
			)
		);
		return new \WP_REST_Response( $family, 'POST' === $request->get_method() ? 201 : 200 );
	}

	/**
	 * Return an eligible product.
	 *
	 * @param int $id Product ID.
	 * @return \WC_Product|\WP_Error
	 */
	private function eligible_product( $id ) {
		$product = wc_get_product( absint( $id ) );
		return $product && ( $product->is_type( 'simple' ) || $product->is_type( 'variable' ) ) ? $product : new \WP_Error( 'syzepps_invalid_product', __( 'Select a simple product or variable-product parent.', 'syzenlabs-per-product-shipping-for-woocommerce' ), array( 'status' => 400 ) );
	}

	/**
	 * Build a product summary for the administration UI.
	 *
	 * @param \WC_Product $product Product.
	 * @return array
	 */
	private function product_summary( $product ) {
		return array(
			'id'            => $product->get_id(),
			'name'          => $product->get_name(),
			'sku'           => $product->get_sku(),
			'type'          => $product->get_type(),
			'categories'    => wc_get_product_category_list( $product->get_id(), ', ', '', '' ),
			'shippingClass' => $product->get_shipping_class(),
		);
	}

	/**
	 * Apply the controlled DataViews filters before pagination.
	 *
	 * @param array $items Rule summaries.
	 * @param array $filters DataViews filters.
	 * @return array
	 */
	private function filter_items( $items, $filters ) {
		$fields = array( 'name', 'type' );
		foreach ( is_array( $filters ) ? $filters : array() as $filter ) {
			if ( ! is_array( $filter ) || ! in_array( isset( $filter['field'] ) ? $filter['field'] : '', $fields, true ) ) {
				continue;
			}
			$field    = $filter['field'];
			$operator = isset( $filter['operator'] ) ? $filter['operator'] : 'is';
			$value    = isset( $filter['value'] ) ? $filter['value'] : null;
			$items    = array_values(
				array_filter(
					$items,
					function ( $item ) use ( $field, $operator, $value ) {
						return $this->matches_filter( $item[ $field ], $operator, $value );
					}
				)
			);
		}
		return $items;
	}

	/**
	 * Match one scalar DataViews filter.
	 *
	 * @param mixed  $actual Item value.
	 * @param string $operator Filter operator.
	 * @param mixed  $value Filter value.
	 * @return bool
	 */
	private function matches_filter( $actual, $operator, $value ) {
		if ( is_bool( $actual ) ) {
			$match = $actual === (bool) $value;
			return 'isNot' === $operator ? ! $match : $match;
		}
		if ( is_int( $actual ) || is_float( $actual ) ) {
			$number = (float) $value;
			if ( 'lessThan' === $operator ) {
				return $actual < $number;
			}
			if ( 'lessThanOrEqual' === $operator ) {
				return $actual <= $number;
			}
			if ( 'greaterThan' === $operator ) {
				return $actual > $number;
			}
			if ( 'greaterThanOrEqual' === $operator ) {
				return $actual >= $number;
			}
			if ( 'between' === $operator && is_array( $value ) && 2 === count( $value ) ) {
				return $actual >= (float) $value[0] && $actual <= (float) $value[1];
			}
			$match = $actual === (int) $value;
			return 'isNot' === $operator || 'isNone' === $operator ? ! $match : $match;
		}
		$actual = strtolower( (string) $actual );
		$values = is_array( $value ) ? array_map( 'strtolower', array_map( 'strval', $value ) ) : array( strtolower( (string) $value ) );
		if ( 'contains' === $operator || 'notContains' === $operator || 'startsWith' === $operator ) {
			$position = strpos( $actual, $values[0] );
			$match    = 'startsWith' === $operator ? 0 === $position : false !== $position;
			return 'notContains' === $operator ? ! $match : $match;
		}
		$match = in_array( $actual, $values, true );
		return in_array( $operator, array( 'isNot', 'isNone' ), true ) ? ! $match : $match;
	}

	/**
	 * Return the common product ID route argument.
	 *
	 * @return array
	 */
	private function id_args() {
		return array(
			'id' => array(
				'required'          => true,
				'sanitize_callback' => 'absint',
				'validate_callback' => function ( $value ) {
						return $value > 0;
				},
			),
		);
	}
}
