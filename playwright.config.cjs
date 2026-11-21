const { defineConfig } = require( '@playwright/test' );
module.exports = defineConfig( {
	testDir: './tests/admin',
	testMatch: '**/*.spec.cjs',
	fullyParallel: false,
	workers: 1,
	timeout: 25000,
	expect: { timeout: 6000 },
	use: { baseURL: 'http://127.0.0.1:8138', browserName: 'chromium', channel: require( 'node:fs' ).existsSync( '/opt/google/chrome/chrome' ) && ! process.env.SYZEPPS_CHROMIUM_PATH ? 'chrome' : undefined, launchOptions: { executablePath: process.env.SYZEPPS_CHROMIUM_PATH || undefined }, headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
	reporter: [ [ 'list' ] ],
	outputDir: '/tmp/syzepps-premium-admin/test-results',
	webServer: { command: 'node tests/admin/server.cjs', url: 'http://127.0.0.1:8138', reuseExistingServer: false },
} );
