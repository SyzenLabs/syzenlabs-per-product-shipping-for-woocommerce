import { ArrowUpRight, CircleHelp } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Button, Dialog, DialogContent, DialogTrigger } from '@/components/ui';

export function ShippingHelp() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={ __(
						'Workspace help',
						'syzenlabs-per-product-shipping'
					) }
				>
					<CircleHelp />
				</Button>
			</DialogTrigger>
			<DialogContent
				title={ __(
					'Shipping help',
					'syzenlabs-per-product-shipping'
				) }
			>
				<div className="sp-dialog-body">
					<ol className="sp-help-steps">
						<li>
							<strong>
								{ __(
									'Choose your product',
									'syzenlabs-per-product-shipping'
								) }
							</strong>
							<p>
								{ __(
									'Create a rule for a simple product or a variable parent. Variation overrides replace the parent rates completely.',
									'syzenlabs-per-product-shipping'
								) }
							</p>
						</li>
						<li>
							<strong>
								{ __(
									'Set your destination rates',
									'syzenlabs-per-product-shipping'
								) }
							</strong>
							<p>
								{ __(
									'The first matching destination wins, followed by the fallback cost. Put more specific destinations first.',
									'syzenlabs-per-product-shipping'
								) }
							</p>
						</li>
						<li>
							<strong>
								{ __(
									'Connect your shipping zone',
									'syzenlabs-per-product-shipping'
								) }
							</strong>
							<p>
								{ __(
									'Add Per Product Shipping to a WooCommerce shipping zone. Alternatively, enable Adjust existing shipping methods in a product rule to add its costs to eligible paid methods.',
									'syzenlabs-per-product-shipping'
								) }
							</p>
						</li>
					</ol>
					<Button variant="outline" asChild>
						<a href={ syzeppsAdmin.shippingZonesUrl }>
							{ __(
								'Open shipping zones',
								'syzenlabs-per-product-shipping'
							) }
							<ArrowUpRight />
						</a>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
