const log = require('../log.js')
const DB = require('../db.js')
// const env = require('../.env.js')
const lib = require('../lib.js')
const bcrypt = require('bcryptjs')
const SOCKETS = require('../SOCKETS.js')
// const DATA_PRIVATE = require('../data/PRIVATE.js')
const uuid = require('uuid').v4
const Persistent = require('./Persistent.js')
const PRIVATE = require('../data/PRIVATE.js')




const SALT_ROUNDS = 10


const SAVE_MAP = {

	values: {
		_password: '_password',
		handle: 'handle',
		// color:  'color',		
	},

	filters: {

		_password: ( value, user ) => {
			let salt = bcrypt.genSaltSync( SALT_ROUNDS )
			let hash = bcrypt.hashSync( value, salt )
			return hash
		},

		handle: ( value, user ) => {

			if( typeof value !== 'string' ){
				log('flag', 'invalid handle save: ', lib.identify( user ), typeof value )
				return 'ai_' + lib.random_hex(12)
			}

			return lib.user_data( value, {
				strip_html: true,
			}).replace(/ /g, '').substr(0, 100)

		}

	},

	callbacks: {

	}

}


class User extends Persistent {

	constructor( init ){

		super( init )

		init = init || {}

		this._table = 'users'

		this.uuid = init.uuid || uuid()

		this.handle = lib.validate_string( init.handle, this.handle, lib.random_entry( PRIVATE.middle_english_names ) )// 'user_' + this.uuid.substr(0,4)
		this.slug = lib.validate_string( init.slug, undefined ) 

		// this.color = lib.validate_string( init.color, '#' + lib.random_bar_color( 6 ) )
		this._email = lib.validate_string( init.email, init._email, undefined )
		this._password = lib.validate_string( init._password, init.password, undefined )
		this._confirmed = init._confirmed || init.confirmed || false
		this._reset_time = lib.validate_number( init.reset_time, init._reset_time, undefined )
		this._last_log = lib.validate_string( init.last_log, init._last_log, undefined )
		// log('flag', 'old user block: ', this.slug, init._blocked || init.blocked )
		this._blocked = lib.validate_number( init._blocked, init.blocked, undefined )
		// log('flag', 'new user block: ', this.slug, init._blocked || init.blocked )

		this._notes_private = lib.validate_string( init.notes_private, init._notes_private, undefined )
		this._notes_public = lib.validate_string( init.notes_public, init._notes_public, undefined )

		// instantiated
		this._ws_location = lib.validate_string( init._ws_location, undefined ) // boards / rebot
		this._session_id = lib.validate_string( init.session_id, init._session_id, undefined )

	}


	async gen_new_slug(){
		const pool = DB.getPool()
		let sql, res
		let c = 0
		let new_slug
		while( !new_slug && c < 1000 ){
			c++
			const gen_slug = `ai_${ lib.random_hex(10)}`
			sql = `SELECT slug FROM users WHERE slug=?`
			res = await pool.queryPromise( sql, gen_slug )
			if( res.results?.length ){
				continue
			}else{
				new_slug = gen_slug
			}
		}
		if( c > 1 ){
			log('flag', 'required ' + c + ' generations to get new slug...')
		}
		return new_slug
	}


	hydrate( data ){
		/*
			to be safe,
			manually list flat fields so as not to risk propagating a Timeout or Interval etc...
		*/

		const include = [
			'_board_order', 
			'_last_log', 
			'_reset_time', 
			'_password', 
			'_email',
			// 'color',
			'handle',
		]

		delete include.uuid // just a reminder - this is meant to allow multiple User sessions / uuids

		for( const key in data ){
			if( !include.includes( key ) ) continue
			this[ key ] = data[ key ]
		}
	}



	async set_field( data, persist ){
		log('flag', 'set field: ', data )
		/*
			safely update a field given from client
			optionally save to database as well
		*/

		const pool = DB.getPool()
		let sql, res 

		const { field, value } = data
		if( !SAVE_MAP.values[ field ] ) return lib.return_fail({ msg: 'bad save field', packet: data }, 'invalid save')

		if( field === 'handle' ){
			if( typeof value !== 'string' ) return lib.return_fail('invalid handle', 'invalid handle')
			// ensure unique
			sql = `SELECT * FROM users WHERE handle=?`
			res = await pool.queryPromise( sql, value )
			if( res.error ) return lib.return_fail(res.error, 'error querying unique handle' )
			if( res.results?.length ){
				return lib.return_fail('handle already taken ' + value, 'handle already taken' )
			}
		}

		// update
		// filters
		let new_value
		const filter = SAVE_MAP.filters[ field ]
		if( filter ){
			new_value = filter( value, this )
		}else{
			new_value = value
		}
		this[ SAVE_MAP.values[ field ] ] = new_value

		// callbacks
		if( SAVE_MAP.callbacks[ field ] ) SAVE_MAP.callbacks[ field ]( value, this )

		// save
		if( persist ) await this.save()

		return {
			success: true,
		}
	}

	is_self( request ){
		const u = request.session?.USER
		log('flag',' self??', u?._id, this._id, this.slug )
		return u?._id === this._id || u?.slug === this.slug
	}

	output_html( request ){

		const public_fields = {
			'handle': 'handle',
		}
		const private_fields = {
			'_email': 'email',
		}

		let html = `
		<div class="user-wrap">`
		for( const field in public_fields ){
			html += `
			<div class='user-field public'>
				${ public_fields[ field ] }: ${ this[ field ] }
			</div>`
		}
		if( this.is_self( request ) ){
			for( const field in private_fields ){
				html += `<div class='user-field private'>${ private_fields[ field ] }: ${ this[ field ] }</div>`
			}
		}
		html += '</div>'

		return html

	}


	async save(){

		if( !this.slug ) throw new Error('attempting to save invalid user')

		const update_fields = [
			'email',
			'slug',
			'handle',
			// 'color',
			'password',
			'confirmed',
			'reset_time',
			'notes_private',
			'notes_public',
			'blocked',
		]

		const update_vals = [ 
			this._email,
			this.slug,
			this.handle,
			// this.color,
			this._password,
			this._confirmed,
			this._reset_time,
			this._notes_private,
			this._notes_public,
			this._blocked,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}



}

  
module.exports = User
