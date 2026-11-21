import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { CircleCheck, X } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';

const ToastContext = createContext();
function Toast( { notice, remove } ) {
	useEffect( () => {
		const timer = setTimeout( () => remove( notice.id ), 5000 );
		return () => clearTimeout( timer );
	}, [ notice.id, remove ] );
	return (
		<div className="sp-toast" role="status">
			<CircleCheck aria-hidden="true" />
			<span>{ notice.content }</span>
			<Button
				variant="ghost"
				size="icon"
				onClick={ () => remove( notice.id ) }
				aria-label={ __(
					'Dismiss notification',
					'syzenlabs-per-product-shipping'
				) }
			>
				<X />
			</Button>
		</div>
	);
}
export function ToastProvider( { children } ) {
	const [ notices, setNotices ] = useState( [] );
	const showToast = useCallback(
		( content ) =>
			setNotices( ( current ) => [
				...current.slice( -2 ),
				{ id: `${ Date.now() }-${ Math.random() }`, content },
			] ),
		[]
	);
	const remove = useCallback(
		( id ) =>
			setNotices( ( current ) =>
				current.filter( ( item ) => item.id !== id )
			),
		[]
	);
	const value = useMemo( () => ( { showToast } ), [ showToast ] );
	return (
		<ToastContext.Provider value={ value }>
			{ children }
			<div className="sp-toasts">
				{ notices.map( ( notice ) => (
					<Toast
						key={ notice.id }
						notice={ notice }
						remove={ remove }
					/>
				) ) }
			</div>
		</ToastContext.Provider>
	);
}
export const useToast = () => useContext( ToastContext );
