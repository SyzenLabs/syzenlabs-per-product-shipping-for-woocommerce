import { useRef, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { Check, FileSpreadsheet, FileUp } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, DialogContent, Notice, Select } from '@/components/ui';
import { usePrompt } from '@/context/prompt-context';
import { useToast } from '@/context/toast-context';

export function ImportDialog( { open, onOpenChange, onImported } ) {
	const [ file, setFile ] = useState( null );
	const [ mode, setMode ] = useState( 'update' );
	const [ preview, setPreview ] = useState( null );
	const [ error, setError ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const lock = useRef( false );
	const sourceRevision = useRef( 0 );
	const { confirm } = usePrompt();
	const { showToast } = useToast();
	const resetPreview = () => {
		sourceRevision.current += 1;
		setPreview( null );
		setError( '' );
	};
	const dryRun = async () => {
		if ( ! file || lock.current ) {
			return;
		}
		lock.current = true;
		setBusy( true );
		resetPreview();
		const body = new FormData();
		body.append( 'file', file );
		body.append( 'mode', mode );
		const revision = sourceRevision.current;
		try {
			const result = await apiFetch( {
				path: '/syzepps/v1/rules/import/dry-run',
				method: 'POST',
				body,
			} );
			if ( sourceRevision.current === revision ) {
				setPreview( result );
			}
		} catch ( issue ) {
			if ( sourceRevision.current === revision ) {
				setError( issue.message );
			}
		} finally {
			lock.current = false;
			setBusy( false );
		}
	};
	const commit = async () => {
		if (
			! preview ||
			lock.current ||
			! ( await confirm( {
				title: __(
					'Import these shipping rules?',
					'syzenlabs-per-product-shipping'
				),
				message: __(
					'The valid product families in this preview will be saved using your selected import mode. Rows with errors are skipped.',
					'syzenlabs-per-product-shipping'
				),
				confirmLabel: __(
					'Import rules',
					'syzenlabs-per-product-shipping'
				),
			} ) )
		) {
			return;
		}
		lock.current = true;
		setBusy( true );
		setError( '' );
		try {
			const result = await apiFetch( {
				path: '/syzepps/v1/rules/import/commit',
				method: 'POST',
				data: { token: preview.token },
			} );
			showToast(
				sprintf(
					/* translators: %d: product family count. */
					__(
						'%d product families imported.',
						'syzenlabs-per-product-shipping'
					),
					result.committed
				)
			);
			onImported();
			onOpenChange( false );
		} catch ( issue ) {
			setError( issue.message );
			if ( issue.code === 'syzepps_import_expired' ) {
				setPreview( null );
			}
		} finally {
			lock.current = false;
			setBusy( false );
		}
	};
	return (
		<Dialog
			open={ open }
			onOpenChange={ ( next ) => {
				if ( ! lock.current ) {
					onOpenChange( next );
				}
			} }
		>
			<DialogContent
				title={ __(
					'Import CSV',
					'syzenlabs-per-product-shipping'
				) }
				description={ __(
					'Use a CSV export as a template. Maximum file size is 2 MB.',
					'syzenlabs-per-product-shipping'
				) }
				onEscapeKeyDown={ ( event ) => {
					if ( busy ) {
						event.preventDefault();
					}
				} }
				onInteractOutside={ ( event ) => {
					if ( busy ) {
						event.preventDefault();
					}
				} }
			>
				<div className="sp-dialog-body">
					{ error && <Notice>{ error }</Notice> }
					<label className="sp-upload" htmlFor="sp-import-file">
						<FileUp aria-hidden="true" />
						<strong>
							{ file
								? file.name
								: __(
										'CSV file',
										'syzenlabs-per-product-shipping'
								  ) }
						</strong>
						<input
							id="sp-import-file"
							type="file"
							accept=".csv,text/csv"
							disabled={ busy }
							aria-label={ __(
								'CSV file',
								'syzenlabs-per-product-shipping'
							) }
							onChange={ ( event ) => {
								resetPreview();
								const next = event.target.files?.[ 0 ] || null;
								if ( next && next.size > 2 * 1024 * 1024 ) {
									setError(
										__(
											'Choose a CSV smaller than 2 MB.',
											'syzenlabs-per-product-shipping'
										)
									);
									setFile( null );
									event.target.value = '';
									return;
								}
								setFile( next );
							} }
						/>
					</label>
					<div className="sp-field">
						<label htmlFor="sp-import-mode">
							{ __(
								'When a product already has rules',
								'syzenlabs-per-product-shipping'
							) }
						</label>
						<Select
							id="sp-import-mode"
							value={ mode }
							disabled={ busy }
							onValueChange={ ( value ) => {
								setMode( value );
								resetPreview();
							} }
							label={ __(
								'Import mode',
								'syzenlabs-per-product-shipping'
							) }
							options={ [
								{
									value: 'update',
									label: __(
										'Merge with existing rules',
										'syzenlabs-per-product-shipping'
									),
								},
								{
									value: 'skip',
									label: __(
										'Skip existing products',
										'syzenlabs-per-product-shipping'
									),
								},
								{
									value: 'replace',
									label: __(
										'Replace rules for included products',
										'syzenlabs-per-product-shipping'
									),
								},
							] }
						/>
						{ mode === 'replace' && (
							<p className="sp-help">
								{ __(
									'This replaces existing rules and variation overrides for products in the CSV.',
									'syzenlabs-per-product-shipping'
								) }
							</p>
						) }
					</div>
					{ preview && (
						<div className="sp-import-preview" role="status">
							<div>
								<FileSpreadsheet />
								<strong>
									{ __(
										'Import preview',
										'syzenlabs-per-product-shipping'
									) }
								</strong>
							</div>
							<p>
								{ sprintf(
									/* translators: 1: product family count, 2: row error count. */
									__(
										'%1$d product families ready · %2$d row errors',
										'syzenlabs-per-product-shipping'
									),
									preview.summary.families,
									preview.summary.errors
								) }
							</p>
							{ preview.errors?.length > 0 && (
								<ul className="sp-import-errors">
									{ preview.errors.map( ( issue, index ) => (
										<li key={ index }>
											{ sprintf(
												/* translators: %d: CSV row number. */
												__(
													'Row %d:',
													'syzenlabs-per-product-shipping'
												),
												issue.row
											) }{ ' ' }
											{ issue.message }
										</li>
									) ) }
								</ul>
							) }
						</div>
					) }
				</div>
				<div className="sp-dialog-footer">
					<Button
						variant="outline"
						disabled={ busy }
						onClick={ () => onOpenChange( false ) }
					>
						{ __(
							'Cancel',
							'syzenlabs-per-product-shipping'
						) }
					</Button>
					{ preview ? (
						<Button
							busy={ busy }
							disabled={ ! preview.summary.families }
							onClick={ commit }
						>
							<Check />
							{ __(
								'Import rules',
								'syzenlabs-per-product-shipping'
							) }
						</Button>
					) : (
						<Button
							busy={ busy }
							disabled={ ! file }
							onClick={ dryRun }
						>
							{ __(
								'Preview import',
								'syzenlabs-per-product-shipping'
							) }
						</Button>
					) }
				</div>
			</DialogContent>
		</Dialog>
	);
}
