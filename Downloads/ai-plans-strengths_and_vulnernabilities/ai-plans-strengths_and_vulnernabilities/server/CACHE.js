const env = require('./.env.js')
const DB = require('./db.js')
const log = require('./log.js')
const lib = require('./lib.js')
const BROKER = require('./BROKER.js')
const Post = require('./persistent/Post.js')
const Comment = require('./persistent/Comment.js')
const Vote = require('./persistent/Vote.js')




// decl

const CACHE = {
	POSTS: [],
	// SUMMARIES: [],
}





// lib

const update_post_cache = async( event ) => {

	const pool = DB.getPool()
	let sql, res
	// grab all posts to iterate
	sql = {
		sql: `SELECT * FROM posts 
		LEFT JOIN users ON posts.user_key=users.id
		WHERE published=1 AND muted=0 AND archived=0 ORDER BY posts.created DESC`,
		nestTables: true,
	}
	res = await pool.queryPromise( sql )
	if( res.error ) return log('flag', 'err updating post cache', res.error )
	let post

	// make a dummy cache because you want to write to the actual cache synchronously when ready
	const dummy_cache = [] 
	for( const r of res.results ){

		if( r.users?.blocked ){ // easier to do this here than complicated JOIN ^^
			continue
		}

		post = new Post( r.posts )
		post.user_handle = r.users?.handle
		post.user_slug = r.users?.slug
		 // || 'anon'
		dummy_cache.push( post )
	}

	log('flag', 'init cache', dummy_cache.length )

	// get votes and comments
	// ------ 
		// this will need to get staggered probably, not one entire database dump....
	// ------
	sql = {
		sql: `
	SELECT * FROM comments c
	LEFT JOIN votes v ON v.comment_key=c.id
	LEFT JOIN users u ON c.user_key=u.id
	WHERE 1`,
		nestTables: true,
	}
	res = await pool.queryPromise( sql )
	if( res.error ){
		log('flag', res.error )
	}else{

		// join the votes > comments > posts
		let comment_data, vote_data, user_data, comment, vote

		for( const post of dummy_cache ){ // for each cache post

			for( const r of res.results ){ // for each join

				comment_data = r.c
				vote_data = r.v
				user_data = r.u

				if( comment_data.post_key === post._id ){ // res.comment is relevant

					// add comment
					if( !post._COMMENTS[ comment_data.uuid ] ){
						post._COMMENTS[ comment_data.uuid ] = new Comment( comment_data )
					}
					comment = post._COMMENTS[ comment_data.uuid ]
					comment.user_handle = user_data?.handle 
					comment.user_slug = user_data?.slug 
					// || 'anon'

					// add vote
					if( lib.is_num( vote_data?.score ) ){ // res.vote is valid (and joined to comment)

						if( !comment._VOTES[ vote_data.id ] ){
							comment._VOTES[ vote_data.id ] = new Vote( vote_data )
						}
						vote = comment._VOTES[ vote_data.id ]

					}else{
						if( vote_data.id ){
							log('flag', 'got vote data with invalid score', vote_data )
							log('flag', 'for comment:', comment.uuid )
						}
					}

				}

			}

			post._comments_length = Object.keys( post._COMMENTS ).length

		}

	}

	// now that we have posts and comments, can sort
	const SORT_TYPE = 'num_comments'
	switch( SORT_TYPE ){
	case 'num_comments':
		dummy_cache.sort((a, b) => {
			return a._comments_length > b._comments_length ? 1 : -1
		})
		break;
	default:
		log('flag', 'no sort type active for cache')
		break;
	}

	// copy to main cache synchronously
	CACHE.POSTS.length = 0
	let copy
	for( const post of dummy_cache ){
		copy = new Post( post )
		copy.set_score()
		// log('flag', 'copy still haz handle?', copy.user_handle )
		log('cache', 'set: ', copy.uuid, 'comments', copy._comments_length, 'vote_score', copy.vote_score )
		CACHE.POSTS.push( copy ) // copy to allow for multiple axes of indexing
	}

	// summarize
	// log('cache', 'cache posts', CACHE.POSTS.length )
	// log('cache', 'cache summaries', Object.keys( CACHE.SUMMARIES ).length )
	// log('flag', 'dev examine cache..', CACHE.POSTS )

}

const debounced_update_posts = lib.make_debounce( update_post_cache, env.LOCAL ? 1000 : 5000, false, null )





const add_comment = async( event ) => {

	const { comment } = event

	log('cache', 'add comment', comment._id )

	const c = get_comment( comment._id )
	if( c ) return log('flag', 'already got comment', comment._id )

	const post = await get_post( comment._post_key )
	if( !post ) return log('flag', 'no post for comment', comment._post_key )

	post._COMMENTS[ comment.uuid ] = comment 

	post.set_score()

}

// const debounced_add_comment = lib.make_debounce( add_comment, env.LOCAL ? 1000 : 5000, false, null )


const add_vote = async( event ) => {

	const { vote } = event

	log('cache', 'add vote', vote._id )

	const res = get_vote( false, vote._user_key, vote._comment_key )
	if( res ){
		return log('flag', 'vote already in cache: ', vote._user_key, vote._comment_key )
	}

	const comment = get_comment( vote._comment_key )
	if( !comment ) return log('flag', 'no comment to add vote to: ', vote._comment_key )

	comment._VOTES[ vote._id ] = vote

	comment.set_score()

}

// const debounced_add_vote = lib.make_debounce( add_vote, env.LOCAL ? 1000 : 5000, false, null )



