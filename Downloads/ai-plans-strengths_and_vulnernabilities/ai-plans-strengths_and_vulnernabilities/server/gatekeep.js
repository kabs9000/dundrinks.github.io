const auth = require('./auth.js')
const User = require('./persistent/User.js')

const log = require('./log.js')
const lib = require('./lib.js')

const render = require('../client/ai_html.js')

const color = require('./color.js')

const routes = {

	GET: {
		logged: [
			'contacts',
			'account', 
			'send_confirm',
		],
	}, 	
	POST: {
		logged: [
			// 'account_action',
			// 'action',
			'admin',
		],
	}

}



const skiplog_routes = ['/meshes']

let bare_path, ip

module.exports = function(req, res, next) {

	if( req.path.match(/\/resource/) || req.path.match(/\/client/) ){

		next()

	}else{
		
		req.session.USER = new User( req.session.USER )

		ip = ( req.headers['x-forwarded-for'] || req.connection.remoteAddress || '' ).split(',')[0].trim()

		bare_path = req.path.replace(/\//g, '')

		log('gatekeep', format({
			ip: ip,
			method: req.method,
			path: req.path,
			email: req.session.USER ? req.session.USER._email : '',
		}))

		if( routes[ req.method ] ){
						// log('flag', 'whats up : ', req.path )

			if( routes[ req.method ].logged.includes( bare_path ) ){ // required logged in routes 

				if( !lib.is_logged( req ) ){ // not logged

					// log('flag', 'un logged path' )

					if( req.method === 'GET' ){
						return res.send( render('redirect', req, '' ))
					}else{
						return res.json({
							success: false,
							msg: 'must be logged in',
						})
					}

				}else{ // logged in 

					// log('flag', 'logged path' )

					// req.session.USER = new User( req.session.USER )

					if( !req.session.USER._confirmed ){
					// log('flag', 'uncofirmed path' )
						if( !req.session.USER._reset_time || Date.now() - new Date( req.session.USER._reset_time ).getTime() > 1000 * 60 * 60 * 24 ){
							req.session.USER._confirm_code = lib.random_hex( 6 )
							req.session.USER.save()
							.then( res => {
								auth.send_confirm( req )
								.catch( err => {
									log('flag', 'err sending reset gatekeep ', err )
								})
							})
							.catch( err => log('flag', 'err setting confirm : ', err ))
						}
						req.session.destroy()
						return res.send( render('redirect', req, 'await_confirm' ) )
					}

					next()

				}

			}else if( req.path.match(/admin/i) && !lib.is_admin( req ) ){

				// log('flag', 'admin path' )

				return res.send( render('redirect', req, '' ) )

			}else {

				// log('flag', 'normal path' )

				req.session.USER = new User( req.session.USER )
				next()

			}

		}else{

			next()

		}

	}


}


function format( data ){
	if( data.path && skiplog_routes.includes( data.path ) ) return 'SKIPLOG'
	return ` ${ color('orange', data.ip ) } ${ color_method( data.method, data.path ) } ${ data._email ? color('magenta', data._email ) : 'none' }`

}


function color_method( method, data ){
	return color( ( method === 'POST' ? 'lblue' : 'blue' ), data )
}

