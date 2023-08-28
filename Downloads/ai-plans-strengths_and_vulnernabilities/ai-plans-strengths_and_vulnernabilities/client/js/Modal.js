import env from './env.js?v=146'


class Modal {

	constructor( init ){
		// init.id
		init = init || {}
		if( !init.type ) debugger

		const ele = this.ele = document.createElement('div')
		this.ele.classList.add('modal')
		if( init.id ) this.ele.id = init.id

		const type = this.type = init.type
		this.ele.classList.add( type )
		this.ele.setAttribute('data-type', type )

		this.content = document.createElement('div')
		this.content.classList.add('modal-content')

		if( init.header ){
			this.header = document.createElement('div')
			this.header.classList.add('modal-header')
			this.header.innerText = init.header
			this.content.append( this.header )
		}

		this.close = document.createElement('div')
		this.close.classList.add('modal-close', 'flex-wrapper')
		this.close.innerHTML = '&times;'
		this.close.addEventListener('click', () => {
			this.ele.remove()
			// BROKER.publish('MODAL_CLOSE', { type: init.type })
		})
		this.ele.appendChild( this.content )
		this.ele.appendChild( this.close )

	}



	make_columns(){

		this.left_panel = document.createElement('div')
		this.left_panel.classList.add('column', 'column-2', 'left-panel')

		this.right_panel = document.createElement('div')
		this.right_panel.classList.add('column', 'column-2', 'right-panel')

		this.content.appendChild( this.left_panel )
		this.content.appendChild( this.right_panel )

		this.ele.classList.add('has-columns')
		
	}


}




class LightBox extends Modal {
	constructor( init ){
		init = init || {}
		super( init )
		this.src = init.src
		this.ele.classList.add('lightbox')
		if( this.src ){
			this.content.style.background = 'url(' + this.src + ')'
			// if( init.constrain ){
			// 	this.content.style['background-size'] = init.constrain.width + ' ' + init.constrain.height
			// }
			// this.box_main = document.createElement('div')
			// this.box_main.classList.add('lightbox-main')
			// this.main_img = document.createElement('img')
			// this.main_img.src = this.src
			// this.box_main.append( this.main_img )
			// this.content.append( this.box_main )
		}
	}
}





if( env.EXPOSE ) window.Modal = Modal


export {
	Modal,
	LightBox,
}

