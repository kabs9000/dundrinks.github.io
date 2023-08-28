const env = require('./.env.js')
const lib = require('./lib.js')
const log = require('./log.js')
const DB =require('./db.js')
const User = require('./persistent/User.js')
const BROKER = require('./BROKER.js')
const STORE_HANDLER = require('./STORE_HANDLER.js')



const action = async( request ) => {

	if( !lib.is_admin( request )) return lib.return_fail( 'admin request blocked to non-admin', 'you must be an admin to perform that action')

	const user = request.session.USER

	const pool = DB.getPool()
	let sql, res

	let tar_user, now

	const results = []

	// const stripe_mode = env.STRIPE.LIVE ? 'live' : 'test'

	const { action} = request.body

	switch( action ){

	case 'flush_users':
		res = await STORE_HANDLER.flush_all( request )
		return {
			success: res,
		}

	case 'block_user':
		if( typeof request.body.state !== 'boolean' ) return lib.return_fail('invalid state', 'invalid state')
		now = Date.now()
		if( request.body.state ){
			sql = `UPDATE users SET blocked=? WHERE slug=? LIMIT 1`
			res = await pool.queryPromise( sql, [ now, request.body.slug ] )
		}else{
			sql = `UPDATE users SET blocked=NULL WHERE slug=? LIMIT 1`
			res = await pool.queryPromise( sql, [ request.body.slug ] )
		}
		if( res.error ) return lib.return_fail( res.error, 'invalid block data')
		if( res.results?.affectedRows !== 1 ) return lib.return_fail('failed to set user block state', 'no users were affected by query')
		STORE_HANDLER.get(false, false, user.slug )
		.then( session => {
			if( request.body.state ){
				session.USER._blocked = now
				log('flag', 'blocked..', session.USER, session.id )

			}else{
				delete session.USER._blocked
			}
		})
		.catch( err => {
			log('flag', 'session block err', err )
		})
		return {
			success: true
		}

	case 'set_plan_state':
		if( typeof request.body.uuid !== 'string' ) return lib.return_fail('invalid uuid plan state', 'invalid uuid')
		switch( request.body.plan_action ){
		case 'hide':
			sql = `UPDATE posts SET archived = NOT archived WHERE uuid=?`
			break;
		case 'delete':
			sql = `DELETE FROM posts WHERE uuid=? LIMIT 1`
			break;
		default:
			return lib.return_fail('unknown action: ' + request.body.plan_action, 'unknown action')
		}
		res = await pool.queryPromise( sql, request.body.uuid )
		if( res.error ) return lib.return_fail(res.error, 'error modifying plan')

		BROKER.publish('CACHE_POSTS_UPDATE')

		return {
			success: true,
		}

	case 'backup':
		res = await DB.backup( request )
		return res


	case 'plans':
		sql = {
			sql: `
		SELECT * FROM posts 
		LEFT JOIN users ON users.id=posts.user_key
		WHERE 1 ORDER BY posts.created DESC`,
			nestTables: true,
		}
		res = await pool.queryPromise( sql )
		if( res.error ) throw new Error( res.error )

		// let id
		for( const r of res.results || []){
			if( r.users?.id ){
				r.posts.user_handle = r.users.handle
				r.posts.user_slug = r.users.slug
				if( r.users?.blocked ){
					r.posts.user_blocked = r.users.blocked
				}
			}

			results.push( r.posts )
			// results.push( new User( r ).publish('_edited', '_created', '_reset_time', '_email') )
		}

		return {
			success: true,
			results: results,
		}


	case 'users':
		sql = `SELECT * FROM users WHERE 1`
		res = await pool.queryPromise( sql )
		if( res.error ) throw new Error( res.error )

		let id
		for( const r of res.results || []){
			results.push( r )
			// results.push( new User( r ).publish('_edited', '_created', '_reset_time', '_email') )
		}

		return {
			success: true,
			results: results,
		}


	default:
		log('flag', 'unknown admin action', action)
		break;
	}

	return res

}



const get_user = async( email, slug ) => {
	const pool = DB.getPool()
	let sql, res
	let value
	if( email ){
		sql = `SELECT * FROM users WHERE email=? LIMIT 1`
		value = email
	}else if( slug ){
		sql = `SELECT * FROM users WHERE slug=? LIMIT 1`
		value = slug
	}
	res = await pool.queryPromise( sql, value )
	if( res.error ) return log('flag', 'err get user', res.error )
	if( !res.results?.length ) return false
	const user = new User( res.results[0])
	return user
}






module.exports = {
	action,
}


