import { AlertCircle, ArrowRight, PackageOpen, RefreshCw } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Button } from './button';

export function Notice( { children, retry, tone = 'error' } ) {
	return (
		<div
			className={ `sp-notice sp-notice-${ tone }` }
			role={ tone === 'error' ? 'alert' : 'status' }
		>
			<AlertCircle aria-hidden="true" />
			<div>{ children }</div>
			{ retry && (
				<Button variant="ghost" size="sm" onClick={ retry }>
					<RefreshCw />
					{ __(
						'Try again',
						'syzenlabs-per-product-shipping'
					) }
				</Button>
			) }
		</div>
	);
}

export function Skeleton( { rows = 4 } ) {
	return (
		<div
			className="sp-skeleton-stack"
			role="status"
			aria-label={ __(
				'Loading',
				'syzenlabs-per-product-shipping'
			) }
		>
			{ Array.from( { length: rows }, ( _, index ) => (
				<div key={ index } className="sp-skeleton" />
			) ) }
		</div>
	);
}

export function EmptyState( { title, action, onAction, filtered = false } ) {
	return (
		<div className="sp-empty">
			<div className="sp-empty-icon">
				<PackageOpen aria-hidden="true" />
			</div>
			<h2>{ title }</h2>
			{ action && (
				<Button
					variant={ filtered ? 'outline' : 'default' }
					onClick={ onAction }
				>
					{ action }
					<ArrowRight />
				</Button>
			) }
		</div>
	);
}

export function Badge( { children, tone = 'neutral' } ) {
	return (
		<span className={ `sp-badge sp-badge-${ tone }` }>{ children }</span>
	);
}
