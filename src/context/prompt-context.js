import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	useEffect,
} from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { portalRoot } from '@/lib/utils';

const PromptContext = createContext();
export function PromptProvider( { children } ) {
	const [ prompt, setPrompt ] = useState( null );
	const resolver = useRef();
	const confirm = useCallback( ( options ) => {
		resolver.current?.( false );
		setPrompt( options );
		return new Promise( ( resolve ) => {
			resolver.current = resolve;
		} );
	}, [] );
	const close = useCallback( ( result ) => {
		resolver.current?.( result );
		resolver.current = null;
		setPrompt( null );
	}, [] );
	useEffect( () => () => resolver.current?.( false ), [] );
	const value = useMemo( () => ( { confirm } ), [ confirm ] );
	return (
		<PromptContext.Provider value={ value }>
			{ children }
			<AlertDialog.Root
				open={ !! prompt }
				onOpenChange={ ( open ) => {
					if ( ! open ) {
						close( false );
					}
				} }
			>
				<AlertDialog.Portal container={ portalRoot() }>
					<AlertDialog.Overlay className="sp-dialog-overlay" />
					<AlertDialog.Content className="sp-dialog sp-confirm">
						<div className="sp-confirm-icon">
							<AlertTriangle aria-hidden="true" />
						</div>
						<AlertDialog.Title>{ prompt?.title }</AlertDialog.Title>
						<AlertDialog.Description>
							{ prompt?.message }
						</AlertDialog.Description>
						<div className="sp-dialog-footer">
							<AlertDialog.Cancel asChild>
								<Button
									variant="outline"
									onClick={ () => close( false ) }
								>
									{ __(
										'Cancel',
										'syzenlabs-per-product-shipping'
									) }
								</Button>
							</AlertDialog.Cancel>
							<AlertDialog.Action asChild>
								<Button
									variant={
										prompt?.destructive
											? 'destructive'
											: 'default'
									}
									onClick={ () => close( true ) }
								>
									{ prompt?.confirmLabel ||
										__(
											'Confirm',
											'syzenlabs-per-product-shipping'
										) }
								</Button>
							</AlertDialog.Action>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Portal>
			</AlertDialog.Root>
		</PromptContext.Provider>
	);
}
export const usePrompt = () => useContext( PromptContext );
