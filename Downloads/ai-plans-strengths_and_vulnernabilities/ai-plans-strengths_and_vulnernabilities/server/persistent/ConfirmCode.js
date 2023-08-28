const log = require('../log.js')
// const env = require('../.env.js')
const lib = require('../lib.js')
const uuid = require('uuid').v4
const DB = require('../db.js')
const Persistent = require('./Persistent.js')




class ConfirmCode extends Persistent {

	constructor( init ){

		super( init )
		init = init || {}
		this._table = 'confirm_codes'
		this.uuid = init.uuid || uuid()
		this._user_key = lib.validate_number( init.user_key, init._user_key, undefined )
		this.code = lib.validate_string( init.code, lib.random_hex(16))
	}

	async save(){

		const update_fields = [
			'user_key',
			'code',
		]

		const update_vals = [ 
			this._user_key,
			this.code,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}

  
module.exports = ConfirmCode
