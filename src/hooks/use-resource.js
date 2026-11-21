import { useCallback, useEffect, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';

// Remote state is keyed by path; aborted/out-of-order responses never replace it.
export function useResource( path ) {
	const [ revision, setRevision ] = useState( 0 );
	const [ result, setResult ] = useState( {
		path: null,
		data: null,
		error: null,
		loading: true,
	} );
	useEffect( () => {
		if ( ! path ) {
			return;
		}
		const controller = new AbortController();
		setResult( ( previous ) => ( {
			...previous,
			path,
			error: null,
			loading: true,
		} ) );
		apiFetch( { path, signal: controller.signal } )
			.then( ( data ) => {
				if ( ! controller.signal.aborted ) {
					setResult( { path, data, error: null, loading: false } );
				}
			} )
			.catch( ( error ) => {
				if ( ! controller.signal.aborted ) {
					setResult( { path, data: null, error, loading: false } );
				}
			} );
		return () => controller.abort();
	}, [ path, revision ] );
	const reload = useCallback(
		() => setRevision( ( value ) => value + 1 ),
		[]
	);
	return {
		...result,
		loading: result.loading || result.path !== path,
		reload,
	};
}

export function useDebouncedValue( value, delay = 250 ) {
	const [ debounced, setDebounced ] = useState( value );
	useEffect( () => {
		const timer = setTimeout( () => setDebounced( value ), delay );
		return () => clearTimeout( timer );
	}, [ value, delay ] );
	return debounced;
}
