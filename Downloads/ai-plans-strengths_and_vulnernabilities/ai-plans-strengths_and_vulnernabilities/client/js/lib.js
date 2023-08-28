import env from './env.js?v=146'
import hal from './hal.js?v=146'






const colors = {
	cred: 'rgb(255, 210, 100)',
}

const click_parent = ( start_ele, target_class, target_id, depth ) => {
	if( target_class && start_ele.classList.contains( target_class )){
		return start_ele
	}else if( target_id && start_ele.id === target_id ){
		return start_ele
	}
	let condition
	for( let i = 0; i< depth; i++ ){
		if( !start_ele.parentElement ) return //console.log('click parent found no parent matching: ', target_class, target_id )
		condition = false
		if( target_class ){
			condition = start_ele.parentElement?.classList.contains( target_class )
		}else if( target_id ){
			condition = start_ele.parentElement?.id === target_id
		}
		if( condition ){
			return start_ele.parentElement
		}else{
			start_ele = start_ele.parentElement
		}
	}
}



function capitalize( word ){

	if( typeof( word ) !== 'string' ) return false

	let v = word.substr( 1 )

	word = word[0].toUpperCase() + v

	return word

}



function random_hex( len ){

	//	let r = '#' + Math.floor( Math.random() * 16777215 ).toString(16)
	let s = ''
	
	for( let i = 0; i < len; i++){
		s += Math.floor( Math.random() * 16 ).toString( 16 )
	}
	
	return s

}

function iso_to_ms( iso ){

	let isoTest = new RegExp( /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/ )

    if( isoTest.test( str ) ){
    	return new Date( iso ).getTime()
    }
    return false 

}

function ms_to_iso( ms ){

	if( typeof( ms ) !=  'number' )  return false

	return new Date( ms ).toISOString()

}


function is_valid_uuid( data ){

	if( typeof( data === 'string' ) && data.length > 10 ) return true
	return false

}


function getBaseLog(x, y) {

	return Math.log(y) / Math.log(x)

}

function scry( x, old_min, old_max, new_min, new_max ){

	const first_ratio = ( x - old_min ) / ( old_max - old_min )
	const result = ( first_ratio * ( new_max - new_min ) ) + new_min
	return result
}



// const ORIGIN = window.ORIGIN =  new Vector3(0, 0, 0)






// selection.add( this.mesh )





function validate_number( ...vals ){

	for( const num of vals ){
		if( typeof num === 'number' || ( num && typeof Number( num ) === 'number' ) ) return Number( num )
	}
	return vals[ vals.length - 1 ]

}



const random_range = ( low, high, int ) => {

	if( low >= high ) return low

	return int ? Math.floor( low + ( Math.random() * ( high - low ) ) ) : low + ( Math.random() * ( high - low ) )

}

const random_entry = source => {

	if( Array.isArray( source )){
		return source[ random_range( 0, source.length - 1, true ) ]
	}else if( source && typeof source === 'object'){
		return source[ random_entry( Object.keys( source ) ) ]
	}
	return ''
}










const return_fail = ( console_msg, hal_msg, hal_type ) => {
	console.log( console_msg )
	if( hal_msg ) hal( hal_type || 'error', hal_msg, 4000 )
	return false
}



const to_alphanum = ( value, loose ) => {
	if( typeof value !== 'string' ) return false
	if( loose ){
		return value.replace(/([^a-zA-Z0-9 _-|.|\n|!])/g, '')
	}else{
		return value.replace(/([^a-zA-Z0-9 _-])/g, '')
	}
}



const is_unix_timestamp = timestamp => { // returns true if correct string or number length
	if( typeof timestamp === 'number' ){
		return String( timestamp ).length === 10
	}else if( typeof timestamp === 'string' && timestamp.length === 10 && typeof Number( timestamp ) === 'number' ){
		return true
	}
	return false
}



const MAPS = {
	interest_keys24: {
		ath: 'all time high',
		current_price: 'current price',
		high_24h: '24 hour high',
		low_24h: '24 hour low',
		price_change_24h: '24 hour price change',
	},
	timespans: {
		day: 'daily',
		week: 'weekly',
		month: 'monthly',
		year: 'annual',
	},
	actions: {
		day: 'symbol_current',
		week: 'symbol_history',
		month: 'symbol_history',
		year: 'symbol_history',
	}
}


const serialize  = form => { // = window.pal_serialize
	return new URLSearchParams( new FormData( form ) ).toString()
}


const is_valid_email = email => {
	return typeof email === 'string' && email.match(/.*@..*\..*/)
}





