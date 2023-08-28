const validator = require('email-validator')
const p_validator = require('password-validator')
const SOCKETS = require('./SOCKETS.js')
const DATA_PRIVATE = require('./data/PRIVATE.js')
const DATA_PUBLIC = require('./data/PUBLIC.js')
const schema = new p_validator()
const name_schema = new p_validator()
const env = require('./.env.js')
const log = require('./log.js')
const PUBLIC = require('./data/PUBLIC.js')



log('call', 'lib.js')

 
// Add properties to it
schema
	.is().min(6)                                    // Minimum length 8
	.is().max(30)                                   // Maximum length 100
	// .has().uppercase()                           // Must have uppercase letters
	// .has().lowercase()                           // Must have lowercase letters
	// .has().digits()                              // Must have digits
	.has().not().spaces()                           // Should not have spaces
	.is().not().oneOf(['password', 'Passw0rd', 'Password123'])


name_schema
	.is().min(3)
	.is().max(25)
	.has().not().spaces()
	.has().not().digits()



const static_chars = ['≢', '≒', '≓', '≎', '∿', '⦕', '⦖', '⦚', '⨌']


const get_public = () => {

	const r = {}

	Object.keys( this ).forEach( key => {
		if( !key.match(/^_/) && key != 'get_public' ){
			r[key] = this[key]
		}
	})

	return r

}

const check_collision = ( vector1, vector2, radius1, radius2, distance ) => {

	const dist = vector1.distanceTo( vector2 )
	if( dist < radius1 + radius2 + distance ){
		return true
	}
	return false

}

const iso_to_ms = ( iso ) => {

	let isoTest = new RegExp( /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/ )

    if( isoTest.test( str ) ){
    	return new Date( iso ).getTime()
    }
    return false 

}

const ms_to_iso = ( ms ) => {

	if( typeof( ms ) !=  'number' )  return false

	return new Date( ms ).toISOString()

}

const random_hex = ( len ) => {

	//	let r = '#' + Math.floor( Math.random() * 16777215 ).toString(16)
	let s = ''
	
	for( let i = 0; i < len; i++){
		
		s += Math.floor( Math.random() * 16 ).toString( 16 )

	}
	
	return s

}

const random_int = ( start, range ) => {

	return start + Math.floor( Math.random() * range )

}

const random_offset = ( center, range ) => {

	return center + ( Math.floor( Math.random() * range ) - ( range / 2 ) )

}

const is_num = value => {
	const coercedValue = Number(value);
	return typeof coercedValue === 'number' && !isNaN(coercedValue) && !isNaN(parseFloat(value));
};


const is_valid_id = ( test ) => {
	return ( typeof( test ) === 'number' && test > 0 )
}

const is_valid_email  = ( email ) => {

	return validator.validate( email )

}

const is_valid_password = ( password ) => {

	if( password.match(/^null$/i) ){
		log('flag', 'cant use null as pw')
		return false
	}

	return schema.validate( password + '' )

}






const sanitize_packet =( packet ) => {

	return packet

}


const jarble_chat =( chat ) => {

	log('flag', 'jarbling: ', chat )

	const r = []
	for( const key of chat ) {
	    if( Math.random() > .5 ){
	        r.push( static_chars[ Math.floor( Math.random() * static_chars.length ) ])
	    }else{
	        r.push( key )
	    }
	}
	chat = ''
	r.forEach( i => {
	    chat += i
	})

	log('flag', 'returned: ', chat )

	return chat
}








