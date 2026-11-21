import * as Collapsible from '@radix-ui/react-collapsible';
import {
	ChevronDown,
	GitBranch,
	MapPin,
	SlidersHorizontal,
} from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Input, Switch, Notice } from '@/components/ui';
import { DestinationRates } from './manual-rates';

const updateRecord = ( family, id, patch ) =>
	id
		? {
				...family,
				variations: {
					...family.variations,
					[ id ]: { ...family.variations[ id ], ...patch },
				},
		  }
		: { ...family, product: { ...family.product, ...patch } };

function RateFields( { record, onChange, scope } ) {
	return (
		<>
			{ [ 'per_order', 'per_quantity_step' ].includes(
				record.calculation_mode
			) &&
				record.rules?.some(
					( row ) =>
						row.cost !== undefined &&
						! row.line_cost &&
						! row.item_cost
				) && (
					<Notice tone="info">
						{ __(
							'These existing rates use legacy calculations. Editing a line or item cost converts that destination to line + item pricing. Location-only edits preserve the original calculation.',
							'syzenlabs-per-product-shipping'
						) }
					</Notice>
				) }
			<DestinationRates
				value={ record.rules || [] }
				legacyMode={ record.calculation_mode }
				onChange={ ( rules ) => onChange( { rules } ) }
			/>
			<div className="sp-fallback">
				<div>
					<label htmlFor={ `fallback-${ scope }` }>
						{ __(
							'Fallback cost',
							'syzenlabs-per-product-shipping'
						) }
					</label>
					<p id={ `fallback-help-${ scope }` }>
						{ __(
							'Used when no destination matches. Leave empty for no fallback.',
							'syzenlabs-per-product-shipping'
						) }
					</p>
				</div>
				<div className="sp-money-input">
					<span>{ syzeppsAdmin.currency || '' }</span>
					<Input
						id={ `fallback-${ scope }` }
						type="number"
						min="0"
						step="any"
						placeholder="0.00"
						value={ record.fallback_cost ?? '' }
						aria-describedby={ `fallback-help-${ scope }` }
						onChange={ ( event ) =>
							onChange( { fallback_cost: event.target.value } )
						}
					/>
				</div>
			</div>
		</>
	);
}

export function ProductFamilyForm( { target, family, onChange } ) {
	const product = family.product;
	return (
		<div className="sp-form-sections">
			<section className="sp-panel">
				<div className="sp-panel-heading">
					<div className="sp-panel-title">
						<MapPin />
						<h2>
							{ target.type === 'variable'
								? __(
										'Parent product rates',
										'syzenlabs-per-product-shipping'
								  )
								: __(
										'Product rates',
										'syzenlabs-per-product-shipping'
								  ) }
						</h2>
					</div>
				</div>
				<div className="sp-panel-body">
					<RateFields
						record={ product }
						scope="product"
						onChange={ ( patch ) =>
							onChange( updateRecord( family, null, patch ) )
						}
					/>
				</div>
			</section>
			<section className="sp-panel">
				<div className="sp-panel-body">
					<div className="sp-toggle-row">
						<div className="sp-toggle-icon">
							<SlidersHorizontal />
						</div>
						<div>
							<label htmlFor="sp-adjust-costs">
								{ __(
									'Adjust existing shipping methods',
									'syzenlabs-per-product-shipping'
								) }
							</label>
							<p id="sp-adjust-help">
								{ __(
									'Add these costs to eligible paid shipping methods instead of showing a separate rate.',
									'syzenlabs-per-product-shipping'
								) }
							</p>
						</div>
						<Switch
							id="sp-adjust-costs"
							checked={ !! product.adjust_shipping_costs }
							aria-describedby="sp-adjust-help"
							onCheckedChange={ ( adjust_shipping_costs ) =>
								onChange(
									updateRecord( family, null, {
										adjust_shipping_costs,
									} )
								)
							}
						/>
					</div>
				</div>
			</section>
			{ target.type === 'variable' && (
				<section className="sp-panel">
					<div className="sp-panel-heading">
						<div className="sp-panel-title">
							<GitBranch />
							<h2>
								{ __(
									'Variation overrides',
									'syzenlabs-per-product-shipping'
								) }
							</h2>
						</div>
						<Badge>{ target.variations?.length || 0 }</Badge>
					</div>
					{ target.variations?.length ? (
						target.variations.map( ( variation ) => {
							const record = family.variations[
								variation.id
							] || {
								parent_id: target.id,
								enable_per_variation_shipping: false,
								calculation_mode: 'per_line',
								quantity_step: 1,
								fallback_cost: '',
								rules: [],
							};
							const patch = ( next ) =>
								onChange(
									updateRecord(
										{
											...family,
											variations: {
												...family.variations,
												[ variation.id ]: record,
											},
										},
										variation.id,
										next
									)
								);
							return (
								<Collapsible.Root
									key={ variation.id }
									className="sp-variation"
								>
									<div className="sp-variation-heading">
										<Collapsible.Trigger asChild>
											<Button
												variant="ghost"
												className="sp-variation-trigger"
											>
												<ChevronDown />
												<span>
													<strong>
														{ variation.name }
													</strong>
													<small>
														#{ variation.id }
														{ variation.sku &&
															` · ${ variation.sku }` }
													</small>
												</span>
											</Button>
										</Collapsible.Trigger>
										<Badge
											tone={
												record.enable_per_variation_shipping
													? 'teal'
													: 'neutral'
											}
										>
											{ record.enable_per_variation_shipping
												? __(
														'Custom rates',
														'syzenlabs-per-product-shipping'
												  )
												: __(
														'Inheriting',
														'syzenlabs-per-product-shipping'
												  ) }
										</Badge>
									</div>
									<Collapsible.Content className="sp-collapsible-content">
										<div className="sp-variation-body">
											<div className="sp-toggle-row">
												<div>
													<label
														htmlFor={ `override-${ variation.id }` }
													>
														{ __(
															'Use custom rates for this variation',
															'syzenlabs-per-product-shipping'
														) }
													</label>
													<p
														id={ `override-help-${ variation.id }` }
													>
														{ __(
															'Custom rates replace all parent product rates.',
															'syzenlabs-per-product-shipping'
														) }
													</p>
												</div>
												<Switch
													id={ `override-${ variation.id }` }
													checked={
														!! record.enable_per_variation_shipping
													}
													aria-describedby={ `override-help-${ variation.id }` }
													onCheckedChange={ (
														enable_per_variation_shipping
													) =>
														patch( {
															enable_per_variation_shipping,
														} )
													}
												/>
											</div>
											{ record.enable_per_variation_shipping && (
												<RateFields
													record={ record }
													scope={ variation.id }
													onChange={ patch }
												/>
											) }
										</div>
									</Collapsible.Content>
								</Collapsible.Root>
							);
						} )
					) : (
						<p className="sp-panel-description">
							{ __(
								'No variations are available for this product.',
								'syzenlabs-per-product-shipping'
							) }
						</p>
					) }
				</section>
			) }
		</div>
	);
}
