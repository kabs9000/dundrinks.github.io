/*
	Post
*/
const fs = require('fs')
const env = require('../.env.js')
const { IMAGE_TYPES } = require('../data/PRIVATE.js')
const DB = require('../db.js')
const lib = require('../lib.js')
const log = require('../log.js')
const Persistent = require('./Persistent.js')




class Post extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'posts'
		this.uuid = init.uuid
		this._user_key = lib.validate_number( init.user_key, init._user_key, undefined )
		this.title = lib.validate_string( init.title, undefined )
		this.description = lib.validate_string( init.description, undefined )
		this.content = lib.validate_string( init.content, undefined )
		this.attribution = lib.validate_string( init.attribution, undefined )
		this.published = init.published || 0
		this.muted = init.muted || 0
		this.archived = init.archived || 0
		this.respond_comment_uuid = lib.validate_string( init.respond_comment_uuid, undefined )


		// ensure new posts come with uuid's - to prevent overwrites
		// void post if this happens
		if( !init.uuid ){
			log('flag', 'ERROR - must provide init.uuid when creating a new post')
			this._table = 'none'
			delete this._id
		}

		// instantiated (but still inheritable)
		this._COMMENTS = init._COMMENTS || {}
		this.vote_score = init.vote_score || 0 // the main score index
		this._sorted_comments = init._sorted_comments || []
		this._comments_length = init._comments_length
		this.user_handle = lib.validate_string( init.user_handle, undefined )
		this.user_slug = lib.validate_string( init.user_slug, undefined )

	}

	set_score(){
		let comment
		for( const uuid in this._COMMENTS ){
			comment = this._COMMENTS[ uuid ]
			comment.set_score()
			this.vote_score += comment.vote_score
		}

		// re sort comment cache
		this._sorted_comments.length = 0
		for( const uuid in this._COMMENTS ){
			this._sorted_comments.push( this._COMMENTS[uuid ].clone({
				n: 0,
				cap: 1,
			}))
		}
		this._sorted_comments.sort((a, b) => {
			return a.vote_score > b.vote_score ? 1 : -1
		})

		// html:
		let c = 0
		const limit = 3
		this.comment_summary_roll = `
		<h4 class='post-crit-title'>${ this._sorted_comments.length ? 'criticisms' : '(no vulnerabilities yet)'}</h4>
		<div class="post-comment-summary">`
			for( const comment of this._sorted_comments ){
				if( c+1 > limit ) break;
				this.comment_summary_roll += `
				<div class='comment-'>
					 ${ comment.abbreviate_title() } <span style='display:none'>(${ comment.vote_score || 0 })</span>
				</div>`
				c++
			}
			this.comment_summary_roll += `
			${ this._sorted_comments.length > limit ? '<div class="more-comments">' + ( this._sorted_comments.length - limit ) + ' more comments</div>' : '' }
		</div>`
		// end html

	}

	remove_embeds( text ){

		if( typeof text !== 'string' ) return log('flag', 'invalid embed')

		const regex = new RegExp(/\[\[.*\]\]/g)

		text = text.replace( regex, '' )

		return text

	}

	async convert_embeds( text, request ){

		if( typeof text !== 'string' ){
			log('flag', 'invalid post content for embed: ', typeof text )
			return 'invalid text'
		}

		const regex = new RegExp(/\[\[(.*?)\]\]/g)

		const matches = Array.from( text.matchAll( regex ) )

		let finaltext
		// has embedded media:
		if( matches.length ){ 

			finaltext = '<div class="embed-wrap">'

			let match
			let cursor = 0
			for( let i = 0; i < matches.length; i++ ){
			// for( let i = matches.length - 1; i >= 0; i-- ){

				match = matches[i]
				// log('flag', 'match: ', match )

				// generate the embed
				log('embeds', 'found embed code, swapping in: ', match[0], match[1] )
				const embed = await this.get_embed_html( request, match[1].trim() )
				log('embeds', 'got html: \n' + embed )

				// now embed it..
				if( typeof embed === 'string' ){ 

					const match_start = match.index
					const match_end = match.index + match[0].length

					// const next_text_end = text.length - match.index
					// const text_length = next_text_end - cursor

					// log('flag', 'rendering from : ', cursor, ' for n: ', text_length )
					// const next_match = matches[i+1]
					// let next_start
					// if( next_match ){
					// 	next_start = next_match.index
					// }
					// let intervening_chars
					// if( next_start ){
					const intervening_chars =  match.index - cursor 
					// }

					const intervening_text = text.substr( cursor, intervening_chars )
					// const intervening_text = text.substr( cursor, intervening_chars )

					log('Post', `matching embed code:
match i: ${ i }
match start: ${ match_start }
match_end: ${ match_end }
intervening_chars: ${ intervening_chars }
`)
// next start: ${ next_start }
// cursor: ${ cursor }
// intervening_text: ${ intervening_text }

					finaltext += `
<div class='text-section'>${ intervening_text }</div>
<div class='embed-section'>${ embed }</div>`

					cursor += intervening_chars + match[0].length
					// match_end + embed.length
					
					// log('flag', 'cursor now: ', cursor )

				}

				// add last text if at end
				if( i === matches.length - 1 ){
					finaltext += `<div class='text-section'>${ text.substr( cursor + match.index + match[0].length ) }</div>`
				}

			}

			finaltext += `</div>`

		}else{

			finaltext = text

		}

		return finaltext

	}

	async get_embed_html( request, embed_code, is_private ){

		if( embed_code.match(/^\s*arxiv/) ){

			const path = `/fs/arxiv/${ embed_code.replace(/^\s*arxiv\s*/, '') }.pdf`

			let private_url = `${ env.ROOT }${ path }`

			// log('flag', 'got purl: ', private_url )
			// log('flag', 'got path: ', path )

			if( fs.existsSync( private_url ) ){
				const pub_url = env.SITE_URL + path
				// log('flag', 'mmk : ', pub_url )
				return `
				<div class='embed-pdf-wrap'>
					<iframe src='${ path }#toolbar=0&navpanes=0&zoom=off'></iframe>
				</div>`
			}else{
				log('flag', 'missing PDF: ', private_url )
				return `<div class="missing-embed">(missing embedded PDF)</div>`
			}
		}

		const uuid = embed_code

		const user = request.session?.USER

		const pool = DB.getPool()
		let sql, res, args
		sql = `SELECT * FROM media WHERE uuid=?`
		args = uuid.trim()
		if( is_private ){
			 sql += ` AND user_key=?`
			 args = [ args, user._id ]
		}
		res = await pool.queryPromise( sql, args )
		if( res.error ){
			log('flag', 'embed err', res.error )
			return ''
		}
		if( res.results?.length !== 1 ){
			log('flag', 'invalid embed results: ' + res.results?.length + ',' + uuid )
			return '<div class="missing-embed">(missing embedded file)</div>'
		}
		const item_data = res.results[0]
		log('embeds', 'embedding item: ', item_data )

		// const type = lib.deduce_type( item_data.slug )
		let html
		if( IMAGE_TYPES.includes( item_data.filetype ) ){
			html = `<div class='embed-image-wrap'><img src='/fs/${ item_data.slug }'></div>`
		}else if( item_data.filetype === 'pdf' ){
			html = `
			<a href='/fs/${ item_data.slug }' target='_blank'>open PDF in new tab</a>
			<div class='embed-pdf-wrap'><iframe src='/fs/${ item_data.slug }#toolbar=0&navpanes=0&zoom=off'></iframe></div>`
		}else{
			html = ''
			log('flag', 'invalid filetype for embed html: ' + item_data.filetype )
		}

		return html

	}

	
	output_summary(){

		const fields = {
			title: this.title || '(untitled)',
			descrip: this.description || '',
		}
		for( const key in fields ){
			fields[key] = lib.user_data( fields[key], {
				strip_html: true,
			})
		}

		fields.title = this.remove_embeds( fields.title )
		fields.descrip = this.remove_embeds( fields.descrip )

		let html = `
<div class='post-wrap'>
	<h4 class='post-title post-summary-field'><a href='/post/${ this.uuid }'>${ fields.title }</a></h4>
	<div class='post-attributions'>
		<div class='post-attr'>
			${ this.attribution ? 'attributed to: ' + this.attribution + '' : '' }
		</div>
		<div class='post-poster'>
			posted by: ${ this.gen_user_link() }
		</div>
	</div>
	${ fields.descrip ? "<div class='post-description post-summary-field'>" + fields.descrip + "</div>" : '' }
       <div class='read-more'>
        <a href='/post/${this.uuid}'>Read More</a>
      </div>
	${ this.comment_summary_roll }
</div>`
		return html
	}
	
	gen_user_link(){

		if( this.user_slug ){
			// log('flag', 'wh: ', this.user_slug )
			// return this.user_slug
			return `<a class='user-link' href='/user/${ this.user_slug }'>${ this.user_handle || '(anon)' }</a>`
		}else{
			return `${ this.user_handle || '(anon)' }`
		}

	}


	async output_full( request ){

		const fields = {
			date: new Date( this._created ).toLocaleString().split(',')[0],
			title: this.title || '(untitled)',
			descrip: this.description || '',
			content: this.content || ''
		}
		// sanitize
		for( const key in fields ){
			fields[key] = lib.user_data( fields[key], {
				strip_html: true,
			})
		}
		// doublecheck user is not embedding plans anywhere but content
		fields.title = this.remove_embeds( fields.title )
		fields.descrip = this.remove_embeds( fields.descrip )

		// render embeds
		fields.content = await this.convert_embeds( fields.content, request )

		const can_edit = this.can_edit( request )
		const is_author = this.is_author( request )

		let html = `
<div class='post-wrap' data-can-edit='${ can_edit }' data-is-author='${ is_author }'>
	<div class='post-title post-field'>${ lib.user_data( fields.title ) }</div>
	${ this.attribution_html() }
	<div class='post-author post-field'>posted by: ${ this.gen_user_link() }</div>
	<div class='post-description post-field'>${ lib.user_data( fields.descrip ) }</div>
	<div class='post-content post-field'>${ lib.user_data( fields.content ) }</div>
</div>`
		return html
	}


	can_edit( request ){
		return !!( env.LOCAL || ( this.is_author( request ) || 0 ) )
	}

	is_author( request ){
		return !!( this._user_key && this._user_key === request?.session?.USER?._id )
	}

	attribution_html(){
		if( this.attribution ) return `<div class='post-attribution post-field'>attributed to: ${ this.attribution }</div>`
		return ''
	}


	async save(){

		const update_fields = [
			'user_key',
			'uuid',
			'title',
			'description',
			'content',
			'attribution',
			'published',
			'muted',
			'archived',
			'respond_comment_uuid',
		]

		const update_vals = [ 
			this._user_key,
			this.uuid,
			this.title,
			this.description,
			this.content,
			this.attribution,
			this.published,
			this.muted,
			this.archived,
			this.respond_comment_uuid,
		]

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}





module.exports = Post
