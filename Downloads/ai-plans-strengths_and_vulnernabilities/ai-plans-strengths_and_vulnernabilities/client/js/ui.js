import env from './env.js?v=146'
import hal from './hal.js?v=146'
import {
	click_parent,
	is_logged,
	make_debounce,
} from './lib.js?v=146'
import BROKER from './EventBroker.js?v=146'
import emu_auth from './emu_auth.js?v=146'




const links = document.getElementById('links')
const toggle = document.getElementById('mobile-toggle')
const toggles = document.querySelectorAll('.drop-toggle')
const search_bar = document.getElementById('search-bar')

let spinning = false



class Spinner{

	constructor( init ){
		init = init || {}
		this.ele = init.ele || document.createElement('div')
		this.ele.classList.add('spinner')
		this.img = init.img || document.createElement('img')
		this.img.src = this.img.src || init.src
		this.ele.appendChild( this.img )

		document.body.appendChild( this.ele )
	}

	show( ele ){
		if( ele ){
			ele.appendChild( this.ele )
			this.ele.style.position = 'absolute'
		}else{
			document.body.appendChild( this.ele )
			this.ele.style.position = 'fixed'
		}
		this.ele.style.display = 'flex'
		if( spinning ){
			clearTimeout(spinning)
			spinning = false
		}
		spinning = setTimeout(()=>{
			clearTimeout(spinning)
			spinning = false
		}, 10 * 1000)
	}
	hide(){
		this.ele.remove()
		// this.ele.style.display = 'none'
	}
}


const clickoff_menu = e => {
	if( e.target.nodeName === 'BODY' || 
		e.target.classList.contains('modal') ){

		BROKER.publish('UI_CLOSE', {
			e: e,
			is_click: true
		})
	}
}



const ui_close = event => {
	const { e, is_esc, is_click } = event

	// ( side menu )
	if( !links.classList.contains('hidden') ){
		console.log('return links')
		return links.classList.add('hidden')
	}

	if( is_esc || is_click ){
		const modal = document.querySelector('.modal')
		if( modal ){
			const close = modal.querySelector('.modal-close')
			if( close ){
				return close.click()
			}
		}
	}

}
// const make_debounce = ( fn, time, immediate, context_args ) => {
const debounced_close = make_debounce( ui_close, 200, true )



const update_search = function () {
	var search_bar = document.getElementById('search-bar')
	var query = search_bar.value.toLowerCase().split(' ')
	var plans = document.querySelectorAll('.post-wrap')
	plans.forEach(plan => {
		var title = plan.querySelector('.post-title')
		title = title === null ? '' : title.innerText.toLowerCase()
		var desc = plan.querySelector('.post-description')
		desc = desc === null ? '' : desc.innerText.toLowerCase()
		if (query.every(word => title.includes(word) || desc.includes(word))) {
			plan.style.display = ''
		} else {
			plan.style.display = 'none'
		}
	});
};






// -- binds

// required login buttons
const require_auth_buttons = []
setTimeout(() => {
	// 'submit a plan' buttons
	const creates = document.querySelectorAll('.menu-link a[href="/create"]') // theres 2
	for( const create of creates ){
		require_auth_buttons.push( create )
	}
	// now bind them all
	for( const ele of require_auth_buttons ){
		if( !is_logged ){
			ele.addEventListener('click', e => {
				e.preventDefault()
				return hal('error', 'must be logged in', 5000 )		
			})
		}
	}
}, 100 )


// init spinner
const spinner = new Spinner({
	src: '/resource/media/spinner.gif'
})
if( env.EXPOSE ) window.spinner = spinner

// menu toggle
toggle.addEventListener('click', () => {
	links.classList.toggle('hidden')
})

// menu click-closes
document.body.addEventListener('click', clickoff_menu )

// esc button closes
document.body.addEventListener('keyup', e => {
	if( e.keyCode === 27 ){
		BROKER.publish('UI_CLOSE', {
			e: e,
			is_esc: true,
		})
	}
})

// all toggles
for( const toggle of toggles ){
	toggle.addEventListener('click', () => {
		for( const t of toggles ){
			if( t == toggle ) continue
			t.parentElement.classList.remove('dropped')
		}
		toggle.parentElement.classList.toggle('dropped')
	})
}

// update search results
if (search_bar !== null)
	search_bar.addEventListener('input', update_search)


// -- subscribers

BROKER.subscribe('UI_CLOSE', debounced_close )


export default {
	spinner,
}



// Function to toggle the visibility of the abstract
const toggleAbstract = (abstractId, buttonId) => {
    const abstractElement = document.getElementById(abstractId);
    const buttonElement = document.getElementById(buttonId);

    if (abstractElement.style.display === 'none') {
        abstractElement.style.display = 'block';
        buttonElement.innerHTML = 'Click to Hide Abstract';
    } else {
        abstractElement.style.display = 'none';
        buttonElement.innerHTML = 'Click to Show Abstract';
    }
};

// Event delegation to handle abstract toggling
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('show-abstract')) {
            const abstractId = event.target.getAttribute('data-abstract-id');
            const buttonId = event.target.id;
            toggleAbstract(abstractId, buttonId);
        }
    });
});