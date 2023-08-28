import ui from '../ui.js?v=146'
import * as lib from '../lib.js?v=146'
import hal from '../hal.js?v=146'
import fetch_wrap from '../fetch_wrap.js?v=146'
import GLOBAL from '../GLOBAL.js?v=146'
import { Modal } from '../Modal.js?v=146'



// const content = document.querySelector('#content')
const results = document.getElementById('admin-content')
const views = document.getElementById('admin-views')

// const ACTIONS = {}

// ---------------------------
// build sections as needed
// ---------------------------
// build sections as needed
// build buttons below and append them into these sections
const user_section = lib.b('div', 'section-user', 'admin-section')
views.append( user_section )

const mod_section = lib.b('div', 'section-mod', 'admin-section')
views.append( mod_section )

const maint_section = lib.b('div', 'section-maint', 'admin-section')
views.append( maint_section )


const GUIDES = {
	users: false,
	plans: false,
	backup: false,
}
for( const key in GUIDES ) GUIDES[key] = lib.b('div', false, 'admin-guide')
GUIDES.users.innerHTML = `
<p>User blocks currently hide all their posts from the front page only.</p>
<p>Their single post pages will still be visible.</p>
<p>They are blocked from adding new comments. Old ones remain visible.</p>
<p>The user is not notified when blocked.</p>
`
GUIDES.plans.innerHTML = ``
GUIDES.backup.innerHTML = ``




const build_server_action = ( action, success ) => {
	/*
		action + callback - all logic on server
	*/

	const btn = lib.b('div', false, 'button')
	btn.innerHTML = action.replace(/_/g, ' ')
	btn.addEventListener('click', () => {
		fetch_wrap('/action_admin', 'post', {
			action: action,
		})
		.then( res => {
			if( res?.success ){
				success( res )
			}else{
				hal('error', res?.msg || 'failed action', 5000 )
			}
		})
		.catch( err => {
			hal('error', err?.msg || 'error', 10 * 1000 )
			console.log( err )
		})
	})

	return btn

}







// ---------------------------
// user section actions
// ---------------------------

// --- users
const users = build_server_action('users', res => {
	console.log( res )
	results.innerHTML = ''

	results.append( GUIDES.users )

	for( const user of res.results ){
		results.append( build_user( user ) ) // , res.stripe_products
	}
})
user_section.append( users )

const flush_users = lib.b('div', false, 'button')
flush_users.innerText = 'logout users'
flush_users.addEventListener('click', () => {

	if( !confirm(`This will log out all users, except yourself. 
This is needed when changes to user or session structures are made.  
Continue?`) ) return;

	fetch_wrap('/action_admin', 'post', {
		action: 'flush_users',
	})
	.then( res => {
		if( res?.success ){
			hal('success', 'flushed', 5000 )
		}else{
			hal('error', res?.msg || 'error', 15 * 1000 )
		}
	})
	
})
user_section.append( flush_users )

// --- end users



// ---------------------------
// moderation section actions
// ---------------------------
const plans = build_server_action('plans', res => {
	console.log( res )
	results.innerHTML = ''

	results.append( GUIDES.plans )

	for( const user of res.results ){
		results.append( build_plan( user ) )
	}
})
mod_section.append( plans )






// ---------------------------
// maintentance section actions
// ---------------------------

// --- backups
const backup = build_server_action( 'backup', res => {

	results.append( GUIDES.backups )

	if( res?.success ){
		hal('success', res.msg || 'success backing up', 10 * 1000 )
	}else{
		hal('error', res?.msg || 'error backing up', 10 * 1000 )
		console.log( res )
	}
})
maint_section.append( backup )
// --- end backups





// ---------------------------
// lib
// ---------------------------

const user_fields = {
	email: 'text',
	handle: 'text',
	confirmed: 'text',
	// color: 'text',
	reset_time: 'date',
	created: 'date',
	edited: 'date',
}

