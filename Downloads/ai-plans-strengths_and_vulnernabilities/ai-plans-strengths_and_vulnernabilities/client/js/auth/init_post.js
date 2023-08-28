import env from '../env.js?v=146'
import hal from '../hal.js?v=146'
import fetch_wrap from '../fetch_wrap.js?v=146'
import ui from '../ui.js?v=146'
import * as lib from '../lib.js?v=146'
import GLOBAL from '../GLOBAL.js?v=146'
import { Modal } from '../Modal.js?v=146'
import Prompt from '../Prompt.js?v=146'






// decl

const wrapper = document.querySelector('.post-wrap')
const title = wrapper.querySelector('.post-title')
const description = wrapper.querySelector('.post-description')
const content = wrapper.querySelector('.post-content')
const comments = document.querySelector('#comments')
const comments_list = comments.querySelector('.content')
const add_comment = document.getElementById('add-comment')
const pdf_embeds = document.querySelectorAll('.embed-pdf-wrap')


const uuid = location.href.split('/post/')[1]
const is_author = wrapper.getAttribute('data-is-author') === 'true'
const user_slug = document.getElementById('header').getAttribute('data-user')
const can_edit = wrapper.getAttribute('data-can-edit') === 'true'








// lib

const remove_comment = e => {

	if( !confirm('Delete comment?')) return;

	const btn = e.target
	const uuid = btn.getAttribute('data-uuid')
	fetch_wrap('/action_main', 'post', {
		action: 'remove_comment',
		uuid: uuid,
	})
	.then( res => {
		if( res.success ){
			hal('success', 'comment removed', 5 * 1000)
			btn.parentElement.parentElement.remove()
		}else{
			hal('error', res?.msg || 'error removing comment', 10 * 1000)
		}
	})

}

const build_vote_area = comment => {
	const wrap = lib.b('div', false, 'comment-voting')
	const upvote = lib.b('div', false, 'vote', 'button')
	upvote.setAttribute('data-vote-type', 'single_up')
	upvote.setAttribute('data-vote-comment', comment.uuid )
	if( comment.user_vote ){
		upvote.innerText = 'remove vote'
	}else{
		upvote.innerText = 'upvote'
	}
	upvote.addEventListener('click', set_vote )
	wrap.append( upvote)
	return wrap
}

const build_comment = comment => {
	const wrap = lib.b('div', false, 'comment-wrap')
	wrap.setAttribute('data-uuid', comment.uuid )
	const title = lib.b('div', false, 'comment-title')
	title.innerText = comment.title
	const content = lib.b('div', false, 'comment-content')
	content.innerText = comment.content
	wrap.append( title )
	wrap.append( content )

	// actions
	const actions = lib.b('div', false, 'comment-actions')
	// remove
	if( lib.is_admin || user_slug === comment.user_slug || env.LOCAL ){
		const remove = lib.b('div', false, 'button', 'comment-rm')
		remove.innerHTML = '&times;'
		remove.setAttribute('data-uuid', comment.uuid )
		remove.addEventListener('click', remove_comment )
		actions.append( remove )
	}
	// respond 
	if( is_author ){
		const respond = lib.b('div', false, 'comment-respond', 'button')
		respond.innerText = 'revise plan for vulnerability'
		respond.setAttribute('data-comment-uuid', comment.uuid )
		respond.addEventListener('click', prompt_revision )
		actions.append( respond )
	}
	wrap.append( actions )
	
	// const vote_status = lib.b('div', false, 'comment-votes')
	// vote_status.innerText = 'votes: ' + ( comment.vote_score || 0 )
	// wrap.append( vote_status )
	// const vote_area = build_vote_area( comment )
	// wrap.append( vote_area )
	return wrap
}

const set_vote = e => {
	const btn = e.target
	const type = btn.getAttribute('data-vote-type')
	const uuid = btn.getAttribute('data-vote-comment')
	if( !type ) return console.error('invalid vote click')
	fetch_wrap('/action_main', 'post', {
		action: 'set_vote',
		type: type,
		uuid: uuid,
	})
	.then( res => {
			console.log( res )
		if( res.success ){
			hal('success', ( res.vote ? 'added' : 'removed' ) + ' vote', 4000 )
			if( res.vote ){
				btn.innerText = 'remove vote'
			}else{
				btn.innerText = 'upvote'
			}
			// btn.classList.add('disabled')
		}else{
			hal('error', res?.msg || 'error setting vote', 15000 )
		}
	})
	.catch( err => {
		console.error( err )
		hal('error', err?.msg || 'error', 15000 )
	})
}

const prompt_revision = e => {

	const btn = e.target
	const comment_uuid = btn.getAttribute('data-comment-uuid')
	const prompt = new Prompt({
		type: 'some-prompt',
		args: [],
		callback: () => {
			// console.log( uuid )
			fetch_wrap('/action_main', 'post', {
				action: 'lock_post',
				uuid: uuid,
			})
			.then( res => {
				if( res.success ){
					location.assign('/create?c_uuid=' + comment_uuid )
				}else{
					hal("error", res?.msg || 'error locking post', 15 * 1000)
				}
			})
			.catch( err => {
				console.error( err )
				hal('error', 'error locking post', 15000 )
			})
		}
	})
	const expl = lib.b('div')
	expl.innerText = 'Doing this will lock the current post permanently, and clone a new one to revise in response to this vulnerability.  Go ahead?'
	prompt.content.prepend( expl )

	document.body.append( prompt.ele )

}


