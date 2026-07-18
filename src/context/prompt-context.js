import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const PromptContext = createContext();

export const PromptProvider = ( { children } ) => {
	const [ prompt, setPrompt ] = useState( null );
	const resolver = useRef();

	const confirm = useCallback( ( options ) => {
		setPrompt( options );
		return new Promise( ( resolve ) => {
			resolver.current = resolve;
		} );
	}, [] );

	const close = useCallback( ( value ) => {
		setPrompt( null );
		resolver.current?.( value );
		resolver.current = null;
	}, [] );

	const value = useMemo( () => ( { confirm } ), [ confirm ] );
	return (
		<PromptContext.Provider value={ value }>
			{ children }
			{ prompt && (
				<Modal
					title={ prompt.title }
					onRequestClose={ () => close( false ) }
				>
					<VStack spacing={ 5 }>
						<div>{ prompt.message }</div>
						<div className="syzepps-prompt-actions">
							<Button
								variant="tertiary"
								onClick={ () => close( false ) }
							>
								{ __(
									'Cancel',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</Button>
							<Button
								variant="primary"
								isDestructive={ prompt.destructive }
								onClick={ () => close( true ) }
							>
								{ prompt.confirmLabel ||
									__(
										'Confirm',
										'syzenlabs-per-product-shipping-for-woocommerce'
									) }
							</Button>
						</div>
					</VStack>
				</Modal>
			) }
		</PromptContext.Provider>
	);
};

export const usePrompt = () => useContext( PromptContext );
