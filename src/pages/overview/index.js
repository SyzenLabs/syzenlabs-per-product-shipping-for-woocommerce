import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	__experimentalGrid as Grid,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Skeleton } from '@/components/ui';
import { useNav } from '@/context/nav-context';

export const Overview = () => {
	const { navigate } = useNav();
	const [ summary, setSummary ] = useState( null );
	useEffect( () => {
		apiFetch( { path: '/syzepps/v1/rules?per_page=1' } )
			.then( ( response ) => setSummary( response.pagination ) )
			.catch( () => setSummary( { totalItems: 0 } ) );
	}, [] );

	return (
		<VStack spacing={ 6 }>
			<Heading level={ 2 }>
				{ __(
					'Overview',
					'syzenlabs-per-product-shipping-for-woocommerce'
				) }
			</Heading>
			<Grid columns={ 2 } className="syzepps-overview-grid">
				<Card>
					<CardHeader>
						<Heading level={ 3 }>
							{ __(
								'Configured product families',
								'syzenlabs-per-product-shipping-for-woocommerce'
							) }
						</Heading>
					</CardHeader>
					<CardBody>
						{ summary ? (
							<Heading level={ 4 } size={ 32 }>
								{ summary.totalItems }
							</Heading>
						) : (
							<Skeleton />
						) }
					</CardBody>
				</Card>
				<Card>
					<CardHeader>
						<Heading level={ 3 }>
							{ __(
								'Quick actions',
								'syzenlabs-per-product-shipping-for-woocommerce'
							) }
						</Heading>
					</CardHeader>
					<CardBody>
						<VStack>
							<Button
								variant="primary"
								onClick={ () => navigate( 'rule-add' ) }
							>
								{ __(
									'Add product rule',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</Button>
							<Button
								variant="secondary"
								href={ syzeppsAdmin.shippingZonesUrl }
							>
								{ __(
									'Open shipping zones',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
							</Button>
						</VStack>
					</CardBody>
				</Card>
			</Grid>
			<Card>
				<CardBody>
					<Text>
						{ __(
							'A variation override wins completely. Otherwise the parent rule is used. The first matching destination row wins, then the fallback. Adjust Shipping Costs routes configured costs to eligible shipping methods instead of this plugin’s standalone rate.',
							'syzenlabs-per-product-shipping-for-woocommerce'
						) }
					</Text>
				</CardBody>
			</Card>
		</VStack>
	);
};
