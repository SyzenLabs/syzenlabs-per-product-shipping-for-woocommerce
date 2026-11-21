import { useState } from 'react';
import { ChevronRight, Package, Search } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Button, Input, Notice, Skeleton } from '@/components/ui';
import { useDebouncedValue, useResource } from '@/hooks/use-resource';

export function ProductPicker( { onSelect, disabled } ) {
	const [ search, setSearch ] = useState( '' );
	const query = useDebouncedValue( search );
	const { data, error, loading, reload } = useResource(
		`/syzepps/v1/products?per_page=20&search=${ encodeURIComponent(
			query
		) }`
	);
	return (
		<section className="sp-panel sp-product-picker">
			<div className="sp-panel-heading">
				<div className="sp-panel-title">
					<Package />
					<h2>
						{ __(
							'Choose a product',
							'syzenlabs-per-product-shipping'
						) }
					</h2>
				</div>
			</div>
			<div className="sp-panel-body">
				<div className="sp-search">
					<Search />
					<Input
						type="search"
						value={ search }
						disabled={ disabled }
						onChange={ ( event ) =>
							setSearch( event.target.value )
						}
						aria-label={ __(
							'Search products',
							'syzenlabs-per-product-shipping'
						) }
						placeholder={ __(
							'Search products by name, SKU, or ID…',
							'syzenlabs-per-product-shipping'
						) }
					/>
				</div>
				<ProductSearchResults
					data={ data }
					error={ error }
					loading={ loading }
					reload={ reload }
					disabled={ disabled }
					onSelect={ onSelect }
				/>
			</div>
		</section>
	);
}

function ProductSearchResults( {
	data,
	error,
	loading,
	reload,
	disabled,
	onSelect,
} ) {
	if ( error ) {
		return <Notice retry={ reload }>{ error.message }</Notice>;
	}
	if ( loading ) {
		return <Skeleton rows={ 3 } />;
	}
	if ( ! data?.items.length ) {
		return (
			<p className="sp-no-results" role="status">
				{ __(
					'No eligible products found. Try a different name or SKU.',
					'syzenlabs-per-product-shipping'
				) }
			</p>
		);
	}
	return (
		<ul
			className="sp-product-options"
			aria-label={ __(
				'Product search results',
				'syzenlabs-per-product-shipping'
			) }
		>
			{ data.items.map( ( item ) => (
				<li key={ item.id }>
					<Button
						variant="ghost"
						className="sp-product-option"
						disabled={ disabled }
						onClick={ () => onSelect( item.id ) }
					>
						<span
							className={ `sp-product-avatar sp-avatar-${
								item.id % 4
							}` }
							aria-hidden="true"
						>
							{ item.name.slice( 0, 1 ) }
						</span>
						<span>
							<strong>{ item.name }</strong>
							<small>
								{ item.sku || `#${ item.id }` } ·{ ' ' }
								{ item.type === 'variable'
									? __(
											'Variable product',
											'syzenlabs-per-product-shipping'
									  )
									: __(
											'Simple product',
											'syzenlabs-per-product-shipping'
									  ) }
							</small>
						</span>
						<ChevronRight />
					</Button>
				</li>
			) ) }
		</ul>
	);
}