const remove_vote = event => {

	const { 
		user_id, 
		comment_id, 
		vote_id,
	} = event

	log('cache', 'remove vote', user_id, comment_id, vote_id )

	const { vote, comment } = get_vote( vote_id, user_id, comment_id )

	if( vote ){
		if( comment ){
			delete comment._VOTES[ vote._id ]
			vote.unset()
			.catch( err => {
				log('flag', 'err delete vote', err )
			})
		}
	}

}

const remove_comment = async( uuid, comment ) => {

	// touch comment
	let the_comment
	if( comment ){
		the_comment = comment
	}else if( typeof uuid === 'string' ){
		the_comment = get_comment( uuid )
	}else{
		return log('flag', 'invalid criteria for remove comment')
	}
	if( !the_comment ) return log('flag', 'no comment to remove: '  + uuid )

	// remove from cache
	let found
	for( const post of CACHE.POSTS ){
		for( const uuid in post._COMMENTS ){
			if( uuid === the_comment.uuid ){
				delete post._COMMENTS[ uuid ]
				found = true
				break;
			}
		}
		if( found ) break;
	}

	if( !found ) log('flag', 'comment-delete was not found in cache: ' + uuid )

	// remove from db
	const pool = DB.getPool()
	const sql = `DELETE FROM comments WHERE id=? LIMIT 1`
	const res = await pool.queryPromise( sql, the_comment._id )
	if( res.error ) return log('flag', res.error )

	// log('flag', 'delete res: ', res )
	if( res.results?.affectedRows !== 1 ) return log('flag', 'error remove comment db', res.results?.affectedRows )

	return true

}

const remove_comment_sub = event => {
	const { uuid } = event
	remove_comment( uuid )
	.catch( err => {
		log('flag', 'err remove comment', err )
	})
}

const remove_post = async( event ) => {

	const { 
		post_id,
		uuid,
		purge,
	} = event

	log('cache', 'remove post', post_id, uuid, purge )

	const { 
		post, 
		comment,
	} = await get_post( post_id, uuid )

	if( post ){

		// remove from cache
		for( const p of CACHE.POSTS ){
			if( p.uuid === post.uuid ){
				CACHE.POSTS.splice( CACHE.POSTS.indexOf( p ), 1 )
				break;
			}
		}

		if( purge ){
			post.unset()
			.catch( err => {
				log('flag', 'err delete post', err )
			})				
		}

	}

}







const get_post = async( post_id, uuid, deep ) => {

	if( deep ){ // call db lookups manually

		let key, value
		if( post_id ){	
			key = 'id'
			value = post_id
		}else if( uuid ){
			key = 'uuid'
			value = uuid
		}else{
			return false
		}
		const pool = DB.getPool()
		const sql = {
			sql: `
			SELECT * FROM posts 
			LEFT JOIN users ON posts.user_key=users.id
			WHERE ${ key }=?`,
			nestTables: true,
		}
		const res = await pool.queryPromise( sql, value )
		if( res.error ) return log('flag', res.error )
		if( res?.results?.[0] ){
			const data = res.results[0]
			const post = new Post( data.posts )
			if( data.users ){
				post.user_handle = data.users.handle
				post.user_slug = data.users.slug
			}
			return post
		}

	}else if( post_id ){
		for( const post of CACHE.POSTS ){
			if( post._id === post_id ) return post
		}		
	}else if( uuid ){
		for( const post of CACHE.POSTS ){
			if( post.uuid === uuid ) return post
		}		

	}

}


const get_comment = ( comment_id, uuid ) => {
	let comment
	if( comment_id ){
		for( const post of CACHE.POSTS ){
			for( const uuid in post._COMMENTS ){
				comment = post._COMMENTS[uuid]
				if( comment._id === comment_id ) return comment
			}
		}
	}else{
		for( const post of CACHE.POSTS ){
			for( const uuid2 in post._COMMENTS ){
				if( uuid2 === uuid ) return post._COMMENTS[uuid2]
			}
		}
	}
}


const get_vote = ( vote_id, user_key, comment_key ) => {
	let comment, vote
	if( vote_id ){
		for( const post of CACHE.POSTS ){
			for( const uuid in post._COMMENTS ){
				comment = post._COMMENTS[uuid]
				for( const id in comment._VOTES ){
					if( id === vote_id ){
						return {
							comment: comment,
							vote: comment._VOTES[id],
						}
					}
				}
			}
		}
	}else if( typeof user_key === 'number' && typeof comment_key === 'number'){
		for( const post of CACHE.POSTS ){
			for( const uuid in post._COMMENTS ){
				comment = post._COMMENTS[uuid]
				for( const id in comment._VOTES ){
					vote = comment._VOTES[id]
					if( vote._user_key === user_key && vote._comment_key === comment_key ){
						return {
							comment: comment,
							vote: vote,
						}
					}
				}
			}
		}
	}else{
		log('flag', 'invalid get vote', vote_id, user_key, comment_key )
	}
}



// subs

BROKER.subscribe('CACHE_POSTS_UPDATE', debounced_update_posts )
BROKER.subscribe('CACHE_POSTS_UPDATE_SYNC', update_post_cache )
BROKER.subscribe('CACHE_ADD_COMMENT', add_comment )
BROKER.subscribe('CACHE_ADD_VOTE', add_vote )

BROKER.subscribe('CACHE_REMOVE_COMMENT', remove_comment_sub )
BROKER.subscribe('CACHE_REMOVE_VOTE', remove_vote )
BROKER.subscribe('CACHE_REMOVE_POST', remove_post )


module.exports = {
	cache: CACHE,
	get_post,
	get_comment,
	remove_comment,
}