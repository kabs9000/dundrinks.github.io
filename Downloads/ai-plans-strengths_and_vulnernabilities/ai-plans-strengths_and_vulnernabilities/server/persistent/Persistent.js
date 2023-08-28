const log = require('../log.js');
const DB = require('../db.js');
const lib = require('../lib.js');


class Persistent {

	constructor( init ){

		init = init || {}

		this._id = lib.validate_number( init.id, init._id, undefined )

		this._created = lib.validate_number( init._created, init.created, 0 )
		this._edited = lib.validate_number( init._edited, init.edited, 0 )
		// lib.validate_date( init._created, init.created, undefined )
		// this._edited = lib.validate_date( init._edited, init.edited, undefined )

		this._deleted = init._deleted // flag for in-app garbage collection / mem management

	}

	is_hydrated(){

		console.log('err: do not execute is_hydrated, only test exists')

	}

	async unset(){
		/*
			always .catch() this 
		*/
		if( !this._table ) throw new Error('no table for unset')
		if( typeof this._id !== 'number' ) throw new Error('invalid id for unset (' + this._id + ')')
		const pool = DB.getPool()
		const sql = 'DELETE FROM ' + this._table + ' WHERE id=?'
		const res = await pool.queryPromise( sql, this._id )
		if( res.error ) return lib.return_fail( res.error, 'error unset ')
		return {
			success: true
		}
	}


	publish( ...excepted ){

		excepted = excepted || []

		let r = {}

		for( const key of Object.keys( this )){

			if( ( typeof( key ) === 'string' && key[0] !== '_' ) || excepted.includes( key ) ){
				if( this[ key ] && typeof this[ key ].publish === 'function' ){
					// r[ key ] = this[ key ].publish( ...excepted ) // on 2nd thought... do not pass exceptions beyond 1st scope...
					r[ key ] = this[ key ].publish()
				}else{
					r[ key ] = this[ key ]
				}
			}

		}

		return r

	}


}



module.exports = Persistent

