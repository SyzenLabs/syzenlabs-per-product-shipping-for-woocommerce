import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import {
	Badge,
	Button,
	Checkbox,
	EmptyState,
	Notice,
	Select,
	Skeleton,
} from '@/components/ui';
import { RuleActions } from './rule-actions';

export function RulesContent( {
	error,
	reload,
	loading,
	items,
	filtered,
	onClear,
	onCreate,
	...props
} ) {
	if ( error ) {
		return (
			<div className="sp-panel-body">
				<Notice retry={ reload }>{ error.message }</Notice>
			</div>
		);
	}
	if ( loading ) {
		return <Skeleton rows={ 5 } />;
	}
	if ( ! items.length ) {
		return (
			<EmptyState
				filtered={ filtered }
				title={
					filtered
						? __(
								'No matching products',
								'syzenlabs-per-product-shipping'
						  )
						: __(
								'No shipping rules yet',
								'syzenlabs-per-product-shipping'
						  )
				}
				action={
					filtered
						? __(
								'Clear filters',
								'syzenlabs-per-product-shipping'
						  )
						: __(
								'Create your first rule',
								'syzenlabs-per-product-shipping'
						  )
				}
				onAction={ filtered ? onClear : onCreate }
			/>
		);
	}
	return <RulesTable items={ items } { ...props } />;
}

function RulesTable( {
	items,
	selected,
	setSelected,
	deleting,
	remove,
	page,
	perPage,
	total,
	totalPages,
	updateParams,
} ) {
	const allSelected = items.every( ( item ) => selected.includes( item.id ) );
	return (
		<>
			<div className="sp-table-scroll">
				<table className="sp-table">
					<thead>
						<tr>
							<th className="sp-check-cell">
								<Checkbox
									aria-label={ __(
										'Select all rules on this page',
										'syzenlabs-per-product-shipping'
									) }
									checked={
										allSelected ||
										( selected.length
											? 'indeterminate'
											: false )
									}
									onCheckedChange={ ( checked ) =>
										setSelected(
											checked
												? items.map(
														( item ) => item.id
												  )
												: []
										)
									}
									disabled={ deleting }
								/>
							</th>
							<th scope="col">
								{ __(
									'PRODUCT',
									'syzenlabs-per-product-shipping'
								) }
							</th>
							<th scope="col">
								{ __(
									'PRODUCT TYPE',
									'syzenlabs-per-product-shipping'
								) }
							</th>
							<th scope="col">
								{ __(
									'SHIPPING CLASS',
									'syzenlabs-per-product-shipping'
								) }
							</th>
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
						{ items.map( ( item ) => (
							<tr
								key={ item.id }
								data-selected={ selected.includes( item.id ) }
							>
								<td className="sp-check-cell">
									<Checkbox
										aria-label={
											__(
												'Select',
												'syzenlabs-per-product-shipping'
											) +
											' ' +
											item.name
										}
										checked={ selected.includes( item.id ) }
										disabled={ deleting }
										onCheckedChange={ ( checked ) =>
											setSelected(
												checked
													? [ ...selected, item.id ]
													: selected.filter(
															( id ) =>
																id !== item.id
													  )
											)
										}
									/>
								</td>
								<td>
									<Link
										className="sp-product"
										to={ `/rule-edit/${ item.id }` }
									>
										<span
											className={ `sp-product-avatar sp-avatar-${
												item.id % 4
											}` }
											aria-hidden="true"
										>
											{ item.name
												.slice( 0, 1 )
												.toUpperCase() }
										</span>
										<span>
											<strong>{ item.name }</strong>
											<small>
												{ item.sku || `#${ item.id }` }
												{ item.sku && (
													<span> · #{ item.id }</span>
												) }
											</small>
										</span>
									</Link>
								</td>
								<td>
									<Badge
										tone={
											item.type === 'variable'
												? 'teal'
												: 'neutral'
										}
									>
										{ item.type === 'variable'
											? __(
													'Variable',
													'syzenlabs-per-product-shipping'
											  )
											: __(
													'Simple',
													'syzenlabs-per-product-shipping'
											  ) }
									</Badge>
								</td>
								<td className="sp-muted">
									{ item.shippingClass ||
										__(
											'No shipping class',
											'syzenlabs-per-product-shipping'
										) }
								</td>
								<td>
									<RuleActions
										item={ item }
										onDelete={ remove }
										disabled={ deleting }
									/>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
			<div className="sp-pagination">
				<span>
					{ sprintf(
						/* translators: 1: first product number, 2: last product number, 3: total product count. */
						__(
							'Showing %1$d–%2$d of %3$d products',
							'syzenlabs-per-product-shipping'
						),
						( page - 1 ) * perPage + 1,
						Math.min( page * perPage, total ),
						total
					) }
				</span>
				<div className="sp-pagination-controls">
					<Select
						value={ String( perPage ) }
						onValueChange={ ( value ) =>
							updateParams( {
								per_page: value,
								page: '',
							} )
						}
						label={ __(
							'Rows per page',
							'syzenlabs-per-product-shipping'
						) }
						options={ [ 10, 20, 50 ].map( ( value ) => ( {
							value: String( value ),
							label: sprintf(
								/* translators: %d: number of products per page. */
								__(
									'%d / page',
									'syzenlabs-per-product-shipping'
								),
								value
							),
						} ) ) }
					/>
					<span>
						{ page } / { totalPages }
					</span>
					<Button
						variant="outline"
						size="icon"
						disabled={ page <= 1 }
						aria-label={ __(
							'Previous page',
							'syzenlabs-per-product-shipping'
						) }
						onClick={ () => updateParams( { page: page - 1 } ) }
					>
						<ChevronLeft />
					</Button>
					<Button
						variant="outline"
						size="icon"
						disabled={ page >= totalPages }
						aria-label={ __(
							'Next page',
							'syzenlabs-per-product-shipping'
						) }
						onClick={ () => updateParams( { page: page + 1 } ) }
					>
						<ChevronRight />
					</Button>
				</div>
			</div>
		</>
	);
}
