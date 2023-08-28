const log = require('./log.js')

class MessageBroker {
// module.exports = class MessageBroker {

	constructor(){

		this.subscribers = {}

	}

	publish( event, data ){

		if( !this.subscribers[ event ] ){
			log('flag','event missing subscriber', event )
			return
		}

	    this.subscribers[ event ].forEach( subscriberCallback => {
	    	log('broker', 'listener callback: ', event )
	    	subscriberCallback( data ) 
	    })


	}

	subscribe( event, callback ){

		if( !this.subscribers[event] )  this.subscribers[event] = []
	    
	    this.subscribers[event].push( callback )

	}

	unsubscribe( event, index ){
		this.subscribers.splice( index, 1 )
	}

}


let broker = false
module.exports = (() => {
	if( broker ) return broker
	broker = new MessageBroker()
	return broker
})()