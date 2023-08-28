const env = require('./.env.js')
const lib = require('./lib.js')
const log = require('./log.js')
const DB = require('./db.js')
const PUBLIC = require('./data/PUBLIC.js')
const Post = require('./persistent/Post.js')
const Vote = require('./persistent/Vote.js')
const User = require('./persistent/User.js')
const Comment = require('./persistent/Comment.js')
const BROKER = require('./BROKER.js')
const CACHE = require('./CACHE.js')
const mail = require('./mail.js')


// const week = ( 60 * 60 * 24 * 7 ) // * 1000

// const spans = {
// 	week: week,
// 	month: week * 4,
// 	year: week * 52,
// }

const action = async( request ) => {

	const { action } = request.body

	const user = request.session?.USER

	const pool = DB.getPool()
	let sql, res
	let validations, invalid_msg, uuid, comment_data, post, comment, vote, published, post_id, poster_id, mailOptions, post_user
	let body_html, body_text
	const results = []

	const response = {
		success: false,
	}

	switch( action ){

	case 'remove_comment':
		uuid = request.body.uuid
		comment = CACHE.get_comment( false, uuid )
		if( !comment ) return lib.return_fail('no comment', 'comment not found')

		if( !lib.is_admin( request ) && !comment.is_poster( request ) ){
			return lib.return_fail('unpermitted remove', 'insufficient permissions')
		}

		res = await CACHE.remove_comment( false, comment )
		return {
			success: true
		}

	case 'get_user_posts':

		if( lib.is_logged( request ) && user.slug === request.body.slug ){ // anon users

			sql = `SELECT * FROM posts WHERE user_key=?`
			res = await pool.queryPromise( sql, user._id )

		}else{ // logged public user

			if( typeof request.body.slug !== 'string' ) return lib.return_fail('must provide slug', 'no user found')

			sql = {
				sql: `
			SELECT * FROM users
			LEFT JOIN  posts ON ( posts.user_key=users.id AND posts.archived = 0 )
			WHERE users.slug=?`,
				nestTables: true,
			}
			res = await pool.queryPromise( sql, request.body.slug )
			if( res.error ) return lib.return_fail( res.error, 'error getting posts')
			for( const r of res.results ){
				results.push( new Post( r.posts ).publish('_created') )
			}
			return {
				success: true,
				results: results,
			}

		}

		if( res.error ) return lib.return_fail( res.error, 'error getting posts')
		for( const r of res.results ){
			results.push( new Post( r ).publish('_created') )
		}
		return {
			success: true,
			results: results,
		}

	case 'get_comment_response':
		if( !lib.is_logged( request )) return lib.return_fail('unlogged vote', 'must be logged in')
		if( typeof request.body.uuid !== 'string') return lib.return_fail( 'invalid uuid', 'could not find post')

		comment = CACHE.get_comment( false, request.body.uuid )
		post = await CACHE.get_post( comment._post_key )

		return {
			success: true,
			old_post: post.publish(),
			old_comment: comment.publish(),
		}

	case 'lock_post':
		if( !lib.is_logged( request )) return lib.return_fail('unlogged vote', 'must be logged in')
		if( typeof request.body.uuid !== 'string') return lib.return_fail( 'invalid uuid', 'could not find post')
		post = await CACHE.get_post( false, request.body.uuid )
		if( !post ) return lib.return_fail('could not find post: ' + request.body.uuid, 'failed to find post')
		if( !post.is_author( request ) ) return lib.return_fail('unauth post lock: ' + lib.identify( user ), 'you are not the author')

		post.archived = true
		await post.save()

		BROKER.publish('CACHE_REMOVE_POST', {
			post_id: post._id,
			// uuid: post.uuid,
			// purge, // - def do not - point is to remove only from cache, not purge from db
		})

		return {
			success: true,
		}

	case 'set_vote':
		if( !lib.is_logged( request )) return lib.return_fail('unlogged vote', 'must be logged in')
		// valid vote type
		if( typeof request.body.type !== 'string' || 
			typeof PUBLIC.VOTE_TYPES[ request.body.type ] !== 'number' ){
			return lib.return_fail('invalid vote type ' + request.body.type, 'invalid vote type')
		}
		// valid comment uuid
		if( typeof request.body.uuid !== 'string') return lib.return_fail('invalid comment for vote', 'could not find comment for vote')
		sql = `SELECT * FROM comments WHERE uuid=?`
		res = await pool.queryPromise( sql, request.body.uuid )
		if( res.error ) return lib.return_fail( res.error, 'error setting vote')
		if( !res.results?.length ) return lib.return_fail('no comment for vote: ' + request.body.uuid, 'no comment found for vote')
		if( res.results?.length >1 ) return lib.return_fail('too many comments for vote: ' + request.body.uuid, 'invalid comment found for vote')

		comment_data = res.results[0]

		// if vote exists, remove
		sql = `DELETE FROM votes WHERE user_key=? AND comment_key=? LIMIT 1`
		res = await pool.queryPromise( sql, [ user._id, comment_data.id ])
		if( res.error ) return lib.return_fail( res.error, 'error setting vote')
		// log('flag', 'delete....', res.results )
		if( res.results?.affectedRows ){

			BROKER.publish('CACHE_REMOVE_VOTE', {
				user_id: user._id,
				comment_id: comment_data.id,
				vote_id: false,
			})

		}else{

			vote = new Vote({
				user_key: user._id,
				comment_key: comment_data.id,
				score: PUBLIC.VOTE_TYPES[ request.body.type ],
			})
			res = await vote.save() // overwriting / upserting here is fine - one vote per user, of any score
			vote._id = res.id

			BROKER.publish('CACHE_ADD_VOTE', {
				vote: vote,
			})

		}

		return { success: true, vote: vote }


	case 'create_vulnerability':

		if (!user || !user._id) {
    return lib.return_fail('user not authenticated', '<a href="https://ai-plans.com/login">You must be logged in to add vulnerabilities. Click here to login.</a>');
}
		if( user._blocked ){
			// log('flag', 'create crit - user blocked: ', user._blocked, request.session.id )
			return lib.return_fail('user blocked from crit: ' + user.slug, 'Your user account is blocked from adding vulnerabilities.  If you think this is in error please <a href="/contact">contact</a> the admin.')
		}


		// --- validations
		validations = {
			title: {
				char_max: PUBLIC.POST_LIMITS.TITLE,
				required: true,
			},
			content: {
				char_max: PUBLIC.POST_LIMITS.COMMENT_CONTENT,
				required: true,
			},


			        comment_type: {
            required: true,
            values: ['Strength', 'Vulnerability']  // Enumerated allowed values
        }


		}
		invalid_msg = validate( request.body, validations )
		if( invalid_msg ){
			return lib.return_fail( 'invalid post save: ' + invalid_msg, invalid_msg )
		}


		// --- check last post time (both comments and posts)
		if( typeof request.session._last_posted === 'number'){
			if( !lib.is_admin( request ) && Date.now() - request.session._last_posted < PUBLIC.COMMENT_BUFFER_MS ){
				return lib.return_fail('too frequent posts:  ' + user._id, 'please wait ' + ( Math.floor( PUBLIC.COMMENT_BUFFER_MS / 1000 ) + ' seconds between posting' ) )
			}
		}

		// --- get post id from uuid
		if( typeof request.body.post_uuid !== 'string' ) return lib.return_fail('invalid post uuid', 'invalid post id')

		sql = `SELECT * FROM posts WHERE uuid=? LIMIT 1`
		res = await pool.queryPromise( sql, request.body.post_uuid )
		if( res.error ) return lib.return_fail( res.error, 'failed to find post')
		if( !res.results?.length ) return lib.return_fail( res.error, 'failed to find post')
		post = new Post( res.results[0] )

		// --- ensure unique uuid
		uuid = lib.random_hex( 16 )
		sql = `SELECT * FROM comments WHERE uuid=?`
		res = await pool.queryPromise( sql, uuid )
		if( res.error ) return lib.return_fail( res.error, 'error saving vulnerability')
		if( res.results?.length ) return lib.return_fail('non-unique uuid save', 'non unique error - try again')

		// --- save
		const criticism = new Comment({
			user_key: user?._id,
			post_key: post._id,
			uuid: uuid,
			title: request.body.title,
			content: request.body.content,
			comment_type: request.body.comment_type
		})
		res = await criticism.save()
		criticism._id = res.id

		// --- send email to post owner (post_user), from criticism (user)
		if( post._user_key ){
			// get the post owner
			sql = `SELECT * FROM users WHERE id=? LIMIT 1`
			res = await pool.queryPromise( sql, post._user_key )
			if( res.error ){
				log('flag', 'error alerting owner of crit: ', res.error )
			}else{

				post_user = new User( res.results[0] )

				body_html = `A new vulnerability on ${ post.title } was submitted by ${ user._id ? user.handle : '(anon)' }<br>
Click here to view it:<br>
<a href='${ env.SITE_URL }/post/${ post.uuid }' target='_blank'>${ post.title || '(untitled)' }</a>`
				body_text = lib.user_data( body_html, {
					strip_html: true,
					line_breaks: true,
				})
				mailOptions = {
					from: env.MAIL.ADMIN,
					to: post_user._email,
					subject: `${ env.SITE_TITLE }: new vulnerability on ${ post.title }`,
					html: body_html,
					text: body_text,
				}
				await mail.sendmail( mailOptions )

			}
		}

		// --- set for post buffer
		request.session._last_posted = Date.now()

		BROKER.publish('CACHE_ADD_COMMENT', {
			comment: criticism,
		})

		response.success = true
		// response.uuid = uuid
		break;

	case 'get_post_comments':
		if( typeof request.body.uuid !== 'string' ) return lib.return_fail('invalid uuid', 'invalid post lookup')

		post = await CACHE.get_post( false, request.body.uuid )
		if( !post ) return lib.return_fail('no post for comments: ' + uuid, 'post not available for comments')

		for( const uuid in post._COMMENTS ){
			comment = post._COMMENTS[ uuid ]
			published = comment.publish()
			for( const id in comment._VOTES ){
				vote = comment._VOTES[id]
				if( vote._user_key === user._id ){
					published.user_vote = vote.publish()
				}
			}
			results.push( published )
		}

		return {
			success: true,
			comments: results,
		}


	case 'create_post':

		if( !env.LOCAL && !lib.is_logged( request ) ){
			return lib.return_fail('unlogged create post', 'must be logged in')
		}

		// --- validations
		validations = {
			title: {
				char_max: PUBLIC.POST_LIMITS.TITLE,
				required: true,
			},
			description: {
				char_max: PUBLIC.POST_LIMITS.DESCRIPTION,
				required: true,
			},
			content: {
				char_max: PUBLIC.POST_LIMITS.CONTENT,
				required: true,
			},
			attribution: {
				char_max: PUBLIC.POST_LIMITS.ATTRIBUTION,
				required: false,
			}
		}
		invalid_msg = validate( request.body, validations )
		if( invalid_msg ){
			return lib.return_fail( 'invalid post save: ' + invalid_msg, invalid_msg )
		}

		// --- check last post time (both comments and posts)
		if( typeof request.session._last_posted === 'number'){
			if( !lib.is_admin( request ) && Date.now() - request.session._last_posted < PUBLIC.POST_BUFFER_MS ){
				return lib.return_fail('too frequent posts:  ' + user._id, 'please wait ' + ( Math.floor( PUBLIC.POST_BUFFER_MS / 1000 ) + ' seconds between posting' ) )
			}
		}

		// --- ensure unique uuid
		uuid = lib.random_hex( 12 )
		sql = `SELECT * FROM posts WHERE uuid=?`
		res = await pool.queryPromise( sql, uuid )
		if( res.error ) return lib.return_fail( res.error, 'error saving post')
		if( res.results?.length ) return lib.return_fail('non-unique uuid save', 'non unique error - try again')	

		// save
		post = new Post({
			user_key: user?._id,
			uuid: uuid,
			title: lib.user_data( request.body.title, { strip_html: true }),
			description: lib.user_data( request.body.description, { strip_html: true }),
			content: lib.user_data( request.body.content, { strip_html: true }),
			attribution: lib.user_data( request.body.attribution, { strip_html: true }),
			published: true,
			muted: false,

			respond_comment_uuid: request.body.respond_comment_uuid
		})
		res = await post.save()
		// const post_id = res.id // ...

		// set for post buffer
		request.session._last_posted = Date.now()

		BROKER.publish('CACHE_POSTS_UPDATE')

		response.success = true
		response.uuid = uuid
		break;
		
	default: 
		log('flag', 'unrecognized action type: ', action )
		msg = 'unrecognized action'
		break;

	}

	return response

}



const validate = ( body, validations ) => {

	let value, validator, invalid_msg

	for( const field in validations ){
		value = body[ field ]
		validator = validations[ field ]
		// not empty
		if( !value ){
			if( validator.required ){
				invalid_msg = field + ' is required'
				break;
			}else{
				continue
			}
		}
		// types
		if( typeof value !== 'string' ){
			invalid_msg = 'invalid field: ' + field
			break;
		}
		// too long
		if( value.length > validator.char_max ){
			invalid_msg = 'field over char limit - ' + field + ': ' + validator.char_max
			break;
		}
		// sanitize
		value = lib.user_data( value.trim(), {
			strip_html: true,
		})
	}

	return invalid_msg

}



const get_post = async( uuid ) => {
	const pool = DB.getPool()
	let sql, res
	sql = `SELECT * FROM posts WHERE uuid=?`
	res = await pool.queryPromise( sql, uuid )	
	if( res.error ) return lib.return_fail( res.error, 'error retrieving post')
	if( !res.results?.length ) return lib.return_fail( 'no posts found: ' + uuid, 'no post found')
	const post = new Post( res.results[0] )
	return {
		success: true,
		post: post.publish()
	}
}





module.exports = {
	action,
	get_post,
}
