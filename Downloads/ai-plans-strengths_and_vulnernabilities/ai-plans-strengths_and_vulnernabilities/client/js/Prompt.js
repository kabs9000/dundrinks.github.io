import * as lib from './lib.js?v=146'
import { Modal } from './Modal.js?v=146'




/*
	const prompt = new Prompt({
		type: 'some-prompt',
		args: [a, b],
		callback: (a, b) => {
			console.log('ya', a, b)
		}
	})
*/




class Prompt extends Modal {

	constructor( init ){
		super( init )
		init = init || {}

		this.ele.classList.add('prompt')

		this.callback = init.callback
		this.args = init.args || []

		this.proceed = lib.b('div', false, 'button')
		this.proceed.innerText = 'ok'
		this.cancel = lib.b('div', false, 'button')
		this.cancel.innerText = 'cancel'
		
		this.buttons = lib.b('div', false, 'button-area')
		this.buttons.append( this.cancel )
		this.buttons.append( this.proceed )

		this.proceed.addEventListener('click', () => {
			this.close_prompt( true )
		})
		this.cancel.addEventListener('click', () => {
			this.close_prompt( false )
		})
		this.content.append( this.buttons )

		this.close.remove()

	}

	close_prompt( run, ...args ){
		args = args || []
		if( run && this.callback ){
			if( typeof this.callback?.then === 'function' ){
				this.callback( ...args )
				.then( success => {
					if( success ){
						this.ele.remove()
					}else{
						console.log('callback prevented popup removal', ...this.args )
					}
				})
			}else{
				this.callback( ...args )
				this.ele.remove()
			}

		}else{
			this.ele.remove()
		}
	}
}

export default Prompt