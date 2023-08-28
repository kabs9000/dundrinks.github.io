import hal from '../hal.js?v=146'
import fetch_wrap from '../fetch_wrap.js?v=146'
import ui from '../ui.js?v=146'
import * as lib from '../lib.js?v=146'
import GLOBAL from '../GLOBAL.js?v=146'
import MEDIA_LIB from '../media_lib.js?v=146'
import fetch_arxiv from '../fetch_arxiv.js?v=146'





// decl

const form = document.getElementById('create-form')
const title = form.querySelector('input[name=title]')
const desc = form.querySelector('textarea[name=description]')
const content = form.querySelector('textarea[name=content]')
const attribution = form.querySelector('input[name=attribution]')
const media_lib = document.getElementById('media-lib')
// const is_public = form.querySelector('input[name=published]')
const submit = form.querySelector('.button.submit')

const respond_comment_uuid = location.href.split('c_uuid=')[1]






// bind

lib.add_length_count( title.parentElement, title, {
	max: GLOBAL.POST_LIMITS.TITLE,
	type: 'char',
	cling: true,
})
lib.add_length_count( desc.parentElement, desc, {
	max: GLOBAL.POST_LIMITS.DESCRIPTION,
	type: 'char',
	cling: true,
})
lib.add_length_count( content.parentElement, content, {
	max: GLOBAL.POST_LIMITS.CONTENT,
	type: 'char',
	cling: true,
})
lib.add_length_count( attribution.parentElement, attribution, {
	max: GLOBAL.POST_LIMITS.ATTRIBUTION,
	type: 'char',
	cling: true,
})

submit.addEventListener('click', () => {

	const t = title.value.trim()
	const d = desc.value.trim()
	const c = content.value.trim()
	const a = attribution.value.trim()
	let toolong
	if( t.length > GLOBAL.POST_LIMITS.TITLE ) toolong = 'title'
	if( d.length > GLOBAL.POST_LIMITS.DESCRIPTION ) toolong = 'description'
	if( c.length > GLOBAL.POST_LIMITS.CONTENT ) toolong = 'content'
	if( a.length > GLOBAL.POST_LIMITS.ATTRIBUTION ) toolong = 'attribution'
	if( toolong ){
		return hal('error', 'field too long: ' + toolong, 10 * 1000 )
	}

	fetch_wrap('/action_main', 'post', {
		action: 'create_post', // ( also clone endpoint )
		title: title.value.trim(),
		description: desc.value.trim(),
		content: content.value.trim(),
		attribution: attribution.value.trim(),

		// if exists:
		respond_comment_uuid: respond_comment_uuid,
	})
	.then( res => {
		if( res?.success ){
			hal('success', `success - view here:<br><a href="/post/${ res.uuid }">${ title.value }</a>`, 60 * 1000)
		}else{
			console.log( res )
			hal('error', res?.msg || 'error posting', 30 * 1000 )
		}
	})
	.catch( err => {
		console.error( err )
		hal('error', err?.msg || 'error posting', 30 * 1000 )
	})
})

media_lib.addEventListener('click', () => {
	MEDIA_LIB.pop_modal( true )
})






// init

// is a response post
if( respond_comment_uuid ){

	fetch_wrap('/action_main', 'post', {
		action: 'get_comment_response',
		uuid: respond_comment_uuid,
	})
	.then( res => {

		if( res?.success ){

			const {
				old_post,
				old_comment,
			} = res

			const responder = lib.b('div', 'respond-comment')
			const expl = lib.b('div')
			expl.innerText = `Revising in response to vulnerability:
${ old_comment.title }`
			responder.append( expl )
			form.prepend( responder )

			// refill content
			title.value = old_post.title
			desc.value = old_post.description
			content.value = old_post.content

		}

	})
	.catch( err => {
		hal('error', err?.msg || 'error ')
	})

}

