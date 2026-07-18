import {
	Button,
	Card,
	CardBody,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useNav } from '@/context/nav-context';

const items = [
	[
		'overview',
		__( 'Overview', 'syzenlabs-per-product-shipping-for-woocommerce' ),
	],
	[
		'rules',
		__( 'Rules', 'syzenlabs-per-product-shipping-for-woocommerce' ),
	],
	[
		'settings',
		__( 'Settings', 'syzenlabs-per-product-shipping-for-woocommerce' ),
	],
];

export const Header = () => {
	const { route, navigate } = useNav();
	const active = route.split( '/' )[ 0 ];
	return (
		<Card className="syzepps-header" size="small">
			<CardBody>
				<HStack alignment="center" justify="space-between">
					<Heading level={ 1 } size={ 20 }>
						{ __(
							'Syzenlabs Per Product Shipping',
							'syzenlabs-per-product-shipping-for-woocommerce'
						) }
					</Heading>
					<nav
						aria-label={ __(
							'Plugin navigation',
							'syzenlabs-per-product-shipping-for-woocommerce'
						) }
					>
						<HStack spacing={ 2 }>
							{ items.map( ( [ slug, label ] ) => (
								<Button
									key={ slug }
									variant={
										active === slug ? 'primary' : 'tertiary'
									}
									onClick={ () => navigate( slug ) }
									aria-current={
										active === slug ? 'page' : undefined
									}
								>
									{ label }
								</Button>
							) ) }
						</HStack>
					</nav>
				</HStack>
			</CardBody>
		</Card>
	);
};
