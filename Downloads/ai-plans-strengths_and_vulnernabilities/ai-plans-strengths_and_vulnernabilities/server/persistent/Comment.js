/*
	Comment
*/
const env = require('../.env.js')
const DB = require('../db.js')
const lib = require('../lib.js')
const Persistent = require('./Persistent.js')


class Comment extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'comments'
		this.uuid = init.uuid
		this._user_key = lib.validate_number( init.user_key, init._user_key, undefined )
		this._post_key = lib.validate_number( init.post_key, init._post_key, undefined )
		this.title = lib.validate_string( init.title, undefined )
		this.content = lib.validate_string( init.content, undefined )

		// ensure new posts come with uuid's - to prevent overwrites
		// void post if this happens
		if( !init.uuid ){
			log('flag', 'ERROR - must provide init.uuid when creating a new vulnerability')
			this._table = 'none'
			delete this._id
		}

		this._VOTES = init._VOTES || {}
		this.vote_score = init.vote_score || 0
		this.user_handle = lib.validate_string( init.user_handle, undefined )

	}

	clone( counter ){
		if( typeof counter?.n !== 'number' || typeof counter.cap !== 'number' ){
			log('flag', 'clone - invalid counter obj: ' + lib.identify( this ) )
			return {}
		}
		counter.n++
		if( counter.n > counter.cap ){
			log('flag', 'clone at cap')
			return {}
		}
		return new Comment( this )
	}

	abbreviate_title(){
		if( this.title.length > 40 ) return this.title.substr(0,40) + '...'
		return this.title
	}

	set_score(){
		let vote
		for( const uuid in this._VOTES ){
			vote = this._VOTES[ uuid ]
			if( lib.is_num( vote.score ) ) this.vote_score += vote.score
		}
	}

	is_poster( request ){
		const user = request?.session?.USER
		if( this._user_key && this._user_key === user._id ) return true
	}


	async save(){

		const update_fields = [
			'user_key',
			'post_key',
			'uuid',
			'title',
			'content',
		]

		const update_vals = [ 
			this._user_key,
			this._post_key,
			this.uuid,
			this.title,
			this.content,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}


module.exports = Comment
