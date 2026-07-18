const fs = require( 'fs' );
const path = require( 'path' );

const root = path.resolve( __dirname, '..' );
const packagePath = path.join( root, 'package.json' );
const pluginPath = path.join( root, 'syzenlabs-per-product-shipping-for-woocommerce.php' );
const readmePath = path.join( root, 'readme.txt' );
const packageJson = JSON.parse( fs.readFileSync( packagePath, 'utf8' ) );
const version = process.argv[ 2 ] || packageJson.version;

if ( ! /^\d+\.\d+\.\d+$/.test( version ) ) {
	throw new Error( 'Use a semantic version such as 1.0.1.' );
}

const readme = fs
	.readFileSync( readmePath, 'utf8' )
	.replace( /Stable tag: \d+\.\d+\.\d+/, `Stable tag: ${ version }` );
if ( ! readme.includes( `= ${ version } =` ) ) {
	throw new Error( `Add a ${ version } changelog entry to readme.txt first.` );
}

packageJson.version = version;
const plugin = fs
	.readFileSync( pluginPath, 'utf8' )
	.replace( /Version:\s+\d+\.\d+\.\d+/, `Version:     ${ version }` )
	.replace(
		/define\( 'SYZEPPS_VER', '\d+\.\d+\.\d+' \);/,
		`define( 'SYZEPPS_VER', '${ version }' );`
	);

fs.writeFileSync(
	packagePath,
	`${ JSON.stringify( packageJson, null, '\t' ) }\n`
);
fs.writeFileSync( pluginPath, plugin );
fs.writeFileSync( readmePath, readme );
