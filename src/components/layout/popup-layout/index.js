import {
	Button,
	Card,
	CardBody,
	CardHeader,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const PopupLayout = ( {
	title,
	children,
	onBack,
	onSave,
	saving,
	saveDisabled,
} ) => (
	<div className="syzepps-popup-layout">
		<Card>
			<CardHeader>
				<HStack justify="space-between">
					<HStack>
						<Button variant="tertiary" onClick={ onBack }>
							{ __(
								'Back',
								'syzenlabs-per-product-shipping-for-woocommerce'
							) }
						</Button>
						<Heading level={ 1 } size={ 20 }>
							{ title }
						</Heading>
					</HStack>
					<Button
						variant="primary"
						isBusy={ saving }
						disabled={ saving || saveDisabled }
						onClick={ onSave }
					>
						{ saving
							? __(
									'Saving…',
									'syzenlabs-per-product-shipping-for-woocommerce'
							  )
							: __(
									'Save rule',
									'syzenlabs-per-product-shipping-for-woocommerce'
							  ) }
					</Button>
				</HStack>
			</CardHeader>
			<CardBody>
				<VStack spacing={ 6 }>{ children }</VStack>
			</CardBody>
		</Card>
	</div>
);
