import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { portalRoot } from '@/lib/utils';

export function RuleActions( { item, onDelete, disabled } ) {
	return (
		<DropdownMenu.Root
			dir={ document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr' }
		>
			<DropdownMenu.Trigger asChild>
				<Button
					variant="ghost"
					size="icon"
					disabled={ disabled }
					aria-label={
						__(
							'Rule actions for',
							'syzenlabs-per-product-shipping'
						) +
						' ' +
						item.name
					}
				>
					<Ellipsis />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal container={ portalRoot() }>
				<DropdownMenu.Content
					className="sp-menu"
					align="end"
					sideOffset={ 5 }
				>
					<DropdownMenu.Item asChild>
						<Link
							to={ `/rule-edit/${ item.id }` }
							className="sp-menu-item"
						>
							<Pencil />
							{ __(
								'Edit rule',
								'syzenlabs-per-product-shipping'
							) }
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Separator className="sp-menu-separator" />
					<DropdownMenu.Item
						className="sp-menu-item sp-danger-text"
						onSelect={ () => onDelete( [ item.id ] ) }
					>
						<Trash2 />
						{ __(
							'Delete rule',
							'syzenlabs-per-product-shipping'
						) }
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
