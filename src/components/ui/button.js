import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'sp-button tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-md tw-text-sm tw-font-medium tw-transition-colors disabled:tw-pointer-events-none disabled:tw-opacity-50',
	{
		variants: {
			variant: {
				default:
					'tw-bg-primary tw-text-primary-foreground hover:tw-bg-primary/90',
				outline:
					'tw-border tw-border-input tw-bg-background hover:tw-bg-muted',
				secondary:
					'tw-bg-secondary tw-text-secondary-foreground hover:tw-bg-secondary/80',
				ghost: 'hover:tw-bg-muted hover:tw-text-foreground',
				destructive:
					'tw-bg-destructive tw-text-destructive-foreground hover:tw-bg-destructive/90',
			},
			size: {
				default: 'tw-h-10 tw-px-4',
				sm: 'tw-h-8 tw-px-3 tw-text-xs',
				icon: 'tw-h-9 tw-w-9',
			},
		},
		defaultVariants: { variant: 'default', size: 'default' },
	}
);

export const Button = forwardRef(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			busy = false,
			children,
			disabled,
			...props
		},
		ref
	) => {
		const Component = asChild ? Slot : 'button';
		return (
			<Component
				ref={ ref }
				type={ asChild ? undefined : 'button' }
				className={ cn(
					buttonVariants( { variant, size, className } )
				) }
				disabled={ disabled || busy }
				aria-busy={ busy || undefined }
				{ ...props }
			>
				{ asChild ? (
					children
				) : (
					<>
						{ busy && (
							<Loader2 className="sp-spin" aria-hidden="true" />
						) }
						{ children }
					</>
				) }
			</Component>
		);
	}
);
Button.displayName = 'Button';