const trimStrict = string => {
    // Remove leading spaces
    while(string.indexOf(' ') === 0) {
        string = string.substr(1);
    }
    // Remove trailing spaces
    while(string[string.length-1] === ' ') {
        string = string.substr(0, string.length-1);
    }
    return string;
}



const generate_content = len => {
	len = len || 50
	const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
	return lorem.substr(0, len ) + '....'
}



const get_index = ( nodeList, ele ) => {
	for( let i = 0; i < nodeList.length; i++ ){
		if( nodeList[i] === ele ) return i
	}
}

const shift_element = window.shift_element = ( dir, ele, identifier, cycle ) => {
	/*
		***
		'dir' refers to -index order-, not screen space or DOM order
		***
	*/
	if( !ele ){
		console.log('missing ele for shift')
		return
	}
	const siblings = ele.parentElement.querySelectorAll( identifier )
	if( !siblings?.length ){
		console.log('no siblings for shift')
		return
	}

	const index = get_index( siblings, ele )
	if( typeof index !== 'number' ){
		console.log('invalid move', ele, index)
		return
	}
	let prev_sib = siblings[ index - 1 ]
	let next_sib = siblings[ index + 2 ]

	console.log( 'shift index :', dir, !!prev_sib )

	switch( dir ){

		case 'up':
			/*
				[parent] insertBefore [insertion node] [reference node]
			*/
			if( !next_sib ){
				if( siblings[ index + 1 ]){
					ele.parentElement.appendChild( ele )
					return
				}else if( cycle ){
					ele.parentElement.insertBefore( ele, siblings[0] )
					return
				}
			}
			ele.parentElement.insertBefore( ele, next_sib )
			break;

		case 'down':
			if( !prev_sib ){
				if( !cycle ){ // because null child ref will still work otherwise
					console.log('no prev sib for shift')
					return
				}else{
					/*
						this assumes that there is no other content in parentElement
						in some cases this could be bad
					*/
					ele.parentElement.appendChild( ele )
					return
				}
			}
			ele.parentElement.insertBefore( ele, prev_sib )
			break;

		default: 
			console.log('invalid shift dir', dir )
			break;

	}

}





