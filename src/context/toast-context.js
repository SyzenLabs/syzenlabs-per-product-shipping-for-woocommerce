import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';
import { SnackbarList } from '@wordpress/components';

const ToastContext = createContext();

export const ToastProvider = ( { children } ) => {
	const [ notices, setNotices ] = useState( [] );
	const showToast = useCallback( ( content, status = 'success' ) => {
		const id = `${ Date.now() }-${ Math.random() }`;
		setNotices( ( current ) => [ ...current, { id, content, status } ] );
	}, [] );
	const removeToast = useCallback(
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
			<div className="syzepps-toasts" aria-live="polite">
				<SnackbarList notices={ notices } onRemove={ removeToast } />
			</div>
		</ToastContext.Provider>
	);
};

export const useToast = () => useContext( ToastContext );