const save_local = e => {

	const input = e.target

	const mcontent = input.parentElement

	let text, textarea

	if( input.nodeName === 'INPUT'){
		text = input
		textarea = mcontent.querySelector('textarea')
	}else{
		text = mcontent.querySelector('input')
		textarea = input
	}

	localStorage.setItem('aip-mid-uuid', text.value )
	localStorage.setItem('aip-mid-text', text.value )
	localStorage.setItem('aip-mid-textarea', textarea.value )


}

const debounced_local_save = lib.make_debounce( save_local, 500, false )









// bind

add_comment.addEventListener('click', () => {

	console.log("clicked comment")

	const modal = new Modal({
		type: 'add_comment',
		header: 'Add a vulnerability or strength'
	})

    const commentType = document.createElement('select');
    commentType.name = 'comment_type';
    const option1 = document.createElement('option');
    option1.value = 'Strength';
    option1.text = 'Strength';
    commentType.appendChild(option1);
    const option2 = document.createElement('option');
    option2.value = 'Vulnerability';
    option2.text = 'Vulnerability';
    commentType.appendChild(option2);
    modal.content.appendChild(commentType); 
	const lsUuid = localStorage.getItem('aip-mid-uuid')
	const lsText = localStorage.getItem('aip-mid-text')
	const lsTextArea = localStorage.getItem('aip-mid-textarea')

	const title = lib.b('input', false, 'input')
	title.name = 'title'
	title.type = 'text'
	title.placeholder = 'vulnerability title'
	title.addEventListener('keyup', debounced_local_save )
	if( uuid === lsUuid && lsText ){
		title.value = lsText
	}
	modal.content.append( title )

	const content = lib.b('textarea', false, 'input')
	content.name = 'content'
	content.placeholder = 'your feedback here'
	content.addEventListener('keyup', debounced_local_save )
	if( uuid === lsUuid && lsTextArea ){
		content.value = lsTextArea
	}
	modal.content.append( content )

	modal.content.append( lib.b('br'))
	modal.content.append( lib.b('br'))

	const submit = lib.b('div', false, 'button')
	submit.innerText = 'submit feedback'
	submit.addEventListener('click', () => {

		const t = title.value.trim()
		const c = content.value.trim()

		if( !t || !c ) return hal('error', 'both title and content required', 4000 )

		delete localStorage['aip-mid-text']
		delete localStorage['aip-mid-textarea']

		fetch_wrap('/action_main', 'post', {
			action: 'create_vulnerability',
			post_uuid: uuid,
			title: t,
			content: c,
			comment_type: commentType.value
		})
		.then( res => {
			if( res.success ){
				hal('success', 'success', 1000)
				setTimeout(() => {
					location.reload()
				}, 1000)
			}else{
				hal('error', res?.msg || 'error submitting comment', 10 * 1000 )
			}
		})
		.catch( err => {
			console.error( err )
			hal('error', err?.msg || 'error submitting comment', 10 * 1000 )
		})
	})
	modal.content.append( submit )

	document.body.append( modal.ele )
	console.log('should be appending', modal.ele)

	// ( these have to happen after added to DOM ^^ )
	lib.add_length_count( content.parentElement, content, {
		max: GLOBAL.POST_LIMITS.COMMENT_CONTENT,
		type: 'char',
		cling: true,
	})
	lib.add_length_count( title.parentElement, title, {
		max: GLOBAL.POST_LIMITS.TITLE,
		type: 'char',
		cling: true,
	})

})







// init

fetch_wrap('/action_main', 'post', {
	action: 'get_post_comments',
	uuid: uuid,
})
.then( res => {
	if( env.LOCAL ) console.log( res )
	if( res?.success ){
		comments_list.innerText = ''
		if( res.comments?.length ){
			res.comments.reverse()
			for( const comment of res.comments ){
				const wrap = build_comment( comment )
				comments_list.append( wrap )
			}
		}else{
			comments_list.innerText = 'No vulnerabilities yet'
		}
	}else{
		hal('error', res?.msg || 'error fetching vulnerabilities', 20 * 1000 )
	}
})
.catch( err => {
	console.error( err )
	hal('error', err?.msg || 'error fetching vulnerabilities', 20 * 1000 )
})

// handle PDF expands

for( const pdf of pdf_embeds ){
	console.log('nah?', pdf )
	const iframe = pdf.querySelector('iframe')
	iframe.style.width = '100%'
	setTimeout(() => {
		const bounds = pdf.parentElement.getBoundingClientRect()
		iframe.style.height = ( bounds.width * ( 11/8 ) ) + 'px' 
	}, 50)
}
