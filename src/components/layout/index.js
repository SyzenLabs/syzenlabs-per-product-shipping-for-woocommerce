import { useEffect, useRef } from 'react';
import { NavLink, useLocation, useOutlet } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Layers3, Settings2, Truck } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { ShippingHelp } from './shipping-help';

export function BrandSymbol() {
	return (
		<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
			<path
				fill="#fff"
				d="M121.74 43.13 Q128.00 40.00 134.26 43.13 L195.74 73.87 Q202.00 77.00 195.88 80.39 L134.12 114.61 Q128.00 118.00 121.88 114.61 L60.12 80.39 Q54.00 77.00 60.26 73.87 Z"
			/>
			<path
				fill="#fff"
				d="M44.00 95.00 Q44.00 87.00 50.99 90.89 L116.01 127.11 Q123.00 131.00 123.00 139.00 L123.00 210.00 Q123.00 218.00 116.01 214.11 L50.99 177.89 Q44.00 174.00 44.00 166.00 Z"
			/>
			<path d="M133.00 139.00 Q133.00 131.00 139.99 127.11 L205.01 90.89 Q212.00 87.00 212.00 95.00 L212.00 166.00 Q212.00 174.00 205.01 177.89 L139.99 214.11 Q133.00 218.00 133.00 210.00 Z" />
		</svg>
	);
}

export function AppLayout() {
	const location = useLocation();
	const outlet = useOutlet();
	const reducedMotion = useReducedMotion();
	const content = useRef();
	const editing = /rule-(add|edit)/.test( location.pathname );
	useEffect( () => {
		content.current
			?.querySelector( 'h1' )
			?.focus( { preventScroll: true } );
	}, [ location.pathname ] );
	return (
		<div className="sp-app">
			<a
				className="sp-skip-link"
				href="#sp-main"
				onClick={ ( event ) => {
					event.preventDefault();
					content.current?.focus();
					content.current?.scrollIntoView( {
						behavior: reducedMotion ? 'instant' : 'smooth',
						block: 'start',
					} );
				} }
			>
				{ __(
					'Skip to content',
					'syzenlabs-per-product-shipping'
				) }
			</a>
			<header className="sp-workspace-header">
				<div className="sp-workspace-header-inner">
					<NavLink
						to="/rules"
						className="sp-brand"
						aria-label={ __(
							'Per product shipping',
							'syzenlabs-per-product-shipping'
						) }
					>
						<span className="sp-brand-symbol">
							<BrandSymbol />
						</span>
						<strong className="sp-brand-name">
							{ __(
								'Per product shipping',
								'syzenlabs-per-product-shipping'
							) }
						</strong>
					</NavLink>
					<nav
						className="sp-workspace-nav"
						aria-label={ __(
							'Plugin navigation',
							'syzenlabs-per-product-shipping'
						) }
					>
						<NavLink
							to="/rules"
							className={ ( { isActive } ) =>
								isActive || editing ? 'is-active' : ''
							}
							aria-current={ editing ? 'page' : undefined }
						>
							<Layers3 aria-hidden="true" />
							{ __(
								'Shipping rules',
								'syzenlabs-per-product-shipping'
							) }
						</NavLink>
						<NavLink
							to="/settings"
							className={ ( { isActive } ) =>
								isActive ? 'is-active' : ''
							}
						>
							<Settings2 aria-hidden="true" />
							{ __(
								'Settings',
								'syzenlabs-per-product-shipping'
							) }
						</NavLink>
						<a
							href={ syzeppsAdmin.shippingZonesUrl }
							className="sp-zones-link"
						>
							<Truck aria-hidden="true" />
							<span className="sp-zones-label">
								{ __(
									'Shipping zones',
									'syzenlabs-per-product-shipping'
								) }
							</span>
							<ArrowUpRight aria-hidden="true" />
						</a>
					</nav>
					<div className="sp-header-right">
						<ShippingHelp />
					</div>
				</div>
			</header>
			<main
				id="sp-main"
				ref={ content }
				className="sp-main"
				tabIndex={ -1 }
			>
				<motion.div
					key={ location.pathname }
					initial={ reducedMotion ? false : { opacity: 0, y: 7 } }
					animate={ { opacity: 1, y: 0 } }
					transition={ {
						duration: 0.16,
						ease: [ 0.2, 0.8, 0.2, 1 ],
					} }
				>
					{ outlet }
				</motion.div>
			</main>
			<footer className="sp-workspace-footer">
				v{ syzeppsAdmin.version || '1.0.0' }
			</footer>
		</div>
	);
}