function convertToHex(value) {
  if (value.startsWith('rgb')) {
    // If value is RGB, extract the red, green, and blue values
    const rgbValues = value.match(/\d+/g);
    const red = parseInt(rgbValues[0]);
    const green = parseInt(rgbValues[1]);
    const blue = parseInt(rgbValues[2]);

    // Convert the RGB values to hex and concatenate them
    const hexValue = '#' + ((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0');
    return hexValue;
  } else if (value.startsWith('#')) {
    // If value is already a hex value, return it
    return value;
  } else {
    // Otherwise, assume it's an invalid input
    // throw new Error('Invalid input');
    console.error('invalid color convert: ' + value )
  }
}

const is_hex_color = color => {
	return ( typeof color === 'string' && !color.match(/[g-z]/i) && color.length >= 6 && color.length <= 9 )
}

const char_map = {
	a: 10,
	b: 11,
	c: 12,
	d: 13,
	e: 14,
	f: 15,
}

const offset_color = ( color, contrast_bool, add_alpha ) => {
	
	color = convertToHex( color || '#000000' )

	if( !is_hex_color( color ) ){
		console.log('invalid hex color: ', color )
		return contrast_bool ? '#000000' : '#222222'
	}

	let c = color.replace('#', '').substr(0,6)

	// console.log('testing bg color: ', color, c )

	let num
	const rgb = {r: 0, g: 0, b: 0}
	for( let i = 0; i < c.length; i++ ){

		const n = Number( c[i] )

		if( typeof n === 'number' && !isNaN( n ) ){
			num = n
		}else if( char_map[ c[i] ]){
			num = char_map[ c[i] ]
		}else{
			num = 0
			// console.log('invalid num', n )
		}

		// console.log(`adding index ${ i } color: ${ num }`)

		if( i < 2 ){ // red
			rgb.r += ( i === 0 ) ? num * 16 : num
		}else if( i < 4 ){ // green
			rgb.g += ( i === 2 ) ? num * 16 : num
		}else{ // blue
			rgb.b += ( i === 4 ) ? num * 16 : num
		}

	}

	// console.log(`rgb res:`, rgb )

	// https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
	const computed = ( rgb.r * .299 ) + ( rgb.g * .587 ) + ( rgb.b * .114 )

	let val

	if( computed > 150 ){ // 186 standard
		val = contrast_bool ? '#000000' : '#222222'
	}else{
		val = contrast_bool ? '#ffffff' : '#dddddd'
	}

	if( add_alpha ){
		val += add_alpha
	}

	return val

}



const b = ( type, id, ...classes ) => {
	const ele = document.createElement( type )
	if( id ) ele.id = id
	for( const c of classes ){
		ele.classList.add( c )
	}
	return ele
}





const make_debounce = ( fn, time, immediate, context_args ) => {
    let buffer
    return ( args ) => {
        if( !buffer && immediate ) fn( args, context_args )
        clearTimeout( buffer )
        buffer = setTimeout(() => {
            fn( args, context_args )
            buffer = false
        }, time )
    }
}






const ALL_DROPS = {}
const clear_drops = e => {
	// check if click was on drop
	let c = 0
	let ele = e.target
	while( c < 5 ){
		if( ele?.classList?.contains('drop-scroller') || !ele.parentElement ){
			c = 5
			return console.log('clicked drop')
		}
		ele = ele.parentElement
		c++
	}
	for( const drop of document.body.querySelectorAll('.drop-scroller') ){
		const d = ALL_DROPS[ drop.getAttribute('data-uuid') ]
		if( !d ){
			console.log('drop is in DOM but not mem', drop)
			// continue
		}
		d.remove( false, false, 'clear all' )
	}
}


class DropOptions {
	/*
		take [options] as input
		call with every new result set; not meant for re-use
		simply shows it; no callbacks assigned
	*/

	constructor( init ){

		init = init || {}

		this.uuid = random_hex(6)
		ALL_DROPS[ this.uuid ] = this

		// required:
		this.input = init.input
		this.options = init.options
		// this.source_input = init.source_input

		// elements:
		this.scroller = b('div', false, 'drop-scroller')
		this.scroller.setAttribute('data-uuid', this.uuid )
		this.interior = b('div', false, 'drop-interior')
		for( const opt of this.options ){
			const o = b('div', false, 'drop-option')
			o.innerText = opt.text
			this.interior.append( o )
		}
		if( !this.options?.length ){
			const o = b('div', false, 'drop-option')
			o.innerHTML = '(no results)'
			this.interior.append( o )
		}
		this.scroller.append( this.interior )

		/*
			provide 'clear_'s to enforce valid entries
			- the presence of the attr on the source = valid
			- if !valid, source will be cleared
		*/
		this.clear_source = init.clear_source
		this.clear_attr = init.clear_attr
		if( this.clear_attr && !this.clear_source ) console.error('must provide source for clear attr in DropOption')

		this.scroller.addEventListener('click', e => {
			if( !e.target.classList.contains('drop-option') ){
				this.remove( false, false, 'click off')
				return console.log('invalid click')
			}
			const v = e.target.innerText.trim()
			if( v.match(/no results/i) ){
				return this.remove( false, true, 'no-results click' )
			}
			// this.source_input.setAttribute('data-source', v )
			// this.source_input.value = v
			this.clear_source.setAttribute('data-source', v )
			this.clear_source.value = v
			this.remove( true, false, 'is valid' )
		})

		// instantiated
		this._adjusting = false
		
	}

	set_pos( target ){
		const bounds = target.getBoundingClientRect()
		this.scroller.style.top = ( bounds.top + bounds.height ) +  'px'
		this.scroller.style.left = bounds.left + 'px'
		this.scroller.style.width = bounds.width + 'px'		
	}

	show( target ){
		target = target || this.input
		// blank slate
		for( const uuid in ALL_DROPS ){
			ALL_DROPS[ uuid ].remove( false, true, 'show clear' )
		}
		// then show this one
		ALL_DROPS[ this.uuid ] = this
		this.set_pos( target )
		this._adjusting = setInterval(() => {
			this.set_pos( target )
		}, 100 )
		document.body.append( this.scroller )
		document.body.addEventListener('click', clear_drops )
		// if( this.clear_source ){
		// 	this.clear_source.addEventListener('blur', clear_drops )
		// }
	}

	remove( is_valid, still_typing, caller ){
		// remove dropdown
		this.scroller.remove()
		clearInterval( this._adjusting )
		delete ALL_DROPS[ this.uuid ]
		// optionally clear source
		if( this.clear_source ){
			if( is_valid || still_typing ){
				// valid
				console.log('DropOption: ', is_valid ? 'valid' : '', still_typing ? 'still typing' : '', caller )
			}else{
				// invalid
				this.clear_source.removeAttribute( this.clear_attr )
				this.clear_source.value = ''
				console.log('DropOption: ', 'remove')
			}
		}else{
			console.log('DropOption: ', 'vanilla')
		}
		document.body.removeEventListener('click', clear_drops )
	}

}





const show_limit_count = ( wc, element, limit ) => {

	// check too many
	let count
	switch( limit.type ){
	case 'word':
		if( element.value ){
			count = element.value.trim().split(' ').length
		}else{
			count = 0
		}
		break;
	case 'char':
		count = element?.value ? element.value.length : 0
		break;
	default: 
		return console.error('invalid limit type: ', limit )
	}

	const remaining = limit.max - count 
	// wc.innerText = remaining + ' words remaining'
	wc.innerText = `${ remaining } ${ limit.type }s remaining`
	if( remaining < 0 ){
		wc.classList.add('overboard')
	}else{
		wc.classList.remove('overboard')
		// check not enough
		if( limit.min ){
			const missing = count - limit.min
			if( missing < 0 ){
				wc.classList.add('overboard')
				wc.innerText = `${ (-missing) } ${ limit.type }s missing`
			}else{
				wc.classList.remove('overboard')
			}	
		}
	}

	if( limit.cling ){
		const offset = 20
		const bounds = element.getBoundingClientRect()
		wc.style.bottom = ( window.innerHeight - ( bounds.top + bounds.height ) - offset ) + 'px'
		wc.style.right = ( window.innerWidth - ( bounds.left + bounds.width ) ) + 'px'
	}

}

const count_element_words = element => {
	return ( element.value.trim().split(' ')[0] ? element.value.trim().split(' ').length : 0 )
}


const add_length_count = window.awc = ( wrapper, element, limit ) => {

	if( element.type !== 'text' && !element.nodeName.match(/textarea/i) ){
		return console.log('invalid word_count node: ', element )
	}
	if( typeof limit !== 'object') return console.log('add_length_count takes object limit')

	if( !element.setAttribute ){
		console.log( 'skipping word count here', element )
	}else{
		element.setAttribute('data-word-limit', limit.max )
	}

	const wc = document.createElement('div')
	wc.classList.add('word-count')
	if( limit.cling ){
		wc.classList.add('clingy')
	}

	wrapper.appendChild( wc )

	let listening

	element.addEventListener('focus', e => {
		if( limit ){
			console.log( limit )
			show_limit_count( wc, element, limit, false )
		}else{
			switch( limit.type ){
			case 'word':
				wc.innerText = count_element_words( element ) + ' words'
				break;
			case 'char':
				wc.innerText = `${ element?.value?.length || 0 } chars`
				break;
			default: 
				return console.error('invalid limit type', limit )
			}
		}
		wc.classList.remove('hidden')
	})

	element.addEventListener('blur', e => {
		wc.innerText = ''
		wc.classList.add('hidden')
	})

	element.addEventListener('keyup', e => {
		if( !listening ){
			listening = setTimeout(() => {
				// console.log( limit, element.value )
				if( limit?.block_empty && !element.value ){
					wc.innerText = 'element cannot be empty'
					wc.classList.add('overboard')
				}else if( limit ){
					show_limit_count( wc, element, limit, false )
				}else{
					switch( limit.type ){
					case 'word':
						wc.innerText = count_element_words( element ) + ' words'
						break;
					case 'char':
						wc.innerText = `${ element?.value?.length || 0 } chars`
						break;
					default: 
						return console.error('invalid limit type', limit )
					}
				}
				clearTimeout( listening )
				listening = false
			}, 500 )
		}
	})
}





const header_ele = document.querySelector('#header')
const is_logged = header_ele && header_ele.getAttribute('data-auth') === 'true'
const is_admin = header_ele && header_ele.getAttribute('data-admin') === 'true'


const sleep = async( ms ) => {
	await new Promise( resolve => setTimeout( resolve, ms ) )
}



export {
	is_logged,
	is_admin,

	// ensureHex,
	capitalize,
	random_hex,
	iso_to_ms,
	ms_to_iso,
	getBaseLog,
	scry,
	is_valid_uuid,
	
	validate_number,
	random_entry,
	random_range,
	// ORIGIN,

	return_fail,

	to_alphanum,
	colors,

	is_unix_timestamp,

	is_valid_email,

	serialize,

	trimStrict,
	generate_content,
	shift_element,
	get_index,
	offset_color,
	is_hex_color,
	b,
	click_parent,
	make_debounce,

	convertToHex,

	DropOptions,
	add_length_count,
	sleep,
}