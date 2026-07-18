import { ComboboxControl } from '@wordpress/components';

export const SyzeppsSelect = ( {
	label,
	value,
	options,
	onChange,
	onFilterValueChange,
	help,
	disabled,
} ) => (
	<ComboboxControl
		__next40pxDefaultSize
		__nextHasNoMarginBottom
		label={ label }
		value={ value }
		options={ options }
		onChange={ onChange }
		onFilterValueChange={ onFilterValueChange }
		help={ help }
		disabled={ disabled }
	/>
);
