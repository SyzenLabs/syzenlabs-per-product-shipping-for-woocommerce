import gulp from 'gulp';
import zip from 'gulp-zip';
import { deleteAsync } from 'del';
import { existsSync } from 'node:fs';

const slug = 'syzenlabs-per-product-shipping';

export async function cleanPackage() {
	await deleteAsync( [ 'build' ] );
}

export function copyPackage() {
	const files = [
		'assets/**/*',
		'includes/**/*.php',
		'syzenlabs-per-product-shipping.php',
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

export const packageTask = gulp.series(
	cleanPackage,
	copyPackage,
	archivePackage
);
export { packageTask as package };
export const packageCi = packageTask;
export { packageCi as 'package-ci' };
export default packageTask;
