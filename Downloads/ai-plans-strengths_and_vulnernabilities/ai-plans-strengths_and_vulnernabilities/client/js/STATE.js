import env from './env.js?v=146'



const state_history = window.state_history = []

const state = {

	set: state => {
		if( state_history.includes( state ) ){
			state_history.splice( state_history.indexOf( state ), 1 )
		}
		state_history.push( state )
		// console.log('state.set: ', state_history )
	},

	get: () => {
		return state_history[ state_history.length - 1 ]
	},

	pop: () => {
		state_history.pop()
		// console.log('state.pop: ', state_history )
	},

	splice: state => {
		if( !state_history.includes( state ) ) return false
		state_history.splice( state_history.indexOf( state ), 1 )
		// console.log('state.splice: ', state_history )
	},

	trade: false,

}

state.getTarget = () => {

	if( state.target_uuid && ENTROPICS[ state.target_uuid ] ){
		return ENTROPICS[ state.target_uuid ]
	}

	return false

}



if( env.EXPOSE ) window.STATE = state

export default state
