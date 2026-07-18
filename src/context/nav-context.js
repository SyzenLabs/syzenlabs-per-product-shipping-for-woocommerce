import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';

const NavContext = createContext();

const readRoute = () => window.location.hash.replace( /^#/, '' ) || 'overview';

export const NavProvider = ( { children } ) => {
	const [ route, setRoute ] = useState( readRoute );

	useEffect( () => {
		const onHashChange = () => setRoute( readRoute() );
		window.addEventListener( 'hashchange', onHashChange );
		return () => window.removeEventListener( 'hashchange', onHashChange );
	}, [] );

	const navigate = useCallback( ( next ) => {
		window.location.hash = next;
	}, [] );

	const value = useMemo( () => ( { route, navigate } ), [ route, navigate ] );
	return (
		<NavContext.Provider value={ value }>{ children }</NavContext.Provider>
	);
};

export const useNav = () => useContext( NavContext );
