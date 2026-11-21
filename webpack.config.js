const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

// Retain WordPress Babel, PostCSS, dependency extraction, and webpack defaults.
module.exports = {
	...defaultConfig,
	entry: { 'syzepps-backend': './src/index.js' },
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'assets/js' ),
		filename: '[name].js',
		chunkFilename: '[name].[contenthash:8].js',
		uniqueName: 'syzeppsAdmin',
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve?.alias,
			'@': path.resolve( __dirname, 'src' ),
		},
	},
};
