/* Isolated UI fixtures: this server never bootstraps WordPress or its database. */
const http = require( 'node:http' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const root = path.resolve( __dirname, '../..' );
const wordpress = process.env.SYZEPPS_WP_ROOT || path.resolve( root, '../../..' );
const names = [ 'Everyday Canvas Tote', 'Organic Cotton T-Shirt', 'Ceramic Pour-Over Set', 'Linen Cushion Cover', 'Walnut Desk Organizer', 'Botanical Art Print', 'Weekend Travel Bag', 'Wool Throw Blanket', 'Stoneware Coffee Mug', 'Oak Wall Shelf', 'Everyday Notebook', 'Brass Desk Lamp' ];
const products = names.map( ( name, index ) => ( { id: 101 + index, name, sku: `SYZ-${ 1001 + index }`, type: index === 0 || index === 3 ? 'variable' : 'simple', shippingClass: index === 2 || index === 8 ? 'fragile' : '', variations: index === 0 ? [ { id: 201, name: 'Everyday Canvas Tote — Natural', sku: 'TOTE-NAT' }, { id: 202, name: 'Everyday Canvas Tote — Olive', sku: 'TOTE-OLV' } ] : [] } ) );
let families, settings, failure, previews;
function reset( scenario = '' ) {
	families = Object.fromEntries( products.slice( 0, scenario === 'empty' ? 0 : 12 ).map( ( product ) => [ product.id, { product: { adjust_shipping_costs: false, calculation_mode: 'per_line', quantity_step: 1, fallback_cost: '8.00', rules: [ { id: 'r1', country: 'US', state: '', city: '', postcode: '', line_cost: '4.50', item_cost: '1.00' } ] }, variations: {} } ] ) );
	if ( scenario === 'legacy' ) { families[ 101 ].product.calculation_mode = 'per_order'; families[ 101 ].product.rules = [ { id: 'legacy1', country: 'US', state: '', city: '', postcode: '', line_cost: '', item_cost: '', cost: '9.50', cost_type: 'fixed' } ]; }
 settings = { remove_data_on_uninstall: false }; failure = scenario; previews = new Set();
}
reset();
const json = ( res, data, status = 200 ) => { res.writeHead( status, { 'Content-Type': 'application/json' } ); res.end( JSON.stringify( data ) ); };
const parseBody = async ( req ) => { const chunks = []; for await ( const chunk of req ) { chunks.push( chunk ); } const text = Buffer.concat( chunks ).toString(); try { return JSON.parse( text ); } catch { return text; } };
function serveFile( res, file, allowed ) {
	if ( ! file.startsWith( allowed + path.sep ) || ! fs.existsSync( file ) || ! fs.statSync( file ).isFile() ) { res.writeHead( 404 ); res.end(); return; }
	const ext = path.extname( file ); res.writeHead( 200, { 'Content-Type': ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : ext === '.woff2' ? 'font/woff2' : 'image/svg+xml' } ); fs.createReadStream( file ).pipe( res );
}
const server = http.createServer( async ( req, res ) => {
	const url = new URL( req.url, 'http://localhost' );
	if ( url.pathname === '/__reset' ) { reset( url.searchParams.get( 'scenario' ) ); return json( res, { ok: true } ); }
	if ( url.pathname === '/__state' ) { return json( res, { families, settings } ); }
	if ( url.pathname.startsWith( '/assets/' ) ) { return serveFile( res, path.resolve( root, '.' + url.pathname ), root ); }
	if ( url.pathname.startsWith( '/wp-includes/' ) || url.pathname.startsWith( '/wp-admin/css/' ) ) { return serveFile( res, path.resolve( wordpress, '.' + url.pathname ), wordpress ); }
	if ( url.pathname.startsWith( '/wp-json/' ) ) {
		const endpoint = url.pathname.replace( '/wp-json/syzepps/v1', '' );
		const body = req.method === 'GET' ? {} : await parseBody( req );
		if ( failure === 'error' && endpoint === '/rules' ) { return json( res, { message: 'You do not have permission to manage shipping rules.', code: 'rest_forbidden' }, 403 ); }
		if ( failure === 'save-error' && req.method !== 'GET' ) { return json( res, { message: 'The rule could not be saved. Please try again.', code: 'save_failed' }, 500 ); }
		if ( endpoint === '/rules/export' ) { return json( res, { csv: 'product_id,line_cost,item_cost\n101,4.50,1.00', filename: 'shipping-rules.csv' } ); }
		if ( endpoint === '/rules/import/dry-run' ) { previews.add( 'validated-token' ); return json( res, { token: 'validated-token', summary: { families: 2, errors: 1 }, errors: [ { row: 4, message: 'Product target is missing or ineligible.' } ] } ); }
		if ( endpoint === '/rules/import/commit' ) { if ( ! previews.has( body.token ) ) { return json( res, { message: 'Preview expired.', code: 'syzepps_import_expired' }, 410 ); } previews.delete( body.token ); return json( res, { committed: 2, failed: 1, errors: [] } ); }
		if ( endpoint === '/settings' ) { if ( req.method === 'POST' ) { settings = { remove_data_on_uninstall: !! body.remove_data_on_uninstall }; } return json( res, settings ); }
		const productMatch = endpoint.match( /^\/products\/(\d+)$/ );
		const ruleMatch = endpoint.match( /^\/rules\/(\d+)$/ );
		if ( productMatch ) { return json( res, products.find( ( product ) => product.id === Number( productMatch[ 1 ] ) ) ); }
		if ( ruleMatch ) {
			const id = Number( ruleMatch[ 1 ] );
			if ( req.method === 'DELETE' ) { delete families[ id ]; return json( res, null ); }
			if ( req.method === 'PUT' ) { families[ id ] = { product: body.product, variations: body.variations }; }
			if ( ! families[ id ] ) { return json( res, { message: 'Rule not found.' }, 404 ); }
			return json( res, { ...families[ id ], target: products.find( ( product ) => product.id === id ) } );
		}
		if ( endpoint === '/rules' && req.method === 'POST' ) {
			if ( families[ body.product_id ] ) { return json( res, { message: 'This product family already has a rule.' }, 409 ); }
			families[ body.product_id ] = { product: body.product, variations: body.variations }; return json( res, families[ body.product_id ], 201 );
		}
		if ( endpoint === '/rules' || endpoint === '/products' ) {
			const search = ( url.searchParams.get( 'search' ) || '' ).toLowerCase();
			let list = products.filter( ( product ) => ( endpoint === '/products' || families[ product.id ] ) && `${ product.name } ${ product.sku } ${ product.id }`.toLowerCase().includes( search ) );
			let filters = []; try { filters = JSON.parse( url.searchParams.get( 'filters' ) || '[]' ); } catch {}
			for ( const filter of filters ) { list = list.filter( ( item ) => item[ filter.field ] === filter.value ); }
			const page = Number( url.searchParams.get( 'page' ) ) || 1;
			const perPage = Number( url.searchParams.get( 'per_page' ) ) || 20;
			return json( res, { items: list.slice( ( page - 1 ) * perPage, page * perPage ), pagination: { page, perPage, totalItems: list.length, totalPages: Math.max( 1, Math.ceil( list.length / perPage ) ) } } );
		}
		return json( res, { message: 'Unknown fixture endpoint.' }, 404 );
	}
	res.writeHead( 200, { 'Content-Type': 'text/html; charset=utf-8' } );
	res.end( `<!doctype html><html lang="en" dir="${ url.searchParams.get( 'rtl' ) ? 'rtl' : 'ltr' }"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shipping workspace test</title><link rel="stylesheet" href="/wp-admin/css/common.min.css"><link rel="stylesheet" href="/wp-admin/css/forms.min.css"><link rel="stylesheet" href="/wp-admin/css/admin-menu.min.css"><link rel="stylesheet" href="/assets/js/syzepps-backend${ url.searchParams.get( 'rtl' ) ? '-rtl' : '' }.css"><style>body{margin:0;background:#f0f0f1;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#wpadminbar{height:32px;background:#1d2327;color:#c3c4c7;display:flex;align-items:center;padding:0 18px;font-size:12px}#adminmenu{position:absolute;top:32px;bottom:0;width:160px;background:#1d2327;color:#c3c4c7;padding-top:16px}#adminmenu div{padding:12px 18px;font-size:12px}#adminmenu .active{color:white;background:#2271b1}#wpcontent{margin-left:160px}button,input{font:inherit}@media(max-width:782px){#adminmenu{display:none}#wpcontent{margin-left:0}#wpadminbar{height:46px}}</style></head><body class="wp-admin wp-core-ui"><div id="wpadminbar">WordPress &nbsp; / &nbsp; Syzenlabs Studio</div><aside id="adminmenu" aria-label="WordPress menu"><div>Dashboard</div><div>Posts</div><div>Media</div><div>Pages</div><div>Comments</div><div class="active">WooCommerce</div><div>Products</div><div>Analytics</div><div>Appearance</div><div>Plugins</div><div>Settings</div></aside><div id="wpcontent"><div id="syzepps-dashboard-wrap" class="syzepps-admin"></div></div><script src="/wp-includes/js/dist/vendor/react.min.js"></script><script src="/wp-includes/js/dist/vendor/react-dom.min.js"></script><script src="/wp-includes/js/dist/vendor/react-jsx-runtime.min.js"></script><script src="/wp-includes/js/dist/hooks.min.js"></script><script src="/wp-includes/js/dist/i18n.min.js"></script><script src="/wp-includes/js/dist/element.min.js"></script><script>window.syzeppsAdmin={nonce:'fixture-nonce',shippingZonesUrl:'/shipping-zones',currency:'USD',version:'1.0.0',storeName:'Syzenlabs Studio'};window.wp.apiFetch=async function(options){const response=await fetch('/wp-json'+options.path,{method:options.method||'GET',signal:options.signal,body:options.body||(options.data?JSON.stringify(options.data):undefined),headers:options.data?{'Content-Type':'application/json'}:{}});const result=await response.json();if(!response.ok)throw result;return result;};wp.apiFetch.use=function(){};wp.apiFetch.createNonceMiddleware=function(){return function(){};};</script><script src="/assets/js/syzepps-backend.js"></script></body></html>` );
} );
server.listen( 8138, '127.0.0.1' );
