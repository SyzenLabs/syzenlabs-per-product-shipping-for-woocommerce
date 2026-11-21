import { useRef, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CircleCheck, Package, Save } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Notice, Skeleton } from '@/components/ui';
import { useResource } from '@/hooks/use-resource';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { usePrompt } from '@/context/prompt-context';
import { useToast } from '@/context/toast-context';
import { emptyFamily, validateFamily } from '@/lib/rules';
import { ProductFamilyForm } from './components/section-shipping-method';
import { ProductPicker } from './product-picker';

function EditorForm( { productId, initial } ) {
	const navigate = useNavigate();
	const { confirm } = usePrompt();
	const { showToast } = useToast();
	const [ target, setTarget ] = useState( initial?.target || null );
	const [ family, setFamily ] = useState( () =>
		initial
			? { product: initial.product, variations: initial.variations || {} }
			: emptyFamily()
	);
	const [ savedFamily, setSavedFamily ] = useState( () =>
		JSON.stringify(
			initial
				? {
						product: initial.product,
						variations: initial.variations || {},
				  }
				: emptyFamily()
		)
	);
	const [ saving, setSaving ] = useState( false );
	const [ selecting, setSelecting ] = useState( false );
	const [ error, setError ] = useState( '' );
	const [ saved, setSaved ] = useState( false );
	const lock = useRef( false );
	const allowNavigation = useRef( false );
	const dirty =
		( ! productId && !! target ) ||
		JSON.stringify( family ) !== savedFamily;
	const validation = validateFamily( family );
	useUnsavedChanges( dirty, { busy: saving, allowNavigation } );
	const selectProduct = async ( id ) => {
		if ( lock.current ) {
			return;
		}
		lock.current = true;
		setSelecting( true );
		setError( '' );
		try {
			const product = await apiFetch( {
				path: `/syzepps/v1/products/${ id }`,
			} );
			setTarget( product );
			setFamily( emptyFamily() );
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			lock.current = false;
			setSelecting( false );
		}
	};
	const save = async () => {
		if ( lock.current || ! target ) {
			return;
		}
		if ( validation ) {
			setError(
				validation === 'fallback'
					? __(
							'Fallback costs must be zero or a positive number.',
							'syzenlabs-per-product-shipping'
					  )
					: __(
							'Every destination needs a valid line or item cost. Use zero for a free rate.',
							'syzenlabs-per-product-shipping'
					  )
			);
			return;
		}
		lock.current = true;
		setSaving( true );
		setError( '' );
		try {
			await apiFetch( {
				path: productId
					? `/syzepps/v1/rules/${ productId }`
					: '/syzepps/v1/rules',
				method: productId ? 'PUT' : 'POST',
				data: { product_id: target.id, ...family },
			} );
			setSavedFamily( JSON.stringify( family ) );
			setSaved( true );
			showToast(
				__(
					'Shipping rule saved.',
					'syzenlabs-per-product-shipping'
				)
			);
			if ( ! productId ) {
				allowNavigation.current = true;
				navigate( `/rule-edit/${ target.id }`, { replace: true } );
			}
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			lock.current = false;
			setSaving( false );
		}
	};
	return (
		<div className="sp-page sp-editor">
			<div className="sp-editor-topline">
				<Button
					variant="ghost"
					size="sm"
					onClick={ () => navigate( '/rules' ) }
				>
					<ArrowLeft />
					{ __(
						'All shipping rules',
						'syzenlabs-per-product-shipping'
					) }
				</Button>
				<span className="sp-save-state">
					{ dirty && (
						<>
							<span className="sp-unsaved-dot" />
							{ __(
								'Unsaved changes',
								'syzenlabs-per-product-shipping'
							) }
						</>
					) }
					{ ! dirty && ( saved || productId ) && (
						<>
							<CircleCheck />
							{ __(
								'All changes saved',
								'syzenlabs-per-product-shipping'
							) }
						</>
					) }
				</span>
			</div>
			<div className="sp-page-heading">
				<h1 tabIndex={ -1 }>
					{ productId
						? __(
								'Edit shipping rule',
								'syzenlabs-per-product-shipping'
						  )
						: __(
								'Create shipping rule',
								'syzenlabs-per-product-shipping'
						  ) }
				</h1>
				<Button
					busy={ saving }
					disabled={
						! target ||
						selecting ||
						!! validation ||
						( !! productId && ! dirty )
					}
					onClick={ save }
				>
					<Save />
					{ __(
						'Save rule',
						'syzenlabs-per-product-shipping'
					) }
				</Button>
			</div>
			{ error && <Notice>{ error }</Notice> }
			{ validation && target && (
				<Notice tone="info">
					{ validation === 'fallback'
						? __(
								'Enter a valid fallback cost or leave it empty.',
								'syzenlabs-per-product-shipping'
						  )
						: __(
								'Add a line cost or item cost to every destination. Zero is a valid free rate.',
								'syzenlabs-per-product-shipping'
						  ) }
				</Notice>
			) }
			{ ! target ? (
				<ProductPicker
					onSelect={ selectProduct }
					disabled={ selecting }
				/>
			) : (
				<>
					<section className="sp-product-summary">
						<span className="sp-product-summary-icon">
							<Package />
						</span>
						<div>
							<h2>{ target.name }</h2>
							<p>
								#{ target.id }
								{ target.sku && ` · ${ target.sku }` }
							</p>
						</div>
						<Badge tone="teal">
							{ target.type === 'variable'
								? __(
										'Variable product',
										'syzenlabs-per-product-shipping'
								  )
								: __(
										'Simple product',
										'syzenlabs-per-product-shipping'
								  ) }
						</Badge>
						{ ! productId && (
							<Button
								variant="ghost"
								size="sm"
								disabled={ saving }
								onClick={ async () => {
									if (
										! dirty ||
										( await confirm( {
											title: __(
												'Choose a different product?',
												'syzenlabs-per-product-shipping'
											),
											message: __(
												'The rates you entered will be discarded.',
												'syzenlabs-per-product-shipping'
											),
											confirmLabel: __(
												'Change product',
												'syzenlabs-per-product-shipping'
											),
											destructive: true,
										} ) )
									) {
										setTarget( null );
										setFamily( emptyFamily() );
									}
								} }
							>
								{ __(
									'Change product',
									'syzenlabs-per-product-shipping'
								) }
							</Button>
						) }
					</section>
					<fieldset className="sp-editor-fields" disabled={ saving }>
						<legend className="sp-sr-only">
							{ __(
								'Shipping configuration',
								'syzenlabs-per-product-shipping'
							) }
						</legend>
						<ProductFamilyForm
							target={ target }
							family={ family }
							onChange={ setFamily }
						/>
					</fieldset>
					<div className="sp-editor-bottom">
						<Button
							busy={ saving }
							disabled={
								!! validation || ( !! productId && ! dirty )
							}
							onClick={ save }
						>
							<Check />
							{ __(
								'Save rule',
								'syzenlabs-per-product-shipping'
							) }
						</Button>
					</div>
				</>
			) }
		</div>
	);
}

export function RuleEditor( { productId = null } ) {
	const editing = productId !== null;
	const validId = Number.isInteger( productId ) && productId > 0;
	const { data, loading, error, reload } = useResource(
		editing && validId ? `/syzepps/v1/rules/${ productId }` : null
	);
	if ( editing && ! validId ) {
		return (
			<Notice>
				{ __(
					'This product ID is invalid.',
					'syzenlabs-per-product-shipping'
				) }
			</Notice>
		);
	}
	if ( editing && error ) {
		return <Notice retry={ reload }>{ error.message }</Notice>;
	}
	if ( editing && loading ) {
		return <Skeleton rows={ 5 } />;
	}
	if ( editing && ! data?.target ) {
		return (
			<Notice>
				{ __(
					'This product is no longer available. Return to Shipping rules to remove its configuration.',
					'syzenlabs-per-product-shipping'
				) }
			</Notice>
		);
	}
	return (
		<EditorForm productId={ productId } initial={ editing ? data : null } />
	);
}
