const { test, expect } = require( '@playwright/test' );
const AxeBuilder = require( '@axe-core/playwright' ).default;

test.beforeEach( async ( { request } ) => { await request.get( '/__reset' ); } );

test( 'rules landing, server search, type filter, pagination, and export', async ( { page } ) => {
	const errors = []; page.on( 'pageerror', ( error ) => errors.push( error.message ) );
	await page.goto( '/' );
	await expect( page.getByRole( 'heading', { level: 1 } ) ).toHaveText( 'Shipping rules' );
	await expect( page.getByText( 'Showing 1–10 of 12 products' ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Next page', exact: true } ).click();
	await expect( page.getByText( 'Showing 11–12 of 12 products' ) ).toBeVisible();
	await page.getByRole( 'searchbox', { name: 'Search rules' } ).fill( 'Canvas' );
	await expect( page.getByRole( 'link', { name: /Everyday Canvas Tote/ } ) ).toBeVisible();
	await expect( page.getByText( 'Showing 1–1 of 1 products' ) ).toBeVisible();
	await page.getByRole( 'searchbox', { name: 'Search rules' } ).fill( '' );
	await page.getByRole( 'combobox', { name: 'Product type', exact: true } ).click();
	await page.getByRole( 'option', { name: 'Variable products' } ).click();
	await expect( page.getByText( 'Showing 1–2 of 2 products' ) ).toBeVisible();
	const downloadPromise = page.waitForEvent( 'download' );
	await page.getByRole( 'button', { name: 'Export all', exact: true } ).click();
	expect( ( await downloadPromise ).suggestedFilename() ).toBe( 'shipping-rules.csv' );
	expect( errors ).toEqual( [] );
} );

test( 'edit destination costs, reorder, protect workspace navigation, and persist overrides', async ( { page, request } ) => {
	await page.goto( '/#/rule-edit/101' );
	await expect( page.getByRole( 'heading', { name: 'Edit shipping rule' } ) ).toBeVisible();
	await page.getByRole( 'spinbutton', { name: 'Line cost for destination 1', exact: true } ).fill( '0' );
	await page.getByRole( 'link', { name: 'Settings', exact: true } ).click();
	await expect( page.getByRole( 'alertdialog' ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Cancel', exact: true } ).click();
	await expect( page.getByRole( 'spinbutton', { name: 'Line cost for destination 1', exact: true } ) ).toHaveValue( '0' );
	await page.getByRole( 'button', { name: /Everyday Canvas Tote — Natural/ } ).click();
	await page.getByRole( 'switch', { name: 'Use custom rates for this variation' } ).check();
	await page.getByRole( 'spinbutton', { name: 'Fallback cost', exact: true } ).nth( 1 ).fill( '5' );
	await page.getByRole( 'button', { name: 'Save rule', exact: true } ).first().click();
	await expect( page.getByText( 'All changes saved', { exact: true } ) ).toBeVisible();
	await page.reload();
	await expect( page.getByRole( 'spinbutton', { name: 'Line cost for destination 1', exact: true } ) ).toHaveValue( '0' );
	const state = await ( await request.get( '/__state' ) ).json();
	expect( state.families[ 101 ].variations[ 201 ].enable_per_variation_shipping ).toBe( true );
	expect( state.families[ 101 ].variations[ 201 ].fallback_cost ).toBe( '5' );
} );

test( 'create a rule, validate blank costs, and replace the create URL after saving', async ( { page, request } ) => {
	await request.get( '/__reset?scenario=empty' );
	await page.goto( '/' );
	await page.getByRole( 'button', { name: 'Create your first rule' } ).click();
	await page.getByRole( 'searchbox', { name: 'Search products' } ).fill( 'Ceramic' );
	await page.getByRole( 'button', { name: /Ceramic Pour-Over Set/ } ).click();
	await expect( page.getByText( 'No destinations configured.', { exact: true } ) ).toBeVisible();
	await expect( page.getByText( 'A world of possibilities', { exact: true } ) ).toHaveCount( 0 );
	await expect( page.getByRole( 'button', { name: /Add .*destination/ } ) ).toHaveCount( 1 );
	await page.getByRole( 'button', { name: 'Add destination', exact: true } ).click();
	await expect( page.getByRole( 'button', { name: 'Save rule', exact: true } ).first() ).toBeDisabled();
	await page.getByRole( 'spinbutton', { name: 'Line cost for destination 1', exact: true } ).fill( '4.25' );
	await page.getByRole( 'button', { name: 'Save rule', exact: true } ).first().click();
	await expect( page ).toHaveURL( /#\/rule-edit\/103$/ );
	await expect( page.getByRole( 'heading', { name: 'Edit shipping rule' } ) ).toBeVisible();
} );

test( 'import preview is invalidated by mode and file changes; commit is confirmed', async ( { page } ) => {
	await page.goto( '/' );
	await page.getByRole( 'button', { name: 'Import CSV', exact: true } ).click();
	await page.getByLabel( 'CSV file', { exact: true } ).setInputFiles( { name: 'rates.csv', mimeType: 'text/csv', buffer: Buffer.from( 'product_id,line_cost\n101,5' ) } );
	await page.getByRole( 'button', { name: 'Preview import' } ).click();
	await expect( page.getByText( 'Import preview' ) ).toBeVisible();
	await expect( page.getByText( 'Row 4:' ) ).toBeVisible();
	await page.getByRole( 'combobox', { name: 'Import mode' } ).click();
	await page.getByRole( 'option', { name: 'Skip existing products' } ).click();
	await expect( page.getByText( 'Import preview' ) ).toHaveCount( 0 );
	await page.getByRole( 'button', { name: 'Preview import' } ).click();
	await page.getByLabel( 'CSV file', { exact: true } ).setInputFiles( { name: 'other.csv', mimeType: 'text/csv', buffer: Buffer.from( 'product_id,line_cost\n102,6' ) } );
	await expect( page.getByText( 'Import preview' ) ).toHaveCount( 0 );
	await page.getByRole( 'button', { name: 'Preview import' } ).click();
	await page.getByRole( 'button', { name: 'Import rules', exact: true } ).click();
	await expect( page.getByRole( 'alertdialog' ) ).toBeVisible();
	await page.getByRole( 'alertdialog' ).getByRole( 'button', { name: 'Import rules', exact: true } ).click();
	await expect( page.getByText( '2 product families imported.' ) ).toBeVisible();
	await expect( page.getByRole( 'dialog' ) ).toHaveCount( 0 );
} );

test( 'bulk deletion requires confirmation and settings persist correctly', async ( { page, request } ) => {
	await page.goto( '/' );
	await page.getByRole( 'checkbox', { name: 'Select Everyday Canvas Tote', exact: true } ).check();
	await page.getByRole( 'button', { name: 'Delete selected', exact: true } ).click();
	await page.getByRole( 'button', { name: 'Delete rules', exact: true } ).click();
	await expect( page.getByRole( 'link', { name: /Everyday Canvas Tote/ } ) ).toHaveCount( 0 );
	await page.getByRole( 'link', { name: 'Settings', exact: true } ).click();
	await page.getByRole( 'switch', { name: 'Delete data when uninstalling' } ).check();
	await page.getByRole( 'button', { name: 'Save settings', exact: true } ).click();
	await expect( page.getByText( 'Settings saved.', { exact: true } ) ).toBeVisible();
	const state = await ( await request.get( '/__state' ) ).json();
	expect( state.settings.remove_data_on_uninstall ).toBe( true );
} );

test( 'permission failures remain errors rather than appearing as empty stores', async ( { page, request } ) => {
	await request.get( '/__reset?scenario=error' );
	await page.goto( '/' );
	await expect( page.getByRole( 'alert' ) ).toContainText( 'You do not have permission' );
	await expect( page.getByRole( 'button', { name: 'Try again' } ) ).toBeVisible();
} );

for ( const width of [ 320, 390, 768, 1024, 1440, 2200 ] ) {
	test( `responsive layout and accessibility at ${ width }px`, async ( { page } ) => {
		await page.setViewportSize( { width, height: 1000 } );
		await page.goto( '/' );
		await expect( page.getByRole( 'link', { name: /Everyday Canvas Tote/ } ) ).toBeVisible();
		expect( await page.evaluate( () => document.documentElement.scrollWidth <= innerWidth ) ).toBe( true );
		const header = page.locator( '.sp-workspace-header' );
		const workspace = await page.locator( '#syzepps-dashboard-wrap' ).boundingBox();
		const headerBox = await header.boundingBox();
		expect( headerBox.x ).toBeCloseTo( workspace.x );
		expect( headerBox.width ).toBeCloseTo( workspace.width );
		const heading = await page.locator( '.sp-page-heading' ).boundingBox();
		const brand = await header.getByRole( 'link', { name: 'Per product shipping', exact: true } ).boundingBox();
		const help = await header.getByRole( 'button', { name: 'Workspace help', exact: true } ).boundingBox();
		expect( brand.x ).toBeCloseTo( heading.x );
		expect( help.x + help.width ).toBeCloseTo( heading.x + heading.width );
		await expect( header.getByRole( 'link', { name: 'Shipping zones' } ) ).toBeVisible();
		for ( const link of await header.getByRole( 'link' ).all() ) {
			const box = await link.boundingBox();
			expect( box.x ).toBeGreaterThanOrEqual( headerBox.x );
			expect( box.x + box.width ).toBeLessThanOrEqual( headerBox.x + headerBox.width );
		}
		await expect( page.locator( '#sp-main > div' ) ).toHaveCSS( 'opacity', '1' );
		if ( await page.getByRole( 'dialog' ).count() ) { await expect( page.getByRole( 'dialog' ) ).toHaveCSS( 'opacity', '1' ); }
		const results = await new AxeBuilder( { page } ).include( '#syzepps-dashboard-wrap' ).withTags( [ 'wcag2a', 'wcag2aa', 'wcag21aa' ] ).analyze();
		await test.info().attach( 'accessibility', { body: JSON.stringify( results.violations, null, 2 ), contentType: 'application/json' } );
		expect( results.violations.map( ( issue ) => ( { id: issue.id, nodes: issue.nodes.map( ( node ) => ( { target: node.target, message: node.failureSummary } ) ) } ) ) ).toEqual( [] );
		await page.screenshot( { path: `/tmp/syzepps-premium-admin/rules-${ width }.png`, fullPage: true } );
	} );
}

test( 'keyboard dialog focus and reduced motion', async ( { page } ) => {
	await page.emulateMedia( { reducedMotion: 'reduce' } );
	await page.goto( '/' );
	await page.getByRole( 'button', { name: 'Import CSV', exact: true } ).click();
	await expect( page.getByRole( 'dialog' ) ).toBeVisible();
	await page.keyboard.press( 'Tab' );
	expect( await page.evaluate( () => !! document.activeElement.closest( '[role="dialog"]' ) ) ).toBe( true );
	await page.keyboard.press( 'Escape' );
	await expect( page.getByRole( 'dialog' ) ).toHaveCount( 0 );
} );

test( 'legacy costs remain visible and keep their calculation on location-only edits', async ( { page, request } ) => {
	await request.get( '/__reset?scenario=legacy' );
	await page.goto( '/#/rule-edit/101' );
	await expect( page.getByRole( 'spinbutton', { name: 'Line cost for destination 1', exact: true } ) ).toHaveValue( '9.50' );
	await page.getByRole( 'textbox', { name: 'Country for destination 1', exact: true } ).fill( 'CA' );
	await page.getByRole( 'button', { name: 'Save rule', exact: true } ).first().click();
	await expect( page.getByText( 'All changes saved', { exact: true } ) ).toBeVisible();
	const state = await ( await request.get( '/__state' ) ).json();
	expect( state.families[ 101 ].product.rules[ 0 ] ).toMatchObject( { country: 'CA', line_cost: '', item_cost: '', cost: '9.50' } );
} );

test( 'keyboard priority controls reorder the saved destination payload', async ( { page, request } ) => {
	await page.goto( '/#/rule-edit/102' );
	await page.getByRole( 'button', { name: 'Add destination', exact: true } ).click();
	await page.getByRole( 'textbox', { name: 'Country for destination 2', exact: true } ).fill( 'CA' );
	await page.getByRole( 'spinbutton', { name: 'Line cost for destination 2', exact: true } ).fill( '6' );
	await page.getByRole( 'button', { name: 'Move destination 2 up', exact: true } ).click();
	await expect( page.getByRole( 'textbox', { name: 'Country for destination 1', exact: true } ) ).toHaveValue( 'CA' );
	await page.getByRole( 'button', { name: 'Save rule', exact: true } ).first().click();
	await expect( page.getByText( 'All changes saved', { exact: true } ) ).toBeVisible();
	const state = await ( await request.get( '/__state' ) ).json();
	expect( state.families[ 102 ].product.rules.map( ( row ) => row.country ) ).toEqual( [ 'CA', 'US' ] );
} );

test( 'settings navigation is guarded and the skip link preserves the current route', async ( { page } ) => {
	await page.goto( '/#settings' );
	await page.getByRole( 'switch', { name: 'Delete data when uninstalling' } ).check();
	await page.getByRole( 'link', { name: 'Shipping rules', exact: true } ).click();
	await expect( page.getByRole( 'alertdialog' ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Cancel', exact: true } ).click();
	const skip = page.getByRole( 'link', { name: 'Skip to content', exact: true } );
	await skip.focus(); await skip.click();
	await expect( page ).toHaveURL( /#settings$/ );
	await expect( page.locator( '#sp-main' ) ).toBeFocused();
	await page.getByRole( 'link', { name: 'Shipping rules', exact: true } ).click();
	await page.getByRole( 'button', { name: 'Discard changes', exact: true } ).click();
	await expect( page.getByRole( 'heading', { name: 'Shipping rules' } ) ).toBeVisible();
} );

test( 'save failures keep the entered costs and the dirty state', async ( { page, request } ) => {
	await request.get( '/__reset?scenario=save-error' );
	await page.goto( '/#/rule-edit/102' );
	await page.getByRole( 'spinbutton', { name: 'Line cost for destination 1', exact: true } ).fill( '7' );
	await page.getByRole( 'button', { name: 'Save rule', exact: true } ).first().click();
	await expect( page.getByRole( 'alert' ) ).toContainText( 'The rule could not be saved' );
	await expect( page.getByRole( 'spinbutton', { name: 'Line cost for destination 1', exact: true } ) ).toHaveValue( '7' );
	await expect( page.getByText( 'Unsaved changes', { exact: true } ) ).toBeVisible();
} );

test( 'an older search response cannot replace a newer result', async ( { page } ) => {
	await page.route( '**/wp-json/syzepps/v1/rules?**', async ( route ) => {
		const search = new URL( route.request().url() ).searchParams.get( 'search' );
		if ( search === 'Canvas' ) {
			const response = await route.fetch();
			await new Promise( ( resolve ) => setTimeout( resolve, 700 ) );
			await route.fulfill( { response } ).catch( () => {} );
		} else { await route.continue(); }
	} );
	await page.goto( '/' );
	const input = page.getByRole( 'searchbox', { name: 'Search rules' } );
	await input.fill( 'Canvas' );
	await page.waitForRequest( ( req ) => req.url().includes( 'search=Canvas' ) );
	await input.fill( 'Ceramic' );
	await expect( page.getByRole( 'link', { name: /Ceramic Pour-Over Set/ } ) ).toBeVisible();
	await page.waitForTimeout( 800 );
	await expect( page.getByRole( 'link', { name: /Everyday Canvas Tote/ } ) ).toHaveCount( 0 );
	await expect( page.getByRole( 'link', { name: /Ceramic Pour-Over Set/ } ) ).toBeVisible();
} );

test( 'RTL controls remain inside their tracks and menus inherit direction', async ( { page } ) => {
	await page.goto( '/?rtl=1#/settings' );
	const toggle = page.getByRole( 'switch', { name: 'Delete data when uninstalling' } );
	await toggle.check();
	const track = await toggle.boundingBox();
	const thumb = await toggle.locator( '.sp-switch-thumb' ).boundingBox();
	expect( thumb.x ).toBeGreaterThanOrEqual( track.x );
	expect( thumb.x + thumb.width ).toBeLessThanOrEqual( track.x + track.width );
	await page.getByRole( 'button', { name: 'Save settings', exact: true } ).click();
	await expect( page.getByText( 'Settings saved.', { exact: true } ) ).toBeVisible();
	await page.getByRole( 'link', { name: 'Shipping rules', exact: true } ).click();
	await expect( page.getByRole( 'combobox', { name: 'Product type', exact: true } ) ).toHaveAttribute( 'dir', 'rtl' );
	await page.screenshot( { path: '/tmp/syzepps-premium-admin/rtl.png', fullPage: true } );
} );

test( 'editor, import dialog, and settings meet accessibility checks', async ( { page } ) => {
	for ( const route of [ '/#/rule-edit/101', '/#/settings', '/' ] ) {
		await page.goto( route );
		await expect( page.getByRole( 'heading', { level: 1 } ) ).toBeVisible();
		if ( route === '/' ) { await page.getByRole( 'button', { name: 'Import CSV', exact: true } ).click(); }
		await expect( page.locator( '#sp-main > div' ) ).toHaveCSS( 'opacity', '1' );
		if ( await page.getByRole( 'dialog' ).count() ) { await expect( page.getByRole( 'dialog' ) ).toHaveCSS( 'opacity', '1' ); }
		const results = await new AxeBuilder( { page } ).include( '#syzepps-dashboard-wrap' ).withTags( [ 'wcag2a', 'wcag2aa', 'wcag21aa' ] ).analyze();
		expect( results.violations.map( ( issue ) => ( { id: issue.id, nodes: issue.nodes.map( ( node ) => ( { target: node.target, message: node.failureSummary } ) ) } ) ) ).toEqual( [] );
		await page.screenshot( { path: `/tmp/syzepps-premium-admin/${ route.includes( 'edit' ) ? 'editor' : route.includes( 'settings' ) ? 'settings' : 'import' }.png`, fullPage: true } );
	}
} );

for ( const id of [ '0', 'abc' ] ) {
	test( `invalid edit target ${ id } does not open the create form`, async ( { page } ) => {
		await page.goto( `/#/rule-edit/${ id }` );
		await expect( page.getByRole( 'alert' ) ).toContainText( 'This product ID is invalid.' );
		await expect( page.getByRole( 'searchbox', { name: 'Search products' } ) ).toHaveCount( 0 );
	} );
}

test( 'workspace uses one header for its brand and navigation and provides shipping help', async ( { page } ) => {
	await page.goto( '/' );
	await page.evaluate( () => document.fonts.ready );
	expect( await page.evaluate( () => document.fonts.check( '13px "Syzenlabs Inter"' ) ) ).toBe( true );
	const nav = page.getByRole( 'navigation', { name: 'Plugin navigation' } );
	await expect( nav ).toBeVisible();
	const header = page.locator( '.sp-workspace-header' );
	const headerBox = await header.boundingBox();
	const navigation = await nav.boundingBox();
	const main = await page.locator( '#sp-main' ).boundingBox();
	const workspace = await page.locator( '#syzepps-dashboard-wrap' ).boundingBox();
	expect( headerBox.y + headerBox.height ).toBeLessThanOrEqual( main.y );
	expect( headerBox.width ).toBeCloseTo( workspace.width );
	expect( navigation.y ).toBeGreaterThanOrEqual( headerBox.y );
	expect( navigation.y + navigation.height ).toBeLessThanOrEqual( headerBox.y + headerBox.height );
	await expect( header ).not.toContainText( 'Merchant workspace' );
	await expect( header ).not.toContainText( 'Syzenlabs Studio' );
	await expect( header ).not.toContainText( 'Made for WooCommerce' );
	await page.getByRole( 'button', { name: 'Workspace help', exact: true } ).click();
	await expect( page.getByRole( 'dialog', { name: 'Shipping help' } ) ).toBeVisible();
	await page.keyboard.press( 'Escape' );
	await expect( page.getByRole( 'dialog' ) ).toHaveCount( 0 );
	await expect( page.getByRole( 'button', { name: 'Workspace help', exact: true } ) ).toBeFocused();
} );
