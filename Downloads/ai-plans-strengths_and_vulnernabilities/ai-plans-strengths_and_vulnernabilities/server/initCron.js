const env = require('./.env.js')
const log = require('./log.js')
const lib = require('./lib.js')
const DB = require('./db.js')
const MAIN  = require('./OPS_main.js')
const SETTINGS = require('./SETTINGS.js')
const PUBLIC = require('./data/PUBLIC.js')












const clean_db = () => {
	log('flag','unhandled clean db')
}






const bump_cron = async() => {
	// log('flag', 'unhandled set cron')
	SETTINGS.set('last_cron', Date.now())
	return true
}


const BUMP_TIME = 1000 * 60 * 60 * 24 // time to send
const TICK_TIME = 1000 * 60 * 60 // time to check for send

const try_cron = async( caller ) => {

	// ensure last tick
	if( typeof last_send !== 'number'){
		const pool = DB.getPool()
		const sql = `SELECT * FROM settings WHERE setting=?`
		const res = await pool.queryPromise( sql, 'last_cron' )
		if( res.error ) return lib.return_fail( res.error, false )
		const num = Number( res?.results?.[0]?.value )

		// this error condition defaults to SEND.  
		// may want errors to default to SKIP send
		if( typeof num !== 'number' || isNaN( num ) ){
			log('flag', `invalid last_send (${ last_send })`)
			last_send = 0
		}
	}

	log('ai_cron', caller )

	// do cron
	if( Date.now() - last_send > BUMP_TIME ){
		last_send = Date.now()
		clean_db()
		bump_cron( last_send )
	}

}

// init

let initialized = false
let last_send

module.exports = () => {

	if( initialized ) return
	initialized = true

	try_cron('init')

	let AICRON = setInterval(() => {
		try_cron('tick')
	}, TICK_TIME )

}