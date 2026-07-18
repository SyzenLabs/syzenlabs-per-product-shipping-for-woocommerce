import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { DataViews } from '@wordpress/dataviews/wp';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Modal,
	Notice,
	SelectControl,
	Spinner,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FileUploader } from '@/components/ui';
import { useNav } from '@/context/nav-context';
import { usePrompt } from '@/context/prompt-context';
import { useToast } from '@/context/toast-context';

const initialView = {
	type: 'table',
	page: 1,
	perPage: 20,
	search: '',
	filters: [],
	fields: [ 'type' ],
	titleField: 'name',
	layout: { density: 'balanced' },
};

export const Rules = () => {
	const { navigate } = useNav();
	const { confirm } = usePrompt();
	const { showToast } = useToast();
	const [ view, setView ] = useState( initialView );
	const [ data, setData ] = useState( [] );
	const [ pagination, setPagination ] = useState( {
		totalItems: 0,
		totalPages: 1,
	} );
	const [ selection, setSelection ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( '' );
	const [ importOpen, setImportOpen ] = useState( false );
	const [ file, setFile ] = useState( null );
	const [ mode, setMode ] = useState( 'update' );
	const [ importResult, setImportResult ] = useState( null );
	const [ importing, setImporting ] = useState( false );

	const load = useCallback( () => {
		setLoading( true );
		setError( '' );
		const filters = encodeURIComponent(
			JSON.stringify( view.filters || [] )
		);
		apiFetch( {
			path: `/syzepps/v1/rules?page=${ view.page }&per_page=${
				view.perPage
			}&search=${ encodeURIComponent(
				view.search || ''
			) }&filters=${ filters }`,
		} )
			.then( ( response ) => {
				setData( response.items );
				setPagination( response.pagination );
			} )
			.catch( ( issue ) => setError( issue.message ) )
			.finally( () => setLoading( false ) );
	}, [ view.page, view.perPage, view.search, view.filters ] );
	useEffect( load, [ load ] );

	const fields = useMemo(
		() => [
			{
				id: 'name',
				label: __(
					'Product',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
				type: 'text',
				enableHiding: false,
				render: ( { item } ) => (
					<Button
						variant="link"
						onClick={ () => navigate( `rule-edit/${ item.id }` ) }
					>
						{ item.name }
						{ item.sku ? ` · ${ item.sku }` : '' }
					</Button>
				),
			},
			{
				id: 'type',
				label: __(
					'Product type',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
				type: 'text',
			},
		],
		[ navigate ]
	);

	const removeItems = useCallback(
		async ( items ) => {
			if (
				! ( await confirm( {
					title: __(
						'Delete selected rules?',
						'syzenlabs-per-product-shipping-for-woocommerce'
					),
					message: __(
						'Each selected product family and its variation overrides will be removed.',
						'syzenlabs-per-product-shipping-for-woocommerce'
					),
					destructive: true,
					confirmLabel: __(
						'Delete',
						'syzenlabs-per-product-shipping-for-woocommerce'
					),
				} ) )
			) {
				return;
			}
			try {
				await Promise.all(
					items.map( ( item ) =>
						apiFetch( {
							path: `/syzepps/v1/rules/${ item.id }`,
							method: 'DELETE',
						} )
					)
				);
				setSelection( [] );
				showToast(
					__(
						'Rules deleted.',
						'syzenlabs-per-product-shipping-for-woocommerce'
					)
				);
				load();
			} catch ( issue ) {
				setError( issue.message );
			}
		},
		[ confirm, load, showToast ]
	);

	const actions = useMemo(
		() => [
			{
				id: 'edit',
				label: __(
					'Edit',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
				callback: ( items ) =>
					navigate( `rule-edit/${ items[ 0 ].id }` ),
			},
			{
				id: 'delete',
				label: __(
					'Delete',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
				supportsBulk: true,
				isDestructive: true,
				callback: removeItems,
			},
		],
		[ navigate, removeItems ]
	);

	const dryRun = async () => {
		if ( ! file ) {
			return;
		}
		setImporting( true );
		setError( '' );
		const body = new FormData();
		body.append( 'file', file );
		body.append( 'mode', mode );
		try {
			setImportResult(
				await apiFetch( {
					path: '/syzepps/v1/rules/import/dry-run',
					method: 'POST',
					body,
				} )
			);
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			setImporting( false );
		}
	};

	const commitImport = async () => {
		if (
			! importResult ||
			! ( await confirm( {
				title: __(
					'Commit validated import?',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
				message: __(
					'Valid product-family records will be written atomically.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
			} ) )
		) {
			return;
		}
		setImporting( true );
		try {
			const result = await apiFetch( {
				path: '/syzepps/v1/rules/import/commit',
				method: 'POST',
				data: { token: importResult.token },
			} );
			setImportOpen( false );
			setImportResult( null );
			showToast(
				`${ result.committed } ${ __(
					'families imported.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				) }`
			);
			load();
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			setImporting( false );
		}
	};

	const exportRules = async () => {
		try {
			const query = selection.length
				? `?${ selection
						.map( ( id ) => `product_ids[]=${ id }` )
						.join( '&' ) }`
				: '';
			const result = await apiFetch( {
				path: `/syzepps/v1/rules/export${ query }`,
			} );
			const link = document.createElement( 'a' );
			link.href = URL.createObjectURL(
				new Blob( [ result.csv ], { type: 'text/csv;charset=utf-8' } )
			);
			link.download = result.filename;
			link.click();
			URL.revokeObjectURL( link.href );
			showToast(
				__(
					'CSV exported.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				)
			);
		} catch ( issue ) {
			setError( issue.message );
		}
	};

	return (
		<Card>
			<CardHeader>
				<HStack justify="space-between">
					<Heading level={ 2 }>
						{ __(
							'Rules',
							'syzenlabs-per-product-shipping-for-woocommerce'
						) }
					</Heading>
					<HStack expanded={ false }>
						<Button
							variant="secondary"
							onClick={ () => setImportOpen( true ) }
						>
							{ __(
								'Import',
								'syzenlabs-per-product-shipping-for-woocommerce'
							) }
						</Button>
						<Button variant="secondary" onClick={ exportRules }>
							{ selection.length
								? __(
										'Export selected',
										'syzenlabs-per-product-shipping-for-woocommerce'
								  )
								: __(
										'Export all',
										'syzenlabs-per-product-shipping-for-woocommerce'
								  ) }
						</Button>
						<Button
							variant="primary"
							onClick={ () => navigate( 'rule-add' ) }
						>
							{ __(
								'Add rule',
								'syzenlabs-per-product-shipping-for-woocommerce'
							) }
						</Button>
					</HStack>
				</HStack>
			</CardHeader>
			<CardBody>
				<VStack spacing={ 4 }>
					{ error && (
						<Notice
							status="error"
							isDismissible
							onRemove={ () => setError( '' ) }
						>
							{ error }
						</Notice>
					) }
					<DataViews
						actions={ actions }
						data={ data }
						fields={ fields }
						view={ view }
						onChangeView={ setView }
						paginationInfo={ pagination }
						selection={ selection }
						onChangeSelection={ setSelection }
						isLoading={ loading }
						defaultLayouts={ { table: {} } }
						empty={
							<VStack align="center">
								<span>
									{ __(
										'No product-family rules yet.',
										'syzenlabs-per-product-shipping-for-woocommerce'
									) }
								</span>

								<Button
									variant="primary"
									onClick={ () => navigate( 'rule-add' ) }
									style={ {
										width: 'fit-content',
									} }
								>
									{ __(
										'Add rule',
										'syzenlabs-per-product-shipping-for-woocommerce'
									) }
								</Button>
							</VStack>
						}
					/>
				</VStack>
			</CardBody>
			{ importOpen && (
				<Modal
					title={ __(
						'Import product rules',
						'syzenlabs-per-product-shipping-for-woocommerce'
					) }
					onRequestClose={ () => setImportOpen( false ) }
				>
					<VStack spacing={ 5 }>
						<FileUploader
							onFile={ setFile }
							disabled={ importing }
						/>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __(
								'Import mode',
								'syzenlabs-per-product-shipping-for-woocommerce'
							) }
							value={ mode }
							options={ [
								{
									label: __(
										'Update',
										'syzenlabs-per-product-shipping-for-woocommerce'
									),
									value: 'update',
								},
								{
									label: __(
										'Skip existing',
										'syzenlabs-per-product-shipping-for-woocommerce'
									),
									value: 'skip',
								},
								{
									label: __(
										'Replace target record',
										'syzenlabs-per-product-shipping-for-woocommerce'
									),
									value: 'replace',
								},
							] }
							onChange={ setMode }
						/>
						{ importResult && (
							<Notice
								status={
									importResult.summary.errors
										? 'warning'
										: 'success'
								}
								isDismissible={ false }
							>
								{ `${ importResult.summary.families } ${ __(
									'families ready',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }; ${ importResult.summary.errors } ${ __(
									'row errors',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }` }
								{ importResult.errors.map( ( item ) => (
									<div
										key={ `${ item.row }-${ item.message }` }
									>{ `${ __(
										'Row',
										'syzenlabs-per-product-shipping-for-woocommerce'
									) } ${ item.row }: ${
										item.message
									}` }</div>
								) ) }
							</Notice>
						) }
						<HStack>
							{ importing && <Spinner /> }
							<Button
								variant="secondary"
								disabled={ ! file || importing }
								onClick={ dryRun }
							>
								{ __(
									'Run dry run',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</Button>
							<Button
								variant="primary"
								disabled={ ! importResult || importing }
								onClick={ commitImport }
							>
								{ __(
									'Commit import',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }
		</Card>
	);
};
