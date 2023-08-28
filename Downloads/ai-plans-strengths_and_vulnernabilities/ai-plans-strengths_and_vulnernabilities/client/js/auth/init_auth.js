import env from '../env.js?v=146'
import ui from '../ui.js?v=146'
import hal from '../hal.js?v=146'
import * as lib from '../lib.js?v=146'
import { Modal } from '../Modal.js?v=146'// system/ui
import fetch_wrap from '../fetch_wrap.js?v=146'




const register_submit = document.querySelector('#register-form .button')
const register_form = document.querySelector('#register-form')
const email = document.getElementById('email')
const register_email = document.getElementById('register-email')
const pw = document.getElementById('password')
const register_pw = document.getElementById('register-password')
const pw2 = document.getElementById('password2') // ( only for regiseter )

const login_submit = document.querySelector('#login-form .button')
const login_form = document.querySelector('#login-form')

const forgot = document.querySelector('#forgot a')

const select_login = document.querySelector('.auth-selector[data-type=login]')
const select_register = document.querySelector('.auth-selector[data-type=register]')







const register = async() => {

	if( register_pw.value !== pw2.value ) {
		hal('error', 'passwords don\'t match', 2000 )
		if( env.LOCAL ) console.log( register_pw.value, pw2.value )
		return false
	}

	ui.spinner.show()

	const response = await fetch_wrap('/register', 'post', {
    	email: register_email.value.trim(),
    	password: register_pw.value.trim()
    })

	ui.spinner.hide()

	if( response.success === true ){
		hal('success', 'success', 1000 )
		localStorage.setItem('aip-email', register_email.value.trim() )
		setTimeout(function(){
			location.href = '/account'
		}, 1000 )
	}else{
		hal('error', response.msg, 3000 )
	}

}

const login = async( email_val, pw_val ) => {
	
	const response = await fetch_wrap('/login', 'post', {
		email: email_val || email.value.trim(),
		password: pw_val || pw.value.trim()
	})

	ui.spinner.show()

	if( response.success ){
		location.href='/account'
	}else{
		hal( 'error', response.msg, 1000 * 10 )
		ui.spinner.hide()
	}

}




register_submit.addEventListener('click', function(e){
	register().catch( err => { console.log('flag', 'error register: ', err ) } )
})

register_form.addEventListener('keyup', function(e){
	if( e.keyCode == 13 ){
		register().catch( err => { console.log('register err: ', err  ) } ) 
	}
})


login_submit.addEventListener('click', function(e){
	login().catch( err => { console.log( 'login err: ', err  ) } ) 
})

login_form.addEventListener('keyup', function(e){
	if( e.keyCode == 13 ){
		login().catch( err => { console.log( 'login err: ', err  ) } ) 
	}
})
		


forgot.addEventListener('click', e => {
	e.preventDefault()
	const modal = new Modal({
		type: 'forgot-pass',
	})
	const form = lib.b('form')
	const input = lib.b('input', false, 'input')
	input.type = 'email'
	input.placeholder = 'email to reset: '
	const submit = lib.b('input')
	submit.type = 'submit'
	submit.value = 'send'
	submit.style['width'] = 'auto'
	submit.classList.add('button')

	form.appendChild( input )
	form.appendChild( submit )
	modal.content.appendChild( form )

	document.body.appendChild( modal.ele )

	form.addEventListener('submit', e => {
		e.preventDefault()
		fetch_wrap('/send_confirm', 'post', {
			email: input.value.trim(),
			reset: true,
		})
		.then( res => {
			if( res.success ){
				// hal('success', 'success', 4000 )
				window.location.assign('/await_confirm' )
			}else{
				hal('error', res.msg || 'failed to send', 5000 )
				console.log( res )
			}
		})
		.catch( err => {
			hal('error', err.msg || 'failed to send', 5000 )
			console.log( err )
		})
	})
})	


select_login.addEventListener('click', e => {
	register_form.classList.remove('selected')
	select_register.classList.remove('active')
	login_form.classList.add('selected')
	select_login.classList.add('active')
})

select_register.addEventListener('click', e => {
	register_form.classList.add('selected')
	select_register.classList.add('active')
	login_form.classList.remove('selected')
	select_login.classList.remove('active')
})





// --- --- --- --- 
// emu auth
// --- --- --- --- 

const build_login = ( type, data ) => {
	const wrap = lib.b('div', false, 'login-wrapper')
	wrap.innerText = `${ type }: ${ data[ type ]?.email }`
	wrap.addEventListener('click', () => {
		login( data[ type ].email, data[ type ].pw )
	})
	return wrap
}
const emu_creds = localStorage.getItem('aip-creds')
if( emu_creds ){
	try{
		const parsed = JSON.parse( emu_creds )
		const emu_logins = lib.b('div', 'emu-logins')
		for( const type in parsed ){
			const login = build_login( type, parsed )
			emu_logins.append( login )
		}
		document.body.append( emu_logins )
	}catch( err ){
		console.error( err )
	}
}


// <div id='auth-nav'>
// 	<div class='auth-selector active' data-type='login'>
// 		login
// 	</div>
// 	<div class='auth-selector' data-type='register'>
// 		register
// 	</div>
// </div>



// github auth

// const github = document.querySelector('#github')
// github.addEventListener('click', e => {

// 	// blorb
// 	fetch_wrap('https://github.com/login/oauth/authorize', 'get')
// 	// fetch_wrap('/oauth/github', 'get')
// 	.then( res => {
// 		console.log( res )
// 	})
// 	.catch( err => {
// 		console.log( err )
// 	})
// })

// email auth:

