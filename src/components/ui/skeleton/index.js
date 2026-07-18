import {
	__experimentalHStack as HStack,
	Spinner,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const Skeleton = ( {
	label = __( 'Loading…', 'syzenlabs-per-product-shipping-for-woocommerce' ),
} ) => (
	<HStack className="syzepps-skeleton" justify="center">
		<Spinner />
		<Text>{ label }</Text>
	</HStack>
);
