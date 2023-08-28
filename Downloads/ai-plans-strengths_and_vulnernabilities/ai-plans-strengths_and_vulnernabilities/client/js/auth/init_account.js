import hal from '../hal.js?v=146'
import fetch_wrap from '../fetch_wrap.js?v=146'
import ui from '../ui.js?v=146'
import * as lib from '../lib.js?v=146'
import GLOBAL from '../GLOBAL.js?v=146'
import MEDIA_LIB from '../media_lib.js?v=146'






const content = document.querySelector('#content')
const media_upload = document.querySelector('#media-library .button')
const media_library = document.querySelector('#media-library .content')

const FIELD_MAP = {
	_email: 'text',
	handle: 'text',
	slug: 'text',
	// color: 'color',
	_password: 'text',
}
const ALLOWED_TYPES = [
	'text', 
	'password', 
	'email', 
	'checkbox', 
	// 'color',
]
const NO_SHOWS = ['_password']
const NO_EDITS = ['_email', 'slug'] // 'handle'

content.classList.add('pal-contain')









// --------------------------- 
// single form / field maker 
// --------------------------- 
const map_field = field => {
	if( field == 'slug' ) return 'user id'
	return field.replace('_', '')
}

const build_field_setter = ( type, field, data, trigger_text, editable ) => {

	data = data || {}

	const form = build_form( type, field )

	const the_input = form.querySelector('input')

	if( !NO_SHOWS.includes( field )){
		the_input.value = data[ field ]
	}
	const label = lib.b('label')
	label.innerText = map_field( field )
	form.prepend( label )

	form.onsubmit = e => {

		e.preventDefault()

		ui.spinner.show()

		fetch_wrap('/action_account', 'post', {
			action: 'set_field',
			data: {
				field: field,
				value: ( the_input.type === 'checkbox' ? the_input.checked : the_input.value ),
			}
		})
		.then( res => {

			if( field === '_password') the_input.value = ''
			
			if( res?.success ){
				// form.style.display = 'none'
				// reset.classList.remove('hidden')
				hal('success', 'success', 3000)
			}else{
				hal('error', res?.msg || 'failed to set', 10 * 1000 )
			}
			ui.spinner.hide()
		})
		.catch( err => {
			console.log( err )
			hal('error', 'error', 10 * 1000)
			ui.spinner.hide()
		})

	}

	return form

} // build form / field



// --------------------------- 
// single form / field maker for ^^
// --------------------------- 
const build_form = ( type, field ) => {
	const no_edit = NO_EDITS.includes( field )
	if( !ALLOWED_TYPES.includes( type ) ) throw new Error('unhandled form type: ' + type )
	const form = lib.b('form')
	const input = lib.b('input', false)
	input.classList.add('input')
	input.placeholder = ( field || 'enter value here' ).replace('_', '')
	input.type = type
	if( no_edit ) input.setAttribute('disabled', true)
	form.append( input )
	if( !no_edit ){
		// form.append( lib.b('br'))
		const submit = lib.b('input', false, 'button')
		submit.type = 'submit'
		submit.value = 'update'
		form.append( submit )		
	}
	return form 
}











// --------------------------- 
// builders
// --------------------------- 
const render_user = ( wrapper, user ) => {

	const user_row = lib.b('div')
	const expl = lib.b('span')
	expl.innerText = 'user page: '
	const user_link = lib.b('a')
	user_link.href = '/user/' + user.slug
	const user_handle = lib.b('div')
	user_link.innerText = user.handle

	user_row.append( expl )
	user_row.append( user_link )

	wrapper.append( user_row )

	for( const field in FIELD_MAP ){
		if( !user[ field ] ) continue
		wrapper.append( build_field_setter( FIELD_MAP[ field ], field, user, false ) )
	}

}

const render_actions = ( wrapper ) => {

	const actions = lib.b('div', 'account-actions')

	const rm = lib.b('div', false, 'button', 'remove')
	rm.innerText = 'delete account'
	rm.addEventListener('click', () => {

		if( prompt('This will permanently remove your account, posts, and vulnerabilities - type "delete" to continue') !== 'delete' ) return;

		fetch_wrap('/action_account', 'post', {
			action: 'remove_account'
		})
		.then( res => {
			if( res.success ){
				hal('success', 'success', 1000)
				setTimeout(()=>{
					location.assign('/')
				}, 1000)
			}else{
				hal( 'error', res?.msg || 'error removing', 5000 )
			}
		})
		.catch( err => {
			console.error( err )
			hal('error', err?.msg || 'error removing', 5000 )
		})
	})
	actions.append( rm )

	wrapper.append( actions )

}







// bind

media_upload.addEventListener('click', () => {
	MEDIA_LIB.pop_modal()
	.catch( err => {
		console.error( err )
	})
})








// --------------------------- 
// init
// --------------------------- 
fetch_wrap('/action_account', 'post', {
	action: 'get_account',
})
.then( async res => {

	console.log('pal account data: ', res )

	if( !res?.success ) return hal('error', res?.msg || 'failed to get account', 5000)

	// -- init the DOM:

	// --------------- top wrap; users ---------------
	const user_wrap = document.getElementById('user-wrap')
	const action_wrap = document.getElementById('user-actions')
	// const hosting_wrap = document.getElementById('hosting-wrap')
	const active_wrap = document.getElementById('active-wrap')
	const portal_wrap = document.getElementById('portal-wrap')
	const inv_wrap = document.getElementById('inventory-wrap')

	render_user( user_wrap, res.user )

	render_actions( action_wrap )

	MEDIA_LIB.get( media_library, true )

	// if( !res.user.is_hosting_account ){
	// 	hosting_wrap.remove()
	// 	return console.log('done...')
	// }


})

