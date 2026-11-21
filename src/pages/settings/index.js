import { useRef, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { ArrowUpRight, Database, Truck } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Skeleton, Switch } from '@/components/ui';
import { useResource } from '@/hooks/use-resource';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useToast } from '@/context/toast-context';

function RetentionSettings( { initial } ) {
	const [ saved, setSaved ] = useState( initial.remove_data_on_uninstall );
	const [ remove, setRemove ] = useState( initial.remove_data_on_uninstall );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );
	const lock = useRef( false );
	useUnsavedChanges( saved !== remove, { busy: saving } );
	const { showToast } = useToast();
	const save = async () => {
		if ( lock.current ) {
			return;
		}
		lock.current = true;
		setSaving( true );
		setError( '' );
		try {
			const result = await apiFetch( {
				path: '/syzepps/v1/settings',
				method: 'POST',
				data: { remove_data_on_uninstall: remove },
			} );
			setSaved( result.remove_data_on_uninstall );
			setRemove( result.remove_data_on_uninstall );
			showToast(
				__(
					'Settings saved.',
					'syzenlabs-per-product-shipping'
				)
			);
		} catch ( issue ) {
			setError( issue.message );
		} finally {
			lock.current = false;
			setSaving( false );
		}
	};
	return (
		<section className="sp-panel">
			<div className="sp-panel-heading">
				<div className="sp-panel-title">
					<Database />
					<h2>
						{ __(
							'Data retention',
							'syzenlabs-per-product-shipping'
						) }
					</h2>
				</div>
			</div>
			<div className="sp-panel-body">
				{ error && <Notice>{ error }</Notice> }
				<div className="sp-toggle-row">
					<div>
						<label htmlFor="sp-remove-data">
							{ __(
								'Delete data when uninstalling',
								'syzenlabs-per-product-shipping'
							) }
						</label>
						<p id="sp-retention-help">
							{ __(
								'Permanently delete shipping rules and settings when the plugin is uninstalled.',
								'syzenlabs-per-product-shipping'
							) }
						</p>
					</div>
					<Switch
						id="sp-remove-data"
						checked={ remove }
						onCheckedChange={ setRemove }
						disabled={ saving }
						aria-describedby="sp-retention-help"
					/>
				</div>
			</div>
			<div className="sp-panel-footer">
				<span>
					{ saved !== remove
						? __(
								'You have unsaved changes',
								'syzenlabs-per-product-shipping'
						  )
						: __(
								'All changes saved',
								'syzenlabs-per-product-shipping'
						  ) }
				</span>
				<Button
					busy={ saving }
					disabled={ saved === remove }
					onClick={ save }
				>
					{ __(
						'Save settings',
						'syzenlabs-per-product-shipping'
					) }
				</Button>
			</div>
		</section>
	);
}

export function Settings() {
	const { data, loading, error, reload } = useResource(
		'/syzepps/v1/settings'
	);
	return (
		<div className="sp-page">
			<div className="sp-page-heading">
				<h1 tabIndex={ -1 }>
					{ __(
						'Settings',
						'syzenlabs-per-product-shipping'
					) }
				</h1>
			</div>
			{ error && <Notice retry={ reload }>{ error.message }</Notice> }
			{ ! error && loading && <Skeleton /> }
			{ ! error && ! loading && data && (
				<RetentionSettings initial={ data } />
			) }
			<section className="sp-panel">
				<div className="sp-panel-body sp-settings-zone">
					<span className="sp-settings-icon">
						<Truck />
					</span>
					<div>
						<h2>
							{ __(
								'Shipping zones',
								'syzenlabs-per-product-shipping'
							) }
						</h2>
						<p>
							{ __(
								'Add Per Product Shipping to a zone and configure its title, tax status, and additional costs.',
								'syzenlabs-per-product-shipping'
							) }
						</p>
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
				</div>
			</section>
		</div>
	);
}
