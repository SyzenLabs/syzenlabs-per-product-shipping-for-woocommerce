import apiFetch from '@wordpress/api-fetch';
import { createRoot } from '@wordpress/element';
import { Notice, __experimentalVStack as VStack } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Header } from '@/components/layout';
import { NavProvider, useNav } from '@/context/nav-context';
import { PromptProvider } from '@/context/prompt-context';
import { ShippingRuleConfigProvider } from '@/context/shipping-rule-config-context';
import { ToastProvider } from '@/context/toast-context';
import { Overview } from '@/pages/overview';
import { RuleAdd } from '@/pages/rule-add';
import { RuleEdit } from '@/pages/rule-edit';
import { Rules } from '@/pages/rules';
import { Settings } from '@/pages/settings';

apiFetch.use( apiFetch.createNonceMiddleware( syzeppsAdmin.nonce ) );

const Router = () => {
	const { route } = useNav();
	if ( route === 'overview' ) {
		return <Overview />;
	}
	if ( route === 'rules' ) {
		return <Rules />;
	}
	if ( route === 'rule-add' ) {
		return <RuleAdd />;
	}
	if ( route === 'settings' ) {
		return <Settings />;
	}
	const edit = route.match( /^rule-edit\/(\d+)$/ );
	if ( edit ) {
		return <RuleEdit productId={ Number( edit[ 1 ] ) } />;
	}
	return (
		<Notice status="warning" isDismissible={ false }>
			{ __(
				'Page not found.',
				'syzenlabs-per-product-shipping-for-woocommerce'
			) }
		</Notice>
	);
};

const App = () => (
	<NavProvider>
		<ShippingRuleConfigProvider>
			<PromptProvider>
				<ToastProvider>
					<VStack className="syzepps-app" spacing={ 6 }>
						<Header />
						<main className="syzepps-page">
							<Router />
						</main>
					</VStack>
				</ToastProvider>
			</PromptProvider>
		</ShippingRuleConfigProvider>
	</NavProvider>
);

const root = document.getElementById( 'syzepps-dashboard-wrap' );
if ( root ) {
	createRoot( root ).render( <App /> );
}