const is_valid_name = ( name ) => {

	let valid = true

	if( !name ) valid = false

	if( typeof( name ) !== 'string' || name.length > DATA_PRIVATE.name_length ) return false // yes skip the log here, could be huge

	if( name.match(/^null$/i) ) valid = false

	if( !name_schema.validate( name + '' ) ) valid = false

	if ( !/^([a-zA-Z]|\'|-)*$/g.test( name ) ) valid = false

	if( !valid ) {
		log('flag', 'name regex failed: ', name )
		return false
	}

	return true

}


function validate_number( ...vals ){

	for( const num of vals ){
		if( typeof num === 'number' || ( ( num && typeof Number( num ) === 'number' ) && !isNaN( Number( num ) ) ) ) return Number( num )
	}
	return vals[ vals.length - 1 ]

}



function validate_date( ...vals ){

	let test
	for( const val of vals ){
		test = new Date( val )
		if( !test.toString().match(/invalid/i) ) return new Date( val )
	}
	return vals[ vals.length - 1 ]

}



function validate_string( ...vals ){

	for( const str of vals ){
		if( typeof( str ) === 'string' ) return str
	}
	return vals[ vals.length - 1 ]

}


function merge_results_to_object( existing_obj, incoming_arr, hydrateClass ){
	const valid_keys = []
	let found
	for( const item of incoming_arr ){
		found = false
		for( const key of Object.keys( existing_obj )){
			if( existing_obj[ key ]._id === item.id ){
				found = key
				valid_keys.push( key )
			}
		}
		if( !found ){
			let new_object = new hydrateClass( item )
			existing_obj[ new_object.uuid ] = new_object
			valid_keys.push( new_object.uuid )
		}
	}
	for( const key of Object.keys( existing_obj )){
		if( !valid_keys.includes( key )) delete existing_obj[ key ]
	}
}

const random_entry = source => {

	if( Array.isArray( source )){
		return source[ random_range( 0, source.length - 1, true ) ]
	}else if( source && typeof source === 'object'){
		return source[ random_entry( Object.keys( source ) ) ]
	}
	return ''
}



const random_range = ( low, high, int ) => {

	if( low >= high ) return low

	return int ? Math.floor( low + ( Math.random() * ( high - low ) ) ) : low + ( Math.random() * ( high - low ) )

}


const bad_packet = socket => {

	socket.bad_packets = socket.bad_packets || 0
	socket.bad_packets++

	if( socket.bad_packets > 100 ) return true

	if( socket.bad_packet_cooling )	clearTimeout( socket.bad_packet_cooling )
	
	socket.bad_packet_cooling = setTimeout(()=>{
		socket.bad_packet_cooling = false
		socket.bad_packets = 0
	}, 1000)
	
	return false
	
}

const identify = entity => {
	if( !entity ) return false
	let response = ''
	if( entity.handle ) response += entity.handle + '_'
	if( entity.type ) response += entity.type + '_'
	if( entity.name ) response += entity.name + '_'
	if( entity.subtype ) response += entity.subtype + '_'
	if( entity.faction ) response += entity.faction + '_'
	if( entity._id ) response += '_' + entity._id

	if( !response && entity.uuid )  response += '_' + entity.uuid.substr(0, 4)

	return response
}


const floor_vector = vec3 => {
	vec3.x = Math.floor( vec3.x )
	vec3.y = Math.floor( vec3.y )
	vec3.z = Math.floor( vec3.z )
	return vec3
}


const return_fail = ( private_err, public_err, preface ) => {
	if( preface ) log('flag', 'what was preface for ... ', preface  )
	// log('flag', preface ? preface : 'return_fail: ', private_err )
	log('flag', 'return_fail: ', private_err, public_err )
	return {
		success: false,
		msg: public_err,
	}
}

const return_fail_socket = ( socket, msg, time, private_msg ) => {

	if( private_msg ) log('flag', 'return_fail_socket: ', private_msg )

	socket.send(JSON.stringify({
		type: 'hal',
		msg_type: 'error',
		msg: msg,
		time: time,
	}))
	return false

}


const is_admin = request => {

	const admins = env.ADMINS || []
	if( request.session.USER && admins.includes( request.session.USER._email )) return true
	return false

}

const is_logged = request => {

	return !!( request.session && 
	request.session.USER && 
	request.session.USER._id && 
	request.session.USER._email )

}


const user_data = ( msg, params ) => {

	if( typeof msg !== 'string' )  return msg

	params = params || {}

	let res = msg

	if( params.line_breaks ) res = res.replace(/\<br\/?\>/g, '\n')

	if( params.strip_html ) res = res.replace(/(<([^>]+)>)/gi, '')

	if( params.encode ) res = encodeURIComponent( res ) // or encodeURI for less strict encoding

	return res

}

const bumper_dist = ( ship, target ) => {

	if( !target.collide_radius ){
		log('flag', 'invalid bumper_dist')
		return false
	}

	return ship._ref.position.distanceTo( target._ref.position ) - target.collide_radius - ship.collide_radius

}


const to_alphanum = ( value, loose ) => {

	if( typeof value !== 'string' ) return false
	if( loose ){
		return value.replace(/([^a-zA-Z0-9 _-|.|\n|!])/g, '')
	}else{
		return value.replace(/([^a-zA-Z0-9 _-])/g, '')
	}

}


const formdata_to_obj = formdata => {

	let split = formdata.split('&')
	split = split.map( pair => {
		const duo = pair.split('=')
		for( let i = 0; i < 2; i++ ){
			duo[i] = duo[i] ? decodeURIComponent( duo[i] ).replace(/\+/g, ' ') : undefined
		}
		return duo
	})
	const parsed = {}
	for( let pair of split ){
		parsed[ pair[0] ] = pair[1]
	}

	return parsed

}

const random_bar_color = ( len ) => {

	let s = ''
	
	for( let i = 0; i < len; i++){
		s += ( 8 + Math.floor( Math.random() * 8 ) ).toString( 16 )
	}
	
	return s

}


const is_pal_uuid = uuid => {
	if( typeof uuid !== 'string' || uuid.length !== PUBLIC.SLUG_LENGTH ) return false
	return true
}

const sleep = async( ms ) => {
	await new Promise( resolve => { 
		setTimeout( resolve , ms )
	})
	return true
}


const parse_slug = value => {
	if( typeof value === 'string' && value.match(/\/board\//) ){
		return value.substr( value.indexOf('/board/') + 7 )
	}else{
		return value
	} 
}

const get_user = ( uuid, id ) => {
	if( uuid ) return SOCKETS[ uuid ]?.request?.session?.USER
	if( typeof id !== 'number' ) return
	for( const uuid in SOCKETS ){
		if( SOCKETS[ uuid ]?.request?.session?.USER?._id === id ) return SOCKETS[ uuid ]?.request?.session?.USER
	}
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




module.exports = {
	static_chars,
	get_public,
	check_collision,	
	iso_to_ms,
	ms_to_iso,
	random_hex,
	random_int,
	random_offset,
	random_entry,
	random_range,
	// is_valid_uuid,
	is_valid_name,
	is_valid_id,
	is_valid_email,
	is_valid_password,
	is_num,
	// getBaseLog,
	sanitize_packet,
	jarble_chat,
	validate_number,
	validate_string,
	validate_date,
	merge_results_to_object,
	bad_packet,
	identify,
	floor_vector,
	return_fail,
	return_fail_socket,
	is_admin,
	is_logged,
	user_data,
	bumper_dist,
	to_alphanum,

	formdata_to_obj,
	random_bar_color,
	is_pal_uuid,
	parse_slug,
	get_user,
	sleep,
	make_debounce,
}