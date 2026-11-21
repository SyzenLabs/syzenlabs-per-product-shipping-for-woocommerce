/* eslint-env jest */
import {
	costValue,
	validateFamily,
	moveRow,
	emptyFamily,
	updateDestination,
} from './rules';

describe( 'shipping editor data safety', () => {
	it( 'preserves zero and maps legacy per-item and per-line costs', () => {
		expect( costValue( { cost: '0' }, 'item_cost', 'per_item' ) ).toBe(
			'0'
		);
		expect( costValue( { cost: '12' }, 'line_cost', 'per_line' ) ).toBe(
			'12'
		);
		expect( costValue( { line_cost: '0', cost: '12' }, 'line_cost' ) ).toBe(
			'0'
		);
		expect( costValue( { cost: '12' }, 'item_cost', 'per_line' ) ).toBe(
			''
		);
	} );

	it( 'requires a cost in every destination row but accepts zero', () => {
		const family = emptyFamily();
		family.product.rules = [ { line_cost: '', item_cost: '' } ];
		expect( validateFamily( family ) ).toBe( 'destination' );
		family.product.rules[ 0 ].item_cost = '0';
		expect( validateFamily( family ) ).toBe( '' );
	} );

	it.each( [ '-1', 'Infinity', 'NaN', ' ', 'abc' ] )(
		'rejects invalid cost %s',
		( cost ) => {
			const family = emptyFamily();
			family.product.rules = [ { line_cost: cost, item_cost: '' } ];
			expect( validateFamily( family ) ).toBe( 'destination' );
		}
	);

	it( 'validates fallbacks and only enabled variation overrides', () => {
		const family = emptyFamily();
		family.product.fallback_cost = '-2';
		expect( validateFamily( family ) ).toBe( 'fallback' );
		family.product.fallback_cost = '';
		family.variations[ 12 ] = {
			enable_per_variation_shipping: false,
			rules: [ { line_cost: '-1' } ],
		};
		expect( validateFamily( family ) ).toBe( '' );
		family.variations[ 12 ].enable_per_variation_shipping = true;
		expect( validateFamily( family ) ).toBe( 'destination' );
	} );

	it( 'moves priorities without mutating rows or dropping boundary rows', () => {
		const rows = [ { id: 'a' }, { id: 'b' }, { id: 'c' } ];
		expect( moveRow( rows, 0, 2 ).map( ( row ) => row.id ) ).toEqual( [
			'b',
			'c',
			'a',
		] );
		expect( moveRow( rows, 0, -1 ) ).toEqual( rows );
		expect( moveRow( rows, 2, 3 ) ).toEqual( rows );
		expect( rows.map( ( row ) => row.id ) ).toEqual( [ 'a', 'b', 'c' ] );
	} );
} );

describe( 'backend-produced legacy destinations', () => {
	it( 'renders and validates legacy costs with explicit empty line/item fields', () => {
		const row = { cost: '9.50', line_cost: '', item_cost: '' };
		expect( costValue( row, 'line_cost', 'per_order' ) ).toBe( '9.50' );
		expect( costValue( row, 'item_cost', 'per_item' ) ).toBe( '9.50' );
		const family = emptyFamily();
		family.product.rules = [ row ];
		expect( validateFamily( family ) ).toBe( '' );
	} );
	it( 'retains legacy calculation for location edits and normalizes cost edits', () => {
		const row = {
			cost: '9.50',
			line_cost: '',
			item_cost: '',
			country: 'US',
		};
		expect(
			updateDestination( row, 'country', 'CA', 'per_order' )
		).toEqual( { ...row, country: 'CA' } );
		const converted = updateDestination(
			row,
			'item_cost',
			'2.00',
			'per_item'
		);
		expect( converted ).toEqual( {
			line_cost: '',
			item_cost: '2.00',
			country: 'US',
		} );
		expect(
			costValue(
				{ cost: '8', line_cost: '2', item_cost: '' },
				'item_cost',
				'per_item'
			)
		).toBe( '' );
	} );
} );
