import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';

const RuleConfigContext = createContext();

export const ShippingRuleConfigProvider = ( { children } ) => {
	const [ revision, setRevision ] = useState( 0 );
	const refreshRules = useCallback(
		() => setRevision( ( value ) => value + 1 ),
		[]
	);
	const value = useMemo(
		() => ( { revision, refreshRules } ),
		[ revision, refreshRules ]
	);
	return (
		<RuleConfigContext.Provider value={ value }>
			{ children }
		</RuleConfigContext.Provider>
	);
};

export const useShippingRuleConfig = () => useContext( RuleConfigContext );
