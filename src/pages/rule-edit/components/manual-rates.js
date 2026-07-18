import { useState } from '@wordpress/element';
import {
	Button,
	Tooltip,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import { dragHandle, plus, trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const emptyRule = () => ( {
	id: `rule_${ Date.now() }_${ Math.random().toString( 36 ).slice( 2 ) }`,
	country: '',
	state: '',
	city: '',
	postcode: '',
	line_cost: '',
	item_cost: '',
} );

export const DestinationRates = ( {
	value = [],
	legacyMode = 'per_line',
	onChange,
} ) => {
	const [ dragging, setDragging ] = useState( null );
	const [ over, setOver ] = useState( null );
	const update = ( index, field, next ) =>
		onChange(
			value.map( ( row, rowIndex ) =>
				rowIndex === index ? { ...row, [ field ]: next } : row
			)
		);
	const drop = ( index ) => {
		if ( dragging === null || dragging === index ) {
			setDragging( null );
			setOver( null );
			return;
		}
		const rows = [ ...value ];
		const [ row ] = rows.splice( dragging, 1 );
		rows.splice( index, 0, row );
		onChange( rows );
		setDragging( null );
		setOver( null );
	};
	return (
		<div className="syzepps-destination-rates">
			<div className="syzepps-table-scroll">
				<table
					style={ {
						width: '100%',
					} }
				>
					<thead>
						<tr>
							<th>
								{ __(
									'Order',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</th>
							<th>
								{ __(
									'Country',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</th>
							<th>
								{ __(
									'State',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</th>
							<th>
								{ __(
									'City',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</th>
							<th>
								{ __(
									'Postcode',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</th>
							<th>
								{ __(
									'Line cost',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</th>
							<th>
								{ __(
									'Item cost',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</th>
							<th>
								<span className="screen-reader-text">
									{ __(
										'Actions',
										'syzenlabs-per-product-shipping-for-woocommerce'
									) }
								</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{ value.map( ( row, index ) => (
							<tr
								key={ row.id }
								className={
									over === index ? 'is-drop-target' : ''
								}
								onDragOver={ ( event ) => {
									event.preventDefault();
									setOver( index );
								} }
								onDrop={ () => drop( index ) }
							>
								<td>
									<Tooltip
										text={ __(
											'Drag to reorder',
											'syzenlabs-per-product-shipping-for-woocommerce'
										) }
									>
										<Button
											icon={ dragHandle }
											label={ __(
												'Drag destination row',
												'syzenlabs-per-product-shipping-for-woocommerce'
											) }
											draggable
											onDragStart={ () =>
												setDragging( index )
											}
											onDragEnd={ () => {
												setDragging( null );
												setOver( null );
											} }
										/>
									</Tooltip>
								</td>
								{ [
									'country',
									'state',
									'city',
									'postcode',
									'line_cost',
									'item_cost',
								].map( ( field ) => {
									const isCost = [
										'line_cost',
										'item_cost',
									].includes( field );
									return (
										<td key={ field }>
											<InputControl
												__next40pxDefaultSize
												__nextHasNoMarginBottom
												hideLabelFromVision
												label={ field }
												type={
													isCost ? 'number' : 'text'
												}
												min={ isCost ? 0 : undefined }
												step={
													isCost ? '0.01' : undefined
												}
												value={
													row[ field ] ??
													( row.cost !== undefined &&
													( ( field === 'item_cost' &&
														legacyMode ===
															'per_item' ) ||
														( field ===
															'line_cost' &&
															legacyMode !==
																'per_item' ) )
														? row.cost
														: '' )
												}
												onChange={ ( next ) =>
													update( index, field, next )
												}
											/>
										</td>
									);
								} ) }
								<td>
									<Button
										icon={ trash }
										isDestructive
										label={ __(
											'Remove destination row',
											'syzenlabs-per-product-shipping-for-woocommerce'
										) }
										onClick={ () =>
											onChange(
												value.filter(
													( _, rowIndex ) =>
														rowIndex !== index
												)
											)
										}
									/>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
			<Button
				variant="secondary"
				icon={ plus }
				onClick={ () => onChange( [ ...value, emptyRule() ] ) }
				style={ {
					width: 'fit-content',
				} }
			>
				{ __(
					'Add destination rate',
					'syzenlabs-per-product-shipping-for-woocommerce'
				) }
			</Button>
		</div>
	);
};
