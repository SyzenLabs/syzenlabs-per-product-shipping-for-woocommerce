export const emptyFamily = () => ( {
	product: {
		adjust_shipping_costs: false,
		calculation_mode: 'per_line',
		quantity_step: 1,
		fallback_cost: '',
		rules: [],
	},
	variations: {},
} );

export function costValue( row, field, mode = 'per_line' ) {
	const legacy =
		row.cost !== undefined &&
		row.cost !== null &&
		( row.line_cost ?? '' ) === '' &&
		( row.item_cost ?? '' ) === '';
	if ( legacy ) {
		return field === ( mode === 'per_item' ? 'item_cost' : 'line_cost' )
			? row.cost
			: '';
	}
	return row[ field ] ?? '';
}

export function updateDestination( row, field, value, mode ) {
	if ( ! [ 'line_cost', 'item_cost' ].includes( field ) ) {
		return { ...row, [ field ]: value };
	}
	const next = {
		...row,
		line_cost: costValue( row, 'line_cost', mode ),
		item_cost: costValue( row, 'item_cost', mode ),
		[ field ]: value,
	};
	delete next.cost;
	delete next.cost_type;
	return next;
}

const validCost = ( cost ) =>
	String( cost ).trim() !== '' &&
	Number.isFinite( Number( cost ) ) &&
	Number( cost ) >= 0;

export function validateFamily( family ) {
	const records = [
		family.product,
		...Object.values( family.variations || {} ).filter(
			( record ) => record.enable_per_variation_shipping
		),
	];
	for ( const record of records ) {
		if (
			record.fallback_cost !== '' &&
			record.fallback_cost !== null &&
			record.fallback_cost !== undefined &&
			! validCost( record.fallback_cost )
		) {
			return 'fallback';
		}
		for ( const row of record.rules || [] ) {
			const costs = [
				costValue( row, 'line_cost', record.calculation_mode ),
				costValue( row, 'item_cost', record.calculation_mode ),
			];
			if (
				costs.every( ( cost ) => cost === '' ) ||
				costs.some( ( cost ) => cost !== '' && ! validCost( cost ) )
			) {
				return 'destination';
			}
		}
	}
	return '';
}

export function moveRow( rows, from, to ) {
	if ( from < 0 || to < 0 || from >= rows.length || to >= rows.length ) {
		return rows;
	}
	const next = [ ...rows ];
	const [ row ] = next.splice( from, 1 );
	next.splice( to, 0, row );
	return next;
}
