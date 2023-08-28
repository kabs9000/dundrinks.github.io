const env = require('./.env.js')
const bcrypt = require('bcryptjs')
// const { fileTypeFromFile } = require('file-type')
const detect_type = require('detect-file-type')
const fs = require('fs').promises
const DB = require('./db.js')
const log = require('./log.js')
const User = require('./persistent/User.js')
const Post = require('./persistent/Post.js')
const lib = require('./lib.js')
const auth = require('./auth.js')
const PUBLIC = require('./data/PUBLIC.js')
const PRIVATE = require('./data/PRIVATE.js')
const BROKER = require('./BROKER.js')
const MediaItem = require('./persistent/MediaItem.js')
const STORE = require('./STORE_HANDLER.js')



// const SALT_ROUNDS= 10

const action = async( request ) => {

	if( !lib.is_logged( request )) return lib.return_fail( 'unlogged account request', 'must be logged')

	const user = request.session.USER

	const pool = DB.getPool()

	const { action, data } = request.body

	let sql, res //, sql2, res2, results, gotten
	const results = []
	let filetype, item_data

	switch( action ){

	case 'remove_account':
		if( typeof user?._id !== 'number' ) return lib.return_fail('invalid delete req', 'invalid delete request')
		sql = `DELETE FROM users WHERE id=? LIMIT 1`
		res = await pool.queryPromise( sql, user._id )
		if( res.error ) return lib.return_fail(res.error, 'There was an error deleting.  Contact admin if this persists')

		res = await STORE.flush({
			id: user._id,
		})

		if( !res ) log('flag','user deleted from db but failed to purge session: ', lib.identify( user ) )

		return {
			success: true,
		}

	case 'remove_media':
		if( typeof request.body.uuid !== 'string' ) return lib.return_fail('invalid uuid', 'invalid item id')
		sql = `SELECT * FROM media WHERE uuid=? AND user_key=?`
		res = await pool.queryPromise( sql, [ request.body.uuid, user._id ] )
		if( res.error ) return lib.return_fail( res.error, 'error deleting')
		if( !res?.results?.length ) return lib.return_fail('could not find item', 'could not find item')
		item_data = Object.assign({}, res.results[0] )

		// delete from db
		sql = `DELETE FROM media WHERE uuid=? LIMIT 1`
		res = await pool.queryPromise( sql, item_data.uuid )
		if( res.error ) return lib.return_fail( res.error, 'error deleting')

		// check if image, for thumb delete
		filetype = await new Promise((resolve, reject ) => {
			detect_type.fromFile( env.UPLOAD_DIR + '/' + item_data.slug, (err, res) => {
				if( err ) return reject( err )
				resolve( res )
			})
		})

		log('file_handler', 'deleting item:', item_data )

		// delete from fs
		await fs.unlink( env.UPLOAD_DIR + '/' + item_data.slug )
		if( PRIVATE.IMAGE_TYPES.includes( filetype ) ){
			await fs.unlink( env.UPLOAD_DIR + '/thumbs/' + item_data.slug )
		}
		return {
			success: true,
		}

	case 'handle_upload':
		if( typeof request.body.slug !== 'string' ) return lib.return_fail('invalid upload slug', 'invalid file destination')

		const item_uuid = await get_unique_uuid('media', 16)
		if( !item_uuid ) return lib.return_fail('invalid unique uuid', 'failed to save item data')

		log('file_handler', 'saving upload db entry: ', request.body )

		if( typeof request.body.filetype !== 'string' ){

			// log('flag', 'fetching file type again for db entry...')

			const { ext, mime } = await new Promise((resolve, reject ) => {
				detect_type.fromFile( env.UPLOAD_DIR + '/' + request.body.slug, (err, res) => {
					if( err ) return reject( err )
					resolve( res )
				})
			})

			filetype = ext

		}else{
			filetype = request.body.filetype
		}

		// log('flag', 'worsks? ', filetype )

		const upload = new MediaItem({
			user_key: user._id,
			slug: request.body.slug,
			title: request.body.title,
			uuid: item_uuid,
			filetype: filetype,
		})
		res = await upload.save()
		upload._id = res.id
		return {
			success: true,
		}

	case 'get_media_library':
		sql = `SELECT * FROM media WHERE user_key=?`
		res = await pool.queryPromise( sql, user._id )
		if( res.error ) return lib.return_fail( res.error, 'error fetching media library')
		for( const r of res.results ){
			const item = new MediaItem( r )
			results.push( item.publish() )
		}
		return {
			success: true,
			results: results,
		}

	case 'get_account':
		return {
			success: true,
			user: user,
		}

	case 'set_field':
		res = await user.set_field( data, true )
		BROKER.publish('BOARDS_UPDATE_USER', {
			data: data,
			persist: false,
			uuid: user.uuid,
		})
		return res


	default: 
		return lib.return_fail( 'unhandled action: ' + action, 'unhandled action')

	}

}





const get_unique_uuid = async( table, len ) => {

	if( typeof len !== 'number') return log('flag', 'invalid uuid len for unique', len )

	const pool = DB.getPool()
	const the_sql = `SELECT * FROM ${ table } WHERE uuid=?`
	let c = 0
	let the_uuid
	let res
	while( !the_uuid && c < 100 ){
		c++
		the_uuid = lib.random_hex( len )
		res = await pool.queryPromise( the_sql, the_uuid )
		if( res.error ) return log('flag', res.error )
		if( !res.results?.length ){
			break;
		}
	}

	return the_uuid

}




// const get_user = async( email, id ) => {

// 	if( !email ) return log('flag', 'must provide email; unhandle id lookup')
// 	const pool = DB.getPool()
// 	const sql = `SELECT * FROM users WHERE email=?`
// 	const res = await pool.queryPromise( sql, email )
// 	if( res?.results?.length ){
// 		return new User( res.results[0] )
// 	}

// }



module.exports = {
	action,
}