const build_user = ( user_data ) => {

	// console.log('building', user_data )

	const wrapper = lib.b('div', false, 'user-row')
	if( user_data.blocked ) wrapper.classList.add('blocked')
	const name = lib.b('div', false, 'column', 'column-3')
	if( user_data.color ){
		name.style.color = user_data.color
		name.style['font-weight'] = 'bold'
	}
	const name_box = lib.b('div', false, 'name-box')
	name_box.innerHTML = user_data.email
	// name_box.style['background'] = lib.offset_color( user_data.color, true )
	name.append( name_box )
	// name.innerHTML = user_data.email

	wrapper.append( name )

	wrapper.addEventListener('click', e => {

		if( e.target.type === 'checkbox') return

		const modal = new Modal({	
			type: 'user-edit',
		})

		console.log('blocked.. ?', user_data.email, user_data.blocked )

		// basic
		const basic_data = lib.b('div', false, 'user-basic-data')
		// basic_data.innerHTML = `<pre>${ JSON.stringify( user, false, 2 )  }</pre>`
		for( const field in user_fields ){
			const row = lib.b('div', false, 'user-data-row')
			if( field === 'color'){
				// row.style.color = user_data[ field ]
				// row.style.background = lib.offset_color( user_data.color, true )
				row.style.display = 'inline-block'
			}
			const field_type = user_fields[field]
			if( field_type === 'text' ){
				row.innerText = `${ field }: ${user_data[ field ]}`
			}else if( field_type === 'date' ){
				row.innerText = `${field}: ${new Date( user_data[ field ] ).toLocaleString()}`
			}
			basic_data.append( row )
		}
		modal.content.append( basic_data )

		const block = lib.b('div', false, 'button', 'sensitive-action')
		block.innerText = user_data.blocked ? 'unblock user' : 'block user'
		block.addEventListener('click', () => {

			const is_blocked = !!wrapper.classList.contains('blocked')

			fetch_wrap('/action_admin', 'post', {
				action: 'block_user',
				slug: user_data.slug,
				state: !is_blocked,
			})
			.then( res => {
				if( res?.success ){
					const id = user_data.handle + ' / ' + user_data.email
					if( is_blocked ){
						hal('success', 'unblocked ' + id, 5000 )
						wrapper.classList.remove('blocked')
						block.innerText = 'block user'
					}else{
						hal('success', 'blocked ' + id, 5000 )
						wrapper.classList.add('blocked')
						block.innerText = 'unblock user'
					}
				}else{
					hal('error', res?.msg || 'error blocking', 15 * 1000 )
				}
			})
			.catch( err => {
				console.error( err )
				hal('error', err?.msg || 'error blocking', 15 * 1000 )
			})
		})
		modal.content.append( block )

		document.body.append( modal.ele )
	})
	return wrapper
} // build user



const build_plan = plan_data => {
	const wrap = lib.b('div', false, 'plan-wrap')
	const user_id = plan_data.user_handle || plan_data.user_slug || '(anon)'
	if( plan_data.user_blocked ){
		wrap.classList.add('user-blocked')
		wrap.setAttribute('data-user-blocked', plan_data.user_blocked )
		wrap.title = 'plan by ' + user_id + ' (blocked)'
	}else{
		wrap.title = 'plan by ' + user_id
	}
	if( plan_data.archived ) wrap.classList.add('archived')
	if( plan_data.published ) wrap.classList.add('published')
	if( plan_data.muted ) wrap.classList.add('muted')
	const title = lib.b('a', false, 'plan-title')
	title.href = `/post/${ plan_data.uuid }`
	title.innerText = plan_data.title
	wrap.append( title )
	const hide_plan = lib.b('div', false, 'button')
	hide_plan.setAttribute('data-uuid', plan_data.uuid )
	hide_plan.setAttribute('data-action', 'hide' )
	hide_plan.innerText = plan_data.archived ? 'un-hide' : 'hide'
	hide_plan.addEventListener('click', set_plan_state )
	wrap.append( hide_plan )
	const delete_plan = lib.b('div', false, 'button', 'delete')
	delete_plan.setAttribute('data-uuid', plan_data.uuid )
	delete_plan.setAttribute('data-action', 'delete' )
	delete_plan.innerText = 'delete'
	delete_plan.addEventListener('click', set_plan_state )
	wrap.append( delete_plan )
	return wrap
}



const set_icon_checked = ( input, state ) => {
	// console.log('toggling....', product_id, e.target.checked )
	if( state ){ // input.classList.contains('checked')
		input.parentElement.classList.add('checked')
	}else{
		input.parentElement.classList.remove('checked')
	}
}


const set_plan_state = async( e ) => {
	// const slug = e.target.getAttribute('data-slug')
	const plan_action = e.target.getAttribute('data-action')
	const uuid = e.target.getAttribute('data-uuid')
	if( !uuid ) return hal('error', 'no plan uuid', 5000)

	const action = plan_action == 'hide' ? 'hide / unhide' : 'delete'

	if( !confirm('proceed with action: '+ action + ' ?') ) return;

	fetch_wrap('/action_admin', 'post', {
		action: 'set_plan_state',
		plan_action: plan_action,
		uuid: uuid,
	})
	.then( res => {
		if( res.success ){
			hal('success', 'success', 3000)
			plans.click()
		}else{
			hal('error', res?.msg || 'error', 10000)
		}
		// set_icon_checked( e.target, res.state )
		console.log( res )
	})
}

