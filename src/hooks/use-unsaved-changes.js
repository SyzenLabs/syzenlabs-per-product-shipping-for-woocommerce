import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { usePrompt } from '@/context/prompt-context';

export function useUnsavedChanges(
	dirty,
	{ busy = false, allowNavigation } = {}
) {
	const { confirm } = usePrompt();
	const blocker = useBlocker(
		() => ! allowNavigation?.current && ( dirty || busy )
	);
	useEffect( () => {
		const warn = ( event ) => {
			if ( dirty || busy ) {
				event.preventDefault();
				event.returnValue = '';
			}
		};
		window.addEventListener( 'beforeunload', warn );
		return () => window.removeEventListener( 'beforeunload', warn );
	}, [ dirty, busy ] );
	// React Router publishes an external navigation state; it is not derived UI state.
	/* eslint-disable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-ref-to-parent */
	useEffect( () => {
		if ( blocker.state !== 'blocked' ) {
			return;
		}
		if ( busy ) {
			blocker.reset();
			return;
		}
		confirm( {
			title: __(
				'Leave without saving?',
				'syzenlabs-per-product-shipping'
			),
			message: __(
				'Your changes have not been saved. Stay here to keep editing, or discard them and leave.',
				'syzenlabs-per-product-shipping'
			),
			destructive: true,
			confirmLabel: __(
				'Discard changes',
				'syzenlabs-per-product-shipping'
			),
		} ).then( ( leave ) =>
			leave ? blocker.proceed() : blocker.reset()
		);
	}, [ blocker, busy, confirm ] );
	/* eslint-enable react-you-might-not-need-an-effect/no-event-handler, react-you-might-not-need-an-effect/no-pass-ref-to-parent */
}
