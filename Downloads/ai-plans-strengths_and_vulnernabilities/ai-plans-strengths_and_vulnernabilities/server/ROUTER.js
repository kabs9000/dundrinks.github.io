const log = require('./log.js')
const env = require('./.env.js')
const lib = require('./lib.js')
const User = require('./persistent/User.js')
const auth = require('./auth.js')
const BROKER = require('./BROKER.js')










function heartbeat(){
	// DO NOT convert to arrow function or else your sockets will silently dis-connect ( no "this" )
	this.isAlive = Date.now()
	// log('flag', 'heartbeat')
}












const bind_user = async( socket ) => { // , CHAT

	// handle sessions without http requests
	if( !socket?.request?.session?.USER ){
		await bind_purgatory( socket )
	}

	let packet, USER

	USER = socket?.request?.session?.USER

	// log('flag', 'BIND: proceeding')

	socket.request.session.USER = USER = new User( USER )

	socket.on('pong', heartbeat )

	socket.isAlive = true

	if( !USER._ws_location || USER._ws_location?.match(/board/) ){
		// ( no ws_loc == extension users )

		socket.on('message',  ( data ) => {

			try{ 

				packet = lib.sanitize_packet( JSON.parse( data ) )

				// USER = socket.request.session.USER

				// packet logger:
				// if( packet.type !== 'ping' ){
				// 	log('flag', 'packet log:', packet )
				// }

				switch( packet.type ){

					case 'ping':
						socket.send( JSON.stringify({ type: 'pong' }))
						break;

					case 'ping_board':
						BROKER.publish('BOARDS_PING', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'ping_user':
						BROKER.publish('USER_PING', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'save':
						BROKER.publish('BOARD_SAVE', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'add_board':
						BROKER.publish('BOARD_ADD', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'ping_options':
						BROKER.publish('BOARDS_PONG_OPTIONS', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'board_set_option':
						BROKER.publish('BOARD_SET_OPTION', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'touch':
						BROKER.publish('BOARD_TOUCH', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'join_board':
						BROKER.publish('BOARD_JOIN', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'create_anchor':
						BROKER.publish('BOARD_ANCHOR', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'ping_anchor':
						BROKER.publish('BOARDS_PING_ANCHOR', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'EXT_init_boards':
						BROKER.publish('BOARDS_INIT_BOARDS', {
							socket: socket,
						})
						break;

					case 'save_index':
						BROKER.publish('BOARDS_SAVE_INDEX', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'remove_board':
						BROKER.publish('BOARD_REMOVE', {
							socket: socket,
							packet: packet,
						})
						break;

					// case 'chat':
					// 	CHAT.handle_chat( socket, packet, USER )
					// 	break;

					// case 'delete_chat':
					// 	CHAT.delete_chat( socket, packet, USER )
					// 	break

					// case 'dm':
					// 	CHAT.handle_dm( socket, packet, USER )
					// 	break;

					default: 
						log('flag', 'unknown packet: ', packet )
						break;

				}

			}catch( err ){
				log('flag', err)
			}

		})


	}else if( USER._ws_location?.match(/rebot/)){

		socket.on('message',  ( data ) => {

			try{ 

				packet = lib.sanitize_packet( JSON.parse( data ) )

				// USER = socket.request.session.USER

				// packet logger:
				// if( packet.type !== 'ping' ){
				// 	log('flag', 'packet log:', packet )
				// }

				switch( packet.type ){

					case 'ping':
						socket.send( JSON.stringify({ type: 'pong' }))
						break;

					case 'send_chat':
						// blorb
						BROKER.publish('REBOT_CHAT', {
							socket: socket,
							packet: packet,
						})
						break;

					case 'ping_users':
						BROKER.publish('REBOT_PONG_USERS', {
							socket: socket,
							packet: packet,
						})
						break;

					default: 
						log('flag', 'unknown packet: ', packet )
						break;

				}

			}catch( err ){
				log('flag', 'rebot ws err', err )
			}
		})

	}else{ // user ws loc does not match...

		const loc = ( USER._ws_location || '(none)' )

		// log('flag', '???', USER._ws_location?.match(/board/) )

		return lib.return_fail_socket( socket, 'invalid ws url', 10 * 1000, 'invalid ws url: ' + loc )

	} // user location

	socket.on('close', e => {
		log('wss', 'socket close: native ws event:', Object.keys( e ) )
		BROKER.publish('SOCKET_DISCONNECT', {
			socket: socket,
		})
	})

	return {
		success: true,
	}

}













const pending_logins = {}
const PENDING_CAP = 30
const clear_pending = ( id, caller ) => {
	if( caller !== 'magic-key') log('flag', 'clear pending must be called from within original promise or else it will never resolve')
	clearInterval( pending_logins[ id ].interval )
	delete pending_logins[ id ]
}


const bind_purgatory = async( socket ) => {
	/*
		clients without http requests associated will land here
		such as the browser extension
		the browser extension gets a code during handshake to clear this step
	*/

	const session_id = socket?.request?.sessionID
	if( !session_id ) throw new Error('no session id found')

	// reject and clear
	if( pending_logins[ session_id ] ){ 
		const msg = 'socket attempted too many logins'
		lib.return_fail_socket( socket, msg, 30 * 1000, msg)
		socket.terminate()
		throw new Error('user already has pending login')
	}

	// log('flag', 'binding pending: ', Object.keys( pending_logins ) )

	socket.send( JSON.stringify({ type: 'EXT_request_login' }))

	const cookie = socket.request?.session?.cookie

	socket.on('message', data => {

		if( !pending_logins[ session_id ] ) return // process is done; using main router now

		try{

			const packet = JSON.parse( data )

			switch( packet.type ){

				case 'ping':
					socket.send( JSON.stringify({ type: 'pong' }))
					break;

				case 'EXT_pong':
					// log('flag', 'handling login request', packet )
					if( !packet.email && !packet.password ){
						return lib.return_fail_socket( socket, 'config file is missing valid email and password', 10 * 1000, 'invalid no-request attempted; missing config')
					}

					const spoof_request = {
						session: socket.request.session,
						// session: {
						// 	cookie: cookie,
						// },
						is_spoof: true,
						body: {
							email: packet.email,
							password: packet.password,
						}
					}

					socket.request = spoof_request

					auth.login_user( spoof_request )
					.then( res => {

						// if( res?.password ) res.password = '(redacted)'
						// log('flag', '--- socket login res ---- : ', res )

						if( res?.success ){
							pending_logins[ session_id ].authorized = true
							return
						}

						log('flag', 'socket login fail:', res )

						if( res?.msg?.match(/no users/) ){
							socket.send(JSON.stringify({
								type: 'hal',
								msg_type: 'error',
								msg: 'no users found; check config file email / password',
								time: 10 * 1000,
							}))
						}

						pending_logins[ session_id ].c = PENDING_CAP
						// pending_logins[ session_id ].msg = 'failed to login; check your credentials'

					})
					.catch( err => {
						log('flag', 'socket login err', err )
					})
					// bind user( socket ) // aha, we can do this async actually
					// user should get stringified and re-hydrated with new init
					break;

				case 'EXT_init':
					log('flag', 'deprecated: ext init', packet )

					break;

				default: 
					log('flag', 'unhandled purgatory packet', packet )
					break;
			}

		}catch( err ){
			log('flag', 'message err during unauthorized socket purgatory:', err )
		}

	})

	// now await the login attempt before returning and allowing main router to continue binding
	const wait = await new Promise(( resolve, reject ) => {

		pending_logins[ session_id ] = {
			c: 0,
			interval: setInterval(() => {
				// log('flag', 'PENDING LOOPS?', session_id )
				if( pending_logins[ session_id ].c > PENDING_CAP ){
					// log('flag', 'wtf ', pending_logins[ session_id ] )
					clear_pending( session_id, 'magic-key' )
					resolve('took too long')
				}else if( pending_logins[ session_id ].authorized ){
					clear_pending( session_id, 'magic-key' )
					resolve('authorized')
				}else{
					pending_logins[ session_id ].c++
				}
			}, 500 ),
			authorized: false,
		}

	})

	log('flag', 'wait message: ', wait )

}




module.exports = {
	bind_user,
}
