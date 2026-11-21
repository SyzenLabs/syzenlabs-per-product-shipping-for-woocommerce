import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const merge = extendTailwindMerge( { prefix: 'tw-' } );
export function cn( ...inputs ) {
	return merge( clsx( inputs ) );
}

export function portalRoot() {
	return document.getElementById( 'syzepps-dashboard-wrap' );
}
