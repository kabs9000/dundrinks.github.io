/*
	Vote
*/
// const env = require('../.env.js')
const DB = require('../db.js')
const lib = require('../lib.js')
const Persistent = require('./Persistent.js')


class Vote extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'votes'
		this._user_key = lib.validate_number( init.user_key, init._user_key, undefined )
		this._comment_key = lib.validate_number( init.comment_key, init._comment_key, undefined )
		this.score = lib.validate_number( init.score, 0 )

	}

	async save(){

		const update_fields = [
			'user_key',
			'comment_key',
			'score',
		]

		const update_vals = [ 
			this._user_key,
			this._comment_key,
			this.score,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}


module.exports = Vote