<?php
/**
 * WooCommerce Per Product shipping method.
 *
 * @package syzenlabs-per-product-shipping-for-woocommerce
 */

namespace SYZEPPS\Includes;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce per-product shipping method.
 */
class ShippingMethod extends \WC_Shipping_Method {
	/**
	 * Create a zone method instance.
	 *
	 * @param int $instance_id WooCommerce instance ID.
	 */
	public function __construct( $instance_id = 0 ) {
		$this->id                 = 'syzepps_wc_method';
		$this->instance_id        = absint( $instance_id );
		$this->method_title       = __( 'Per Product Shipping', 'syzenlabs-per-product-shipping-for-woocommerce' );
		$this->method_description = __( 'Calculate shipping from product and variation destination rules.', 'syzenlabs-per-product-shipping-for-woocommerce' );
		$this->supports           = array( 'shipping-zones', 'instance-settings', 'instance-settings-modal' );
		$this->init();
	}

	/**
	 * Initialize form fields and settings.
	 *
	 * @return void
	 */
	private function init() {
		$this->init_instance_form_fields();
		$this->init_settings();
		$this->title      = $this->get_option( 'title', $this->method_title );
		$this->tax_status = $this->get_option( 'tax_status', 'taxable' );
		add_action( 'woocommerce_update_options_shipping_' . $this->id, array( $this, 'process_admin_options' ) );
	}

	/**
	 * Define native WooCommerce instance controls.
	 *
	 * @return void
	 */
	public function init_instance_form_fields() {
		$this->instance_form_fields = array(
			'title'                     => array(
				'title'       => __( 'Title', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'type'        => 'text',
				'default'     => __( 'Per Product Shipping', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'description' => __( 'Shown to customers at checkout.', 'syzenlabs-per-product-shipping-for-woocommerce' ),
			),
			'tax_status'                => array(
				'title'   => __( 'Tax status', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'type'    => 'select',
				'default' => 'taxable',
				'options' => array(
					'taxable' => __( 'Taxable', 'syzenlabs-per-product-shipping-for-woocommerce' ),
					'none'    => _x( 'None', 'Tax status', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				),
			),
			'calculation_method'        => array(
				'title'   => __( 'Calculation method', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'type'    => 'select',
				'default' => 'sum',
				'options' => array(
					'sum'     => __( 'Sum', 'syzenlabs-per-product-shipping-for-woocommerce' ),
					'highest' => __( 'Highest', 'syzenlabs-per-product-shipping-for-woocommerce' ),
					'lowest'  => __( 'Lowest', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				),
			),
			'default_product_cost'      => array(
				'title'             => __( 'Default product cost', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'type'              => 'price',
				'default'           => '',
				'custom_attributes' => array(
					'min'  => '0',
					'step' => '0.01',
				),
			),
			'product_handling_fee_type' => $this->fee_type_field( __( 'Handling fee per product type', 'syzenlabs-per-product-shipping-for-woocommerce' ) ),
			'product_handling_fee'      => $this->fee_field( __( 'Handling fee per product', 'syzenlabs-per-product-shipping-for-woocommerce' ) ),
			'order_handling_fee_type'   => $this->fee_type_field( __( 'Handling fee per order type', 'syzenlabs-per-product-shipping-for-woocommerce' ) ),
			'order_handling_fee'        => $this->fee_field( __( 'Handling fee per order', 'syzenlabs-per-product-shipping-for-woocommerce' ) ),
			'ignore_free_shipping'      => array(
				'title'   => __( 'Ignore Free Shipping', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'type'    => 'checkbox',
				'default' => 'no',
			),
			'ignore_local_pickup'       => array(
				'title'   => __( 'Ignore Local Pickup', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'type'    => 'checkbox',
				'default' => 'no',
			),
		);
	}

	/**
	 * Fee type field definition.
	 *
	 * @param string $title Title.
	 * @return array
	 */
	private function fee_type_field( $title ) {
		return array(
			'title'   => $title,
			'type'    => 'select',
			'default' => 'none',
			'options' => array(
				'none'       => __( 'None', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'fixed'      => __( 'Fixed', 'syzenlabs-per-product-shipping-for-woocommerce' ),
				'percentage' => __( 'Percentage', 'syzenlabs-per-product-shipping-for-woocommerce' ),
			),
		);
	}

	/**
	 * Fee amount field definition.
	 *
	 * @param string $title Title.
	 * @return array
	 */
	private function fee_field( $title ) {
		return array(
			'title'             => $title,
			'type'              => 'number',
			'default'           => '0',
			'custom_attributes' => array(
				'min'  => '0',
				'step' => '0.01',
			),
		);
	}

	/**
	 * Sanitize every stored instance value.
	 *
	 * @return bool
	 */
	public function process_admin_options() {
		$result                        = parent::process_admin_options();
		$options                       = get_option( $this->get_instance_option_key(), array() );
		$options['calculation_method'] = in_array( isset( $options['calculation_method'] ) ? $options['calculation_method'] : '', array( 'sum', 'highest', 'lowest' ), true ) ? $options['calculation_method'] : 'sum';
		$options['tax_status']         = 'none' === ( isset( $options['tax_status'] ) ? $options['tax_status'] : '' ) ? 'none' : 'taxable';
		foreach ( array( 'product_handling_fee_type', 'order_handling_fee_type' ) as $key ) {
			$options[ $key ] = in_array( isset( $options[ $key ] ) ? $options[ $key ] : '', array( 'none', 'fixed', 'percentage' ), true ) ? $options[ $key ] : 'none';
		}
		foreach ( array( 'default_product_cost', 'product_handling_fee', 'order_handling_fee' ) as $key ) {
			if ( 'default_product_cost' === $key && '' === (string) ( isset( $options[ $key ] ) ? $options[ $key ] : '' ) ) {
				$options[ $key ] = '';
			} else {
				$options[ $key ] = (string) max( 0, (float) ( isset( $options[ $key ] ) ? $options[ $key ] : 0 ) );
			}
		}
		$options['ignore_free_shipping'] = 'yes' === ( isset( $options['ignore_free_shipping'] ) ? $options['ignore_free_shipping'] : 'no' ) ? 'yes' : 'no';
		$options['ignore_local_pickup']  = 'yes' === ( isset( $options['ignore_local_pickup'] ) ? $options['ignore_local_pickup'] : 'no' ) ? 'yes' : 'no';
		update_option( $this->get_instance_option_key(), $options );
		$this->init_settings();
		return $result;
	}

	/**
	 * Add a rate only when a standalone component is available.
	 *
	 * @param array $package WooCommerce package.
	 * @return void
	 */
	public function calculate_shipping( $package = array() ) {
		$settings = array(
			'calculation_method'        => $this->get_option( 'calculation_method', 'sum' ),
			'default_product_cost'      => $this->get_option( 'default_product_cost', '' ),
			'product_handling_fee_type' => $this->get_option( 'product_handling_fee_type', 'none' ),
			'product_handling_fee'      => $this->get_option( 'product_handling_fee', '0' ),
			'order_handling_fee_type'   => $this->get_option( 'order_handling_fee_type', 'none' ),
			'order_handling_fee'        => $this->get_option( 'order_handling_fee', '0' ),
		);
		$result   = Calculator::calculate( $package, ( new DB() )->get_data(), $settings );
		if ( ! $result['available'] ) {
			return;
		}
		$this->add_rate(
			array(
				'id'      => $this->get_rate_id(),
				'label'   => $this->title,
				'cost'    => $result['total'],
				'package' => $package,
			)
		);
	}
}
