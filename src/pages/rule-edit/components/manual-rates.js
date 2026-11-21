import { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Input } from '@/components/ui';
import { costValue, moveRow, updateDestination } from '@/lib/rules';

const columns = [
	[
		'country',
		__( 'Country', 'syzenlabs-per-product-shipping' ),
		'US',
	],
	[
		'state',
		__( 'State', 'syzenlabs-per-product-shipping' ),
		'CA',
	],
	[
		'city',
		__( 'City', 'syzenlabs-per-product-shipping' ),
		__( 'Any city', 'syzenlabs-per-product-shipping' ),
	],
	[
		'postcode',
		__( 'Postcode', 'syzenlabs-per-product-shipping' ),
		'90*',
	],
	[
		'line_cost',
		__( 'Line cost', 'syzenlabs-per-product-shipping' ),
		'0.00',
	],
	[
		'item_cost',
		__( 'Item cost', 'syzenlabs-per-product-shipping' ),
		'0.00',
	],
];

export function DestinationRates( {
	value = [],
	legacyMode = 'per_line',
	onChange,
} ) {
	const [ dragging, setDragging ] = useState( null );
	const [ over, setOver ] = useState( null );
	const [ announcement, setAnnouncement ] = useState( '' );
	const reorder = ( from, to ) => {
		onChange( moveRow( value, from, to ) );
		setAnnouncement(
			sprintf(
				/* translators: %d: destination priority number. */
				__(
					'Destination moved to priority %d.',
					'syzenlabs-per-product-shipping'
				),
				to + 1
			)
		);
	};
	const update = ( index, field, next ) =>
		onChange(
			value.map( ( row, rowIndex ) =>
				rowIndex === index
					? updateDestination( row, field, next, legacyMode )
					: row
			)
		);
	const addRow = () =>
		onChange( [
			...value,
			{
				id: `rule_${ Date.now() }_${ Math.random()
					.toString( 36 )
					.slice( 2 ) }`,
				country: '',
				state: '',
				city: '',
				postcode: '',
				line_cost: '',
				item_cost: '',
			},
		] );
	return (
		<div className="sp-destinations">
			<div className="sp-section-heading">
				<div>
					<h3>
						{ __(
							'Destination rates',
							'syzenlabs-per-product-shipping'
						) }
					</h3>
					{ value.length > 1 && (
						<p>
							{ __(
								'The first match wins. List specific destinations first.',
								'syzenlabs-per-product-shipping'
							) }
						</p>
					) }
				</div>
				<Button variant="outline" size="sm" onClick={ addRow }>
					<Plus />
					{ __(
						'Add destination',
						'syzenlabs-per-product-shipping'
					) }
				</Button>
			</div>
			{ value.length > 0 && (
				<div className="sp-table-scroll">
					<table className="sp-table sp-rate-table">
						<thead>
							<tr>
								<th scope="col">#</th>
								{ columns.map( ( [ field, label ] ) => (
									<th scope="col" key={ field }>
										{ label }
										{ field.endsWith( 'cost' ) && (
											<small>
												{ syzeppsAdmin.currency || '' }
											</small>
										) }
									</th>
								) ) }
								<th>
									<span className="sp-sr-only">
										{ __(
											'Actions',
											'syzenlabs-per-product-shipping'
										) }
									</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{ value.map( ( row, index ) => (
								<tr
									key={ row.id || index }
									className={
										over === index ? 'sp-drop-target' : ''
									}
									onDragOver={ ( event ) => {
										if ( dragging !== null ) {
											event.preventDefault();
											setOver( index );
										}
									} }
									onDrop={ ( event ) => {
										event.preventDefault();
										if ( dragging !== null ) {
											reorder( dragging, index );
										}
										setDragging( null );
										setOver( null );
									} }
								>
									<td>
										<div className="sp-row-priority">
											<Button
												variant="ghost"
												size="icon"
												className="sp-drag-handle"
												draggable
												aria-label={ sprintf(
													/* translators: %d: destination priority number. */
													__(
														'Drag destination %d to reorder',
														'syzenlabs-per-product-shipping'
													),
													index + 1
												) }
												onDragStart={ ( event ) => {
													event.dataTransfer.setData(
														'text/plain',
														String( index )
													);
													event.dataTransfer.effectAllowed =
														'move';
													setDragging( index );
												} }
												onDragEnd={ () => {
													setDragging( null );
													setOver( null );
												} }
											>
												<GripVertical />
											</Button>
											<span>
												{ String( index + 1 ).padStart(
													2,
													'0'
												) }
											</span>
										</div>
									</td>
									{ columns.map(
										( [ field, label, placeholder ] ) => {
											const cost =
												field.endsWith( '_cost' );
											return (
												<td key={ field }>
													<Input
														aria-label={ sprintf(
															/* translators: 1: field label, 2: destination priority number. */
															__(
																'%1$s for destination %2$d',
																'syzenlabs-per-product-shipping'
															),
															label,
															index + 1
														) }
														type={
															cost
																? 'number'
																: 'text'
														}
														min={
															cost
																? '0'
																: undefined
														}
														step={
															cost
																? 'any'
																: undefined
														}
														placeholder={
															placeholder
														}
														value={
															cost
																? costValue(
																		row,
																		field,
																		legacyMode
																  )
																: row[
																		field
																  ] || ''
														}
														onChange={ ( event ) =>
															update(
																index,
																field,
																event.target
																	.value
															)
														}
													/>
												</td>
											);
										}
									) }
									<td>
										<div className="sp-row-actions">
											<Button
												variant="ghost"
												size="icon"
												disabled={ index === 0 }
												aria-label={ sprintf(
													/* translators: %d: destination priority number. */
													__(
														'Move destination %d up',
														'syzenlabs-per-product-shipping'
													),
													index + 1
												) }
												onClick={ () =>
													reorder( index, index - 1 )
												}
											>
												<ArrowUp />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												disabled={
													index === value.length - 1
												}
												aria-label={ sprintf(
													/* translators: %d: destination priority number. */
													__(
														'Move destination %d down',
														'syzenlabs-per-product-shipping'
													),
													index + 1
												) }
												onClick={ () =>
													reorder( index, index + 1 )
												}
											>
												<ArrowDown />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="sp-danger-text"
												aria-label={ sprintf(
													/* translators: %d: destination priority number. */
													__(
														'Remove destination %d',
														'syzenlabs-per-product-shipping'
													),
													index + 1
												) }
												onClick={ () =>
													onChange(
														value.filter(
															( _, rowIndex ) =>
																rowIndex !==
																index
														)
													)
												}
											>
												<Trash2 />
											</Button>
										</div>
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</div>
			) }
			<p className="sp-help">
				{ value.length
					? __(
							'Leave location fields blank to match any destination. Use country and state codes and * for postcode wildcards. Rate = line cost + (item cost × quantity).',
							'syzenlabs-per-product-shipping'
					  )
					: __(
							'No destinations configured.',
							'syzenlabs-per-product-shipping'
					  ) }
			</p>
			<span className="sp-sr-only" aria-live="polite">
				{ announcement }
			</span>
		</div>
	);
}
