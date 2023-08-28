import ui from './ui.js?v=146'
import env from './env.js?v=146'
import hal from './hal.js?v=146'
import BROKER from './EventBroker.js?v=146'
import USER from './USER.js?v=146'



let bound = 0
let packet, SOCKET 


const init = ( ws_url ) => {

	if( !ws_url ) return hal('error', 'invalid ws url', 5000 )

	ui.spinner.show()

	SOCKET = new WebSocket( ws_url )

	SOCKET.onopen = function( event ){

		ui.spinner.hide()

		console.log('connected ws' )

	}


	SOCKET.onmessage = function( msg ){

		packet = false

		try{

			packet = JSON.parse( msg.data )

		}catch( e ){

			SOCKET.bad_messages++
			if( SOCKET.bad_messages > 100 ) {
				console.log('100+ faulty socket messages', msg )
				SOCKET.bad_messages = 0
			}
			console.log('failed to parse server msg: ', msg )
			return false	

		}

		if( 0 && env.LOCAL && !env.LOG_WS_RECEIVE_EXCLUDES.includes( packet.type ) ){
			console.log( packet )
		}

		switch( packet.type ){

			case 'init_user':
				BROKER.publish('INIT_USER', packet )
				break;

			case 'init_boards_complete':
				BROKER.publish('BOARDS_INIT_COMPLETE', packet )
				break;

			case 'pong':
				BROKER.publish('PONG')
				break;
			
			case 'board_users':
				BROKER.publish('BOARD_USERS', packet )
				break;

			case 'pong_user':
				BROKER.publish('BOARD_PONG_USER', packet )
				break;

			case 'pong_board':
				BROKER.publish('BOARD_PONG_BOARD', packet )
				break;

			case 'pong_options':
				BROKER.publish('BOARD_OPTIONS', packet )
				break;

			// case 'reflect_options':
			// 	console.log('deprecated', packet )
			// 	// BROKER.publish('BOARD_REFLECT', packet )
			// 	break;

			case 'board_touch':
				BROKER.publish('BOARD_TOUCH', packet )
				break;

			case 'pong_anchor':
				BROKER.publish('BOARD_PONG_ANCHOR', packet )
				break;

			case 'remove_user':
				BROKER.publish('BOARD_REMOVE_USER', packet )
				break;

			case 'removed_board':
				BROKER.publish('BOARD_REMOVED', packet )
				break;

			case 'user_propagate':
				BROKER.publish('USER_PROPAGATE', packet )
				break;

			// case 'chat':
			// 	BROKER.publish('ROOM_HANDLE_CHAT', packet )
			// 	break;

			// case 'dm':
			// 	BROKER.publish('ROOM_HANDLE_DM', packet )
			// 	break;

			// case 'inc_chats':
			// 	console.log('deprecated inc_chats', packet )
			// 	// BROKER.publish('ROOM_INC_CHATS', packet )
			// 	break;

			case 'rebot_chat':
				BROKER.publish('REBOT_CHAT', packet )
				break;

			case 'rebot_disconnect':
				BROKER.publish('REBOT_DISCONNECT', packet )
				break;

			case 'rebot_pong_users':
				BROKER.publish('REBOT_PONG_USERS', packet )
				break;
				
			case 'hal':
				hal( packet.msg_type, packet.msg, packet.time || 10 * 1000 )
				// console.log( packet )
				break;

			// case 'clear_chats':
			// 	BROKER.publish('CLEAR_CATEGORY', packet )
			// 	break;

			// case 'delete_chat':
			// 	BROKER.publish('DELETE_CHAT', packet )
			// 	break;

			// case 'update_user':
			// 	BROKER.publish('UPDATE_USER', packet )
			// 	break;

			// case 'disconnect_user':
			// 	BROKER.publish('DISCONNECT_USER', packet )
			// 	break;

			// case 'reply_notice':
			// 	BROKER.publish('CHAT_REPLY_NOTICE', packet )
			// 	break;

			default: 
				console.log('unknown packet: ', packet )
				break
		}

	}

	SOCKET.onerror = function( data ){
		console.log('ERROR', data)
		hal('error', 'server error')
	}

	SOCKET.onclose = function( event ){
		if( !env.PRODUCTION ) console.log( 'CLOSE', event )
		hal('error', 'connection closed by server')
	}

	return SOCKET

}


let send_packet

const send = event => {

	send_packet = event 

	if( SOCKET.readyState === 1 ) SOCKET.send( JSON.stringify( send_packet ))

}


BROKER.subscribe('SOCKET_SEND', send )

export default {
	init: init,
}

