/*
	MediaItem
*/
const env = require('../.env.js')
const DB = require('../db.js')
const lib = require('../lib.js')
const log = require('../log.js')
const Persistent = require('./Persistent.js')




class MediaItem extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'media'

		this.uuid = lib.validate_string( init.uuid, undefined )
		if( this.uuid?.length !== 16 ) log('flag', 'invalid MediaItem: no uuid given', lib.identify( this ), this.uuid )

		this.slug = lib.validate_string( init.slug, undefined )

		this.filetype = lib.validate_string( init.filetype, undefined )

		this._user_key = lib.validate_number( init.user_key, init._user_key, undefined )
		this.title = lib.validate_string( init.title, undefined )

	}

	async save(){

		const update_fields = [
			'uuid',
			'user_key',
			'title',
			'slug',
			'filetype',
		]

		const update_vals = [ 
			this.uuid,
			this._user_key,
			this.title,
			this.slug,
			this.filetype,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}



module.exports = MediaItem