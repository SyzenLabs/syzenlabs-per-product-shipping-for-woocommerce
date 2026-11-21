import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, Minus } from 'lucide-react';
import { portalRoot } from '@/lib/utils';

export function Checkbox( { checked, ...props } ) {
	return (
		<CheckboxPrimitive.Root
			className="sp-checkbox"
			checked={ checked }
			{ ...props }
		>
			<CheckboxPrimitive.Indicator>
				{ checked === 'indeterminate' ? <Minus /> : <Check /> }
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export function Switch( props ) {
	return (
		<SwitchPrimitive.Root className="sp-switch" { ...props }>
			<SwitchPrimitive.Thumb className="sp-switch-thumb" />
		</SwitchPrimitive.Root>
	);
}

export function Select( {
	value,
	onValueChange,
	options,
	label,
	disabled,
	id,
} ) {
	return (
		<SelectPrimitive.Root
			dir={ document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr' }
			value={ value }
			onValueChange={ onValueChange }
			disabled={ disabled }
		>
			<SelectPrimitive.Trigger
				id={ id }
				className="sp-select"
				aria-label={ label }
			>
				<SelectPrimitive.Value />
				<SelectPrimitive.Icon>
					<ChevronDown />
				</SelectPrimitive.Icon>
			</SelectPrimitive.Trigger>
			<SelectPrimitive.Portal container={ portalRoot() }>
				<SelectPrimitive.Content
					className="sp-select-content"
					position="popper"
					sideOffset={ 5 }
				>
					<SelectPrimitive.Viewport>
						{ options.map( ( option ) => (
							<SelectPrimitive.Item
								key={ option.value }
								value={ option.value }
								className="sp-select-item"
							>
								<SelectPrimitive.ItemText>
									{ option.label }
								</SelectPrimitive.ItemText>
								<SelectPrimitive.ItemIndicator>
									<Check />
								</SelectPrimitive.ItemIndicator>
							</SelectPrimitive.Item>
						) ) }
					</SelectPrimitive.Viewport>
				</SelectPrimitive.Content>
			</SelectPrimitive.Portal>
		</SelectPrimitive.Root>
	);
}
