import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Notice,
	ToggleControl,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Skeleton } from '@/components/ui';
import { useToast } from '@/context/toast-context';

export const Settings = () => {
	const [ settings, setSettings ] = useState( null );
	const [ error, setError ] = useState( '' );
	const [ saving, setSaving ] = useState( false );
	const { showToast } = useToast();
	useEffect( () => {
		apiFetch( { path: '/syzepps/v1/settings' } )
			.then( setSettings )
			.catch( ( issue ) => setError( issue.message ) );
	}, [] );
	const save = async () => {
		setSaving( true );
		try {
			setSettings(
				await apiFetch( {
					path: '/syzepps/v1/settings',
					method: 'POST',
					data: settings,
				} )
			);
			showToast(
				__(
					'Settings saved.',
					'syzenlabs-per-product-shipping-for-woocommerce'
				)
			);
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			setSaving( false );
		}
	};
	return (
		<Card>
			<CardHeader>
				<Heading level={ 2 }>
					{ __(
						'Settings',
						'syzenlabs-per-product-shipping-for-woocommerce'
					) }
				</Heading>
			</CardHeader>
			<CardBody>
				<VStack spacing={ 5 }>
					{ error && (
						<Notice
							status="error"
							isDismissible
							onRemove={ () => setError( '' ) }
						>
							{ error }
						</Notice>
					) }
					{ ! settings ? (
						<Skeleton />
					) : (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __(
									'Remove plugin data on uninstall',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
								help={ __(
									'Off preserves rules and settings if the plugin is removed.',
									'syzenlabs-per-product-shipping-for-woocommerce'
								) }
								checked={ settings.remove_data_on_uninstall }
								onChange={ ( value ) =>
									setSettings( {
										...settings,
										remove_data_on_uninstall: value,
									} )
								}
							/>
						</>
					) }

					<Button
						variant="primary"
						isBusy={ saving }
						disabled={ saving }
						onClick={ save }
						style={ {
							width: 'fit-content',
						} }
					>
						{ __(
							'Save settings',
							'syzenlabs-per-product-shipping-for-woocommerce'
						) }
					</Button>
				</VStack>
			</CardBody>
		</Card>
	);
};
