const DB = require('./db.js')
const log = require('./log.js')
const Persistent = require('./persistent/Persistent.js')


let settings = false


class Setting extends Persistent {

	constructor( init ){
		init = init || {}
		super( init)
		this._table = 'settings'
		this.setting = init.setting
		this.value = init.value
	}

	async save(){

		const update_fields = [
			'setting',
			'value',
		]

		const update_vals = [ 
			this.setting,
			this.value,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}
	
}



const get = setting => {
	if( !settings ){
		log('flag', 'settings not yet initialized', setting )
		return
	}
	return settings[ setting ]
}

const set = async( setting, value ) => {

	// set db
	const s = new Setting({
		setting: setting,
		value: value,
	})
	const {id} = await s.save()
	if( id ){
		log('flag', 'new setting inserted:', s, value )
	}

	// set mem
	settings[ setting ] = value

}


const init = async() => {
	const pool = DB.getPool()
	const sql = 'SELECT * FROM settings WHERE 1'
	const res = await pool.queryPromise( sql )
	if( res.error ) throw new Error('settings init error: ', res.error )
	settings = {}
	for( const result of res.results ){
		settings[ result.setting  ] = result.value
	}
}


module.exports = {
	get,
	set,
	init
}