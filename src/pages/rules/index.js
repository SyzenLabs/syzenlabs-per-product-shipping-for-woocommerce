import { useRef, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
	ArrowDownToLine,
	ArrowUpFromLine,
	Plus,
	Search,
	SlidersHorizontal,
	Trash2,
	X,
} from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Input, Notice, Select } from '@/components/ui';
import { useResource, useDebouncedValue } from '@/hooks/use-resource';
import { usePrompt } from '@/context/prompt-context';
import { useToast } from '@/context/toast-context';
import { ImportDialog } from './import-dialog';
import { RulesContent } from './rules-table';

export function Rules() {
	const [ params, setParams ] = useSearchParams();
	const navigate = useNavigate();
	const search = params.get( 'search' ) || '';
	const type = [ 'simple', 'variable' ].includes( params.get( 'type' ) )
		? params.get( 'type' )
		: 'all';
	const requestedPage = Number( params.get( 'page' ) );
	const page =
		Number.isSafeInteger( requestedPage ) && requestedPage > 0
			? requestedPage
			: 1;
	const perPage = [ 10, 20, 50 ].includes(
		Number( params.get( 'per_page' ) )
	)
		? Number( params.get( 'per_page' ) )
		: 10;
	const debouncedSearch = useDebouncedValue( search );
	const query = new URLSearchParams( {
		page,
		per_page: perPage,
		search: debouncedSearch,
		filters: JSON.stringify(
			type === 'all'
				? []
				: [ { field: 'type', operator: 'is', value: type } ]
		),
	} );
	const { data, loading, error, reload } = useResource(
		`/syzepps/v1/rules?${ query }`
	);
	const items = data?.items || [];
	const total = data?.pagination.totalItems ?? 0;
	const totalPages = data?.pagination.totalPages || 1;
	const [ selection, setSelection ] = useState( { key: '', ids: [] } );
	const selectionKey = `${ page }:${ perPage }:${ search }:${ type }`;
	const selected = selection.key === selectionKey ? selection.ids : [];
	const [ importOpen, setImportOpen ] = useState( false );
	const [ deleting, setDeleting ] = useState( false );
	const [ exporting, setExporting ] = useState( false );
	const [ actionError, setActionError ] = useState( '' );
	const mutation = useRef( false );
	const { confirm } = usePrompt();
	const { showToast } = useToast();
	const filtered = !! search || type !== 'all';
	const updateParams = ( changes ) => {
		const next = new URLSearchParams( params );
		Object.entries( changes ).forEach( ( [ key, value ] ) =>
			value ? next.set( key, value ) : next.delete( key )
		);
		setParams( next, { replace: true } );
	};
	const setSelected = ( ids ) => setSelection( { key: selectionKey, ids } );
	const remove = async ( ids ) => {
		if (
			mutation.current ||
			! ( await confirm( {
				title: __(
					'Delete shipping rules?',
					'syzenlabs-per-product-shipping'
				),
				message: sprintf(
					/* translators: %d: product family count. */
					__(
						'This removes the rules and variation overrides for %d product(s). Your products will stay in WooCommerce.',
						'syzenlabs-per-product-shipping'
					),
					ids.length
				),
				destructive: true,
				confirmLabel: __(
					'Delete rules',
					'syzenlabs-per-product-shipping'
				),
			} ) )
		) {
			return;
		}
		mutation.current = true;
		setDeleting( true );
		setActionError( '' );
		try {
			const results = await Promise.allSettled(
				ids.map( ( id ) =>
					apiFetch( {
						path: `/syzepps/v1/rules/${ id }`,
						method: 'DELETE',
					} )
				)
			);
			const failed = results.filter(
				( result ) => result.status === 'rejected'
			);
			setSelected( [] );
			if ( failed.length ) {
				setActionError( failed[ 0 ].reason.message );
			}
			if ( results.length > failed.length ) {
				showToast(
					__(
						'Shipping rules deleted.',
						'syzenlabs-per-product-shipping'
					)
				);
			}
			if ( page > 1 && ids.length >= items.length ) {
				updateParams( { page: page - 1 } );
			} else {
				reload();
			}
		} finally {
			mutation.current = false;
			setDeleting( false );
		}
	};
	const exportRules = async () => {
		if ( exporting ) {
			return;
		}
		setExporting( true );
		setActionError( '' );
		try {
			const exportQuery = new URLSearchParams();
			selected.forEach( ( id ) =>
				exportQuery.append( 'product_ids[]', id )
			);
			const result = await apiFetch( {
				path: `/syzepps/v1/rules/export?${ exportQuery }`,
			} );
			const url = URL.createObjectURL(
				new Blob( [ result.csv ], { type: 'text/csv;charset=utf-8' } )
			);
			const link = document.createElement( 'a' );
			link.href = url;
			link.download = result.filename;
			document.body.appendChild( link );
			link.click();
			link.remove();
			setTimeout( () => URL.revokeObjectURL( url ), 1000 );
			showToast(
				__(
					'Your CSV export is ready.',
					'syzenlabs-per-product-shipping'
				)
			);
		} catch ( issue ) {
			setActionError( issue.message );
		} finally {
			setExporting( false );
		}
	};
	return (
		<div className="sp-page">
			<div className="sp-page-heading">
				<h1 tabIndex={ -1 }>
					{ __(
						'Shipping rules',
						'syzenlabs-per-product-shipping'
					) }
				</h1>
				<Button asChild>
					<Link to="/rule-add">
						<Plus />
						{ __(
							'Create rule',
							'syzenlabs-per-product-shipping'
						) }
					</Link>
				</Button>
			</div>
			{ actionError && <Notice>{ actionError }</Notice> }
			<section
				className="sp-panel sp-rules-panel"
				aria-label={ __(
					'Product shipping rules',
					'syzenlabs-per-product-shipping'
				) }
			>
				<div className="sp-panel-heading">
					<div className="sp-panel-title">
						<h2>
							{ __(
								'Product rules',
								'syzenlabs-per-product-shipping'
							) }
						</h2>
						{ ! loading && ! error && <Badge>{ total }</Badge> }
					</div>
					<div className="sp-actions">
						<Button
							variant="outline"
							size="sm"
							onClick={ () => setImportOpen( true ) }
						>
							<ArrowUpFromLine />
							{ __(
								'Import CSV',
								'syzenlabs-per-product-shipping'
							) }
						</Button>
						<Button
							variant="outline"
							size="sm"
							busy={ exporting }
							onClick={ exportRules }
						>
							{ ! exporting && <ArrowDownToLine /> }
							{ selected.length
								? __(
										'Export selected',
										'syzenlabs-per-product-shipping'
								  )
								: __(
										'Export all',
										'syzenlabs-per-product-shipping'
								  ) }
						</Button>
					</div>
				</div>
				<div className="sp-table-toolbar">
					<div className="sp-search">
						<Search aria-hidden="true" />
						<Input
							type="search"
							value={ search }
							onChange={ ( event ) =>
								updateParams( {
									search: event.target.value,
									page: '',
								} )
							}
							placeholder={ __(
								'Search by product name, SKU, or ID…',
								'syzenlabs-per-product-shipping'
							) }
							aria-label={ __(
								'Search rules',
								'syzenlabs-per-product-shipping'
							) }
						/>
					</div>
					<div className="sp-filter">
						<SlidersHorizontal aria-hidden="true" />
						<Select
							value={ type }
							onValueChange={ ( value ) =>
								updateParams( {
									type: value === 'all' ? '' : value,
									page: '',
								} )
							}
							label={ __(
								'Product type',
								'syzenlabs-per-product-shipping'
							) }
							options={ [
								{
									value: 'all',
									label: __(
										'All product types',
										'syzenlabs-per-product-shipping'
									),
								},
								{
									value: 'simple',
									label: __(
										'Simple products',
										'syzenlabs-per-product-shipping'
									),
								},
								{
									value: 'variable',
									label: __(
										'Variable products',
										'syzenlabs-per-product-shipping'
									),
								},
							] }
						/>
					</div>
				</div>
				{ selected.length > 0 && (
					<div className="sp-selection-bar">
						<span>
							{ sprintf(
								/* translators: %d: selected product count. */
								__(
									'%d selected',
									'syzenlabs-per-product-shipping'
								),
								selected.length
							) }
						</span>
						<Button
							size="sm"
							variant="ghost"
							onClick={ () => setSelected( [] ) }
						>
							<X />
							{ __(
								'Clear',
								'syzenlabs-per-product-shipping'
							) }
						</Button>
						<Button
							size="sm"
							variant="ghost"
							busy={ deleting }
							onClick={ () => remove( selected ) }
							className="sp-danger-text"
						>
							<Trash2 />
							{ __(
								'Delete selected',
								'syzenlabs-per-product-shipping'
							) }
						</Button>
					</div>
				) }
				<RulesContent
					error={ error }
					reload={ reload }
					loading={ loading }
					items={ items }
					filtered={ filtered }
					onClear={ () => setParams( {}, { replace: true } ) }
					onCreate={ () => navigate( '/rule-add' ) }
					selected={ selected }
					setSelected={ setSelected }
					deleting={ deleting }
					remove={ remove }
					page={ page }
					perPage={ perPage }
					total={ total }
					totalPages={ totalPages }
					updateParams={ updateParams }
				/>
			</section>
			<ImportDialog
				key={ importOpen ? 'open' : 'closed' }
				open={ importOpen }
				onOpenChange={ setImportOpen }
				onImported={ reload }
			/>
		</div>
	);
}
