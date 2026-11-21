import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { portalRoot, cn } from '@/lib/utils';
import { Button } from './button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent( {
	children,
	title,
	description,
	className,
	...props
} ) {
	return (
		<DialogPrimitive.Portal container={ portalRoot() }>
			<DialogPrimitive.Overlay className="sp-dialog-overlay" />
			<DialogPrimitive.Content
				className={ cn( 'sp-dialog', className ) }
				{ ...( ! description && { 'aria-describedby': undefined } ) }
				{ ...props }
			>
				<div className="sp-dialog-heading">
					<div>
						<DialogPrimitive.Title>{ title }</DialogPrimitive.Title>
						{ description && (
							<DialogPrimitive.Description>
								{ description }
							</DialogPrimitive.Description>
						) }
					</div>
					<DialogPrimitive.Close asChild>
						<Button
							variant="ghost"
							size="icon"
							aria-label={ __(
								'Close dialog',
								'syzenlabs-per-product-shipping'
							) }
						>
							<X />
						</Button>
					</DialogPrimitive.Close>
				</div>
				{ children }
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}
