import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import sassGlob from 'gulp-sass-glob';
import autoprefixer from 'gulp-autoprefixer';
import rename from 'gulp-rename';
import zip from 'gulp-zip';
import { deleteAsync } from 'del';
import { existsSync } from 'node:fs';

const compileSass = gulpSass( sass );
const slug = 'syzenlabs-per-product-shipping-for-woocommerce';

export function styles() {
	return gulp
		.src( 'src/scss/backend.scss' )
		.pipe( sassGlob() )
		.pipe(
			compileSass
				.sync( { outputStyle: 'compressed' } )
				.on( 'error', compileSass.logError )
		)
		.pipe( autoprefixer() )
		.pipe( rename( 'syzepps-backend.css' ) )
		.pipe( gulp.dest( 'assets/css' ) );
}
export function dataViewsStyles() {
	return gulp
		.src( 'node_modules/@wordpress/dataviews/build-style/style.css' )
		.pipe( rename( 'syzepps-backend-datatable.css' ) )
		.pipe( gulp.dest( 'assets/css' ) );
}

export function dataViewsStylesRtl() {
	return gulp
		.src( 'node_modules/@wordpress/dataviews/build-style/style-rtl.css' )
		.pipe( rename( 'syzepps-backend-datatable-rtl.css' ) )
		.pipe( gulp.dest( 'assets/css' ) );
}

export const dataViewsStylesAll = gulp.series(
	dataViewsStyles,
	dataViewsStylesRtl
);

export function watch() {
	gulp.watch( 'src/scss/**/*.scss', styles );
}

export async function cleanPackage() {
	await deleteAsync( [ 'build' ] );
}

export function copyPackage() {
	const files = [
		'assets/**/*',
		'includes/**/*.php',
		'syzenlabs-per-product-shipping-for-woocommerce.php',
		'uninstall.php',
		'readme.txt',
		'!assets/**/*.map',
	];
	if ( existsSync( 'languages' ) ) {
		files.push( 'languages/**/*' );
	}
	if ( existsSync( 'traits' ) ) {
		files.push( 'traits/**/*.php' );
	}
	return gulp
		.src( files, { base: '.', allowEmpty: true } )
		.pipe( gulp.dest( `build/${ slug }` ) );
}

export function archivePackage() {
	return gulp
		.src( `build/${ slug }/**/*`, { base: 'build', allowEmpty: false } )
		.pipe( zip( `${ slug }.zip` ) )
		.pipe( gulp.dest( 'build' ) );
}

export const build = gulp.series( styles, dataViewsStylesAll );
export const packageTask = gulp.series(
	cleanPackage,
	copyPackage,
	archivePackage
);
export { packageTask as package };
export const packageCi = packageTask;
export { packageCi as 'package-ci' };
export default build;
