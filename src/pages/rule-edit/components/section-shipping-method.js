import {
	Card,
	CardBody,
	__experimentalInputControl as InputControl,
	Notice,
	Panel,
	PanelBody,
	ToggleControl,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DestinationRates } from './manual-rates';

const updateRecord = ( family, scope, id, patch ) => {
	if ( scope === 'product' ) {
		return { ...family, product: { ...family.product, ...patch } };
	}
	return {
		...family,
		variations: {
			...family.variations,
			[ id ]: { ...family.variations[ id ], ...patch },
		},
	};
};

const RateFields = ( { record, onChange } ) => (
	<VStack spacing={ 5 }>
		<div>
			<Heading level={ 4 }>
				{ __(
					'Destination rates',
					'syzenlabs-per-product-shipping-for-woocommerce'
				) }
			</Heading>
			<Text>
				{ __(
					'The first matching row wins. Drag rows to change priority.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				) }
			</Text>
		</div>
		<DestinationRates
			value={ record.rules || [] }
			legacyMode={ record.calculation_mode }
			onChange={ ( rules ) => onChange( { rules } ) }
		/>

		<InputControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __(
				'Fallback cost',
				'syzenlabs-per-product-shipping-for-woocommerce'
			) }
			help={ __(
				'Used only when no destination row matches. Empty means no configured fallback.',
				'syzenlabs-per-product-shipping-for-woocommerce'
			) }
			type="number"
			min="0"
			step="0.01"
			value={ record.fallback_cost ?? '' }
			onChange={ ( fallback_cost ) => onChange( { fallback_cost } ) }
		/>
	</VStack>
);

export const ProductFamilyForm = ( { target, family, onChange } ) => {
	if ( ! target ) {
		return (
			<Notice status="info" isDismissible={ false }>
				{ __(
					'Select a product to configure its rates.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				) }
			</Notice>
		);
	}
	const product = family.product || {};

	return (
		<VStack spacing={ 5 }>
			{ target.type === 'simple' ? (
				<Card>
					<CardBody>
						<VStack spacing={ 5 }>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __(
									'Adjust Shipping Costs',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
								help={ __(
									'Add configured costs to eligible non-free shipping methods instead of the standalone Per Product method.',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
								checked={ !! product.adjust_shipping_costs }
								onChange={ ( adjust_shipping_costs ) =>
									onChange(
										updateRecord( family, 'product', null, {
											adjust_shipping_costs,
										} )
									)
								}
							/>
							<RateFields
								record={ product }
								onChange={ ( patch ) =>
									onChange(
										updateRecord(
											family,
											'product',
											null,
											patch
										)
									)
								}
							/>
						</VStack>
					</CardBody>
				</Card>
			) : (
				<Panel>
					<PanelBody
						title={ __(
							'Parent product rates',
							'syzenlabs-per-product-shipping-for-woocommerce'
						) }
						initialOpen
					>
						<VStack spacing={ 5 }>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __(
									'Adjust Shipping Costs',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
								checked={ !! product.adjust_shipping_costs }
								onChange={ ( adjust_shipping_costs ) =>
									onChange(
										updateRecord( family, 'product', null, {
											adjust_shipping_costs,
										} )
									)
								}
							/>
							<RateFields
								record={ product }
								onChange={ ( patch ) =>
									onChange(
										updateRecord(
											family,
											'product',
											null,
											patch
										)
									)
								}
							/>
						</VStack>
					</PanelBody>
					{ target.variations?.map( ( variation ) => {
						const record = family.variations?.[ variation.id ] || {
							parent_id: target.id,
							enable_per_variation_shipping: false,
							calculation_mode: 'per_line',
							fallback_cost: '',
							rules: [],
						};
						return (
							<PanelBody
								key={ variation.id }
								title={ variation.name }
								initialOpen={ false }
							>
								<VStack spacing={ 5 }>
									<ToggleControl
										__nextHasNoMarginBottom
										label={ __(
											'Enable Per Variation Shipping',
											'syzenlabs-per-product-shipping-for-woocommerce'
										) }
										help={
											record.enable_per_variation_shipping
												? __(
														'This variation is a complete override and never falls back to the parent.',
														'syzenlabs-per-product-shipping-for-woocommerce'
												  )
												: __(
														'This variation follows the parent rates.',
														'syzenlabs-per-product-shipping-for-woocommerce'
												  )
										}
										checked={
											!! record.enable_per_variation_shipping
										}
										onChange={ (
											enable_per_variation_shipping
										) =>
											onChange(
												updateRecord(
													family,
													'variation',
													variation.id,
													{
														...record,
														parent_id: target.id,
														enable_per_variation_shipping,
													}
												)
											)
										}
									/>
									{ record.enable_per_variation_shipping && (
										<RateFields
											record={ record }
											onChange={ ( patch ) =>
												onChange(
													updateRecord(
														family,
														'variation',
														variation.id,
														patch
													)
												)
											}
										/>
									) }
								</VStack>
							</PanelBody>
						);
					} ) }
				</Panel>
			) }
		</VStack>
	);
};
