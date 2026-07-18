import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Notice,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { PopupLayout } from '@/components/layout';
import { Skeleton, SyzeppsSelect } from '@/components/ui';
import { useNav } from '@/context/nav-context';
import { usePrompt } from '@/context/prompt-context';
import { useToast } from '@/context/toast-context';
import { ProductFamilyForm } from './components/section-shipping-method';

const PRODUCT_SEARCH_DEBOUNCE_MS = 300;

const emptyFamily = () => ( {
	product: {
		adjust_shipping_costs: false,
		calculation_mode: 'per_line',
		quantity_step: 1,
		fallback_cost: '',
		rules: [],
	},
	variations: {},
} );

export const RuleEditor = ( { productId = null } ) => {
	const editing = !! productId;
	const { navigate } = useNav();
	const { confirm } = usePrompt();
	const { showToast } = useToast();
	const [ target, setTarget ] = useState( null );
	const [ family, setFamily ] = useState( emptyFamily );
	const [ options, setOptions ] = useState( [] );
	const [ loading, setLoading ] = useState( editing );
	const [ saving, setSaving ] = useState( false );
	const [ dirty, setDirty ] = useState( false );
	const [ error, setError ] = useState( '' );
	const productSearchTimeout = useRef();

	useEffect( () => {
		if ( ! editing ) {
			return;
		}
		apiFetch( { path: `/syzepps/v1/rules/${ productId }` } )
			.then( ( response ) => {
				setTarget( response.target );
				setFamily( {
					product: response.product,
					variations: response.variations,
				} );
			} )
			.catch( ( issue ) => setError( issue.message ) )
			.finally( () => setLoading( false ) );
	}, [ editing, productId ] );

	useEffect( () => {
		const warn = ( event ) => {
			if ( dirty ) {
				event.preventDefault();
				event.returnValue = '';
			}
		};
		window.addEventListener( 'beforeunload', warn );
		return () => window.removeEventListener( 'beforeunload', warn );
	}, [ dirty ] );

	const searchProducts = useCallback( ( search = '' ) => {
		apiFetch( {
			path: `/syzepps/v1/products?per_page=20&search=${ encodeURIComponent(
				search
			) }`,
		} )
			.then( ( response ) =>
				setOptions(
					response.items.map( ( item ) => ( {
						value: item.id,
						label: `${ item.name }${
							item.sku ? ` · ${ item.sku }` : ''
						} · #${ item.id }`,
					} ) )
				)
			)
			.catch( () => setOptions( [] ) );
	}, [] );

	const debouncedSearchProducts = useCallback(
		( search = '' ) => {
			clearTimeout( productSearchTimeout.current );
			productSearchTimeout.current = setTimeout(
				() => searchProducts( search ),
				PRODUCT_SEARCH_DEBOUNCE_MS
			);
		},
		[ searchProducts ]
	);

	// Product choices are remote data, not render-derived state.
	/* eslint-disable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-derived-state */
	useEffect( () => {
		if ( ! editing ) {
			searchProducts();
		}

		return () => clearTimeout( productSearchTimeout.current );
	}, [ editing, searchProducts ] );
	/* eslint-enable react-you-might-not-need-an-effect/no-adjust-state-on-prop-change, react-you-might-not-need-an-effect/no-derived-state */

	const selectProduct = async ( id ) => {
		if ( ! id ) {
			return;
		}
		setLoading( true );
		setError( '' );
		try {
			const selected = await apiFetch( {
				path: `/syzepps/v1/products/${ id }`,
			} );
			const next = emptyFamily();
			selected.variations?.forEach( ( variation ) => {
				next.variations[ variation.id ] = {
					parent_id: selected.id,
					enable_per_variation_shipping: false,
					calculation_mode: 'per_line',
					quantity_step: 1,
					fallback_cost: '',
					rules: [],
				};
			} );
			setTarget( selected );
			setFamily( next );
			setDirty( true );
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			setLoading( false );
		}
	};

	const validationError = useMemo( () => {
		if ( ! target ) {
			return __(
				'Select a product first.',
				'syzenlabs-per-product-shipping-for-woocommerce'
			);
		}
		const records = [
			family.product,
			...Object.values( family.variations || {} ).filter(
				( item ) => item.enable_per_variation_shipping
			),
		];
		return records.some( ( record ) =>
			record.rules?.some(
				( row ) => row.cost === '' || Number( row.cost ) < 0
			)
		)
			? __(
					'Every destination row needs a non-negative cost.',
					'syzenlabs-per-product-shipping-for-woocommerce'
			  )
			: '';
	}, [ family, target ] );

	const save = async () => {
		if ( validationError ) {
			setError( validationError );
			return;
		}
		setSaving( true );
		setError( '' );
		try {
			await apiFetch( {
				path: editing
					? `/syzepps/v1/rules/${ productId }`
					: '/syzepps/v1/rules',
				method: editing ? 'PUT' : 'POST',
				data: { product_id: target.id, ...family },
			} );
			setDirty( false );
			showToast(
				__(
					'Product-family rule saved.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				)
			);
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			setSaving( false );
		}
	};

	const leave = async () => {
		if (
			! dirty ||
			( await confirm( {
				title: __(
					'Discard changes?',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
				message: __(
					'Unsaved changes will be lost.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
				destructive: true,
				confirmLabel: __(
					'Discard',
					'syzenlabs-per-product-shipping-for-woocommerce'
				),
			} ) )
		) {
			navigate( 'rules' );
		}
	};

	return (
		<PopupLayout
			title={
				editing
					? __(
							'Edit product rule',
							'syzenlabs-per-product-shipping-for-woocommerce'
					  )
					: __(
							'Add product rule',
							'syzenlabs-per-product-shipping-for-woocommerce'
					  )
			}
			onBack={ leave }
			onSave={ save }
			saving={ saving }
			saveDisabled={ !! validationError }
		>
			{ error && (
				<Notice
					status="error"
					isDismissible
					onRemove={ () => setError( '' ) }
				>
					{ error }
				</Notice>
			) }
			{ ! editing && (
				<SyzeppsSelect
					label={ __(
						'Product',
						'syzenlabs-per-product-shipping-for-woocommerce'
					) }
					value={ target?.id }
					options={ options }
					onFilterValueChange={ debouncedSearchProducts }
					onChange={ selectProduct }
					help={ __(
						'Search simple products and variable-product parents by name, SKU, or ID.',
						'syzenlabs-per-product-shipping-for-woocommerce'
					) }
				/>
			) }
			{ loading ? (
				<Skeleton />
			) : (
				<ProductFamilyForm
					target={ target }
					family={ family }
					onChange={ ( next ) => {
						setFamily( next );
						setDirty( true );
					} }
				/>
			) }
		</PopupLayout>
	);
};

export const RuleEdit = ( { productId } ) => (
	<RuleEditor productId={ productId } />
);
