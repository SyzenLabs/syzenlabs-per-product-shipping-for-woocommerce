import { FormFileUpload } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const FileUploader = ( { onFile, disabled } ) => (
	<FormFileUpload
		__next40pxDefaultSize
		accept=".csv,text/csv"
		disabled={ disabled }
		onChange={ ( event ) => onFile( event.target.files?.[ 0 ] || null ) }
	>
		{ __( 'Choose CSV', 'syzenlabs-per-product-shipping-for-woocommerce' ) }
	</FormFileUpload>
);
