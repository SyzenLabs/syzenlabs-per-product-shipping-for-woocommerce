export const SyzeppsBadge = ( { children, intent = 'default' } ) => (
	<span className={ `syzepps-badge is-${ intent }` }>{ children }</span>
);
