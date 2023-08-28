
// native
const host = require('os').hostname()
const fs = require('fs')
const os = require('os')
const express = require('express')
const http = require('http')
const session = require('express-session')
const FormData = require('express-form-data')
const cors = require('cors')

const redis = require('redis')
const redisClient = redis.createClient({ legacyMode: true })
const redisStore = require('connect-redis')(session)

// env
const env = require('./server/.env.js')
const log = require('./server/log.js')
const lib = require('./server/lib.js')
const DB = require('./server/db.js')
const mail = require('./server/mail.js')

// NPM
// const bodyParser = require('body-parser')

// app layer
const initCron = require('./server/initCron.js')
// const {
// 	identify,
// } = require('./server/lib.js')
const gatekeep = require('./server/gatekeep.js')
const throttle = require('./server/throttle.js')
const render = require('./client/ai_html.js')
const auth = require('./server/auth.js')

const MAIN = require('./server/OPS_main.js')
const ADMIN = require('./server/OPS_admin.js')
const ACCOUNT = require('./server/OPS_account.js')
// const REBOT = require('./server/OPS_rebot.js')

// const WSS = require('./server/WSS.js')();
// const PUBLIC = require('./server/data/PUBLIC.js')
// const BROKER = require('./server/BROKER.js')
const User = require('./server/persistent/User.js')
const STORE_HANDLER= require('./server/STORE_HANDLER.js')
// const SOCKETS = require('./server/SOCKETS.js')
const SETTINGS = require('./server/SETTINGS.js')
const CACHE = require('./server/CACHE.js') // subs
const Post = require('./server/persistent/Post.js')
const BROKER = require('./server/BROKER.js')
const aip_handler = require('./server/file_handler.js')
const get_arxiv_data = require('./server/get_arxiv_data.js')

// const { spawn, spawnSync } = require('child_process')





let server



// init

;(async() => {


// get redis db key
let rmap
try{
	rmap = JSON.parse( await fs.readFileSync( env.REDIS.MAP_URI ) )
}catch( err ){
	log('flag', err )	
	return
}



const exp = new express()

server = http.createServer( exp )

const res = await redisClient.connect()

// connect to correct redis db key
await new Promise(( resolve, reject ) => {
	log('boot', 'REDIS_MAP: ', rmap.aip )
	redisClient.select( rmap.aip, ( err, res ) => {
		if( err ){
			reject( err )
			return
		}
		resolve()
	})
})

log('boot', 'redis connected (' + env.REDIS.NAME + ')' )

const STORE = new redisStore({ 
	host: env.REDIS.HOST, 
	port: env.REDIS.PORT, //env.PORT, 
	client: redisClient, 
	ttl: env.REDIS.TTL,
})

STORE_HANDLER.init( STORE )

/*
	session lifetime = Math.min( session store TTL , express cookie maxAge )
*/

const redis_session = session({
	secret: env.REDIS.SECRET,
	name: env.REDIS.NAME,
	resave: false,
	saveUninitialized: true,
	cookie: { 
		secure: false,
		maxAge: 1000 * 60 * 60 * 24 * 31,
	}, // Note that the cookie-parser module is no longer needed
	store: STORE
})



exp.use( redis_session )


if( env.LOCAL ){
	exp.use('/css', express.static( './client/css' )) // __dirname + 
	exp.use('/js', express.static( './client/js' )) // __dirname + 
	exp.use('/fs', express.static( './fs' ))
	exp.use('/inc', express.static( './inc' )) // __dirname + 
	exp.use('/resource', express.static( './resource' )) // __dirname + 
	// exp.use('/node_modules/three', express.static( './node_modules/three' )) // __dirname + 
	exp.use('/geometries', express.static( './geometries' )) // __dirname + 
}


exp.use( (req, res, next) => {
	if (req.originalUrl.startsWith('/stripe_webhook')) {
		next()
	} else {
		express.json()(req, res, next)
		// exp.use( bodyParser.json() )
	}
})

// const bodyParser = require('body-parser');

exp.use( throttle )
exp.use( gatekeep )

const FormData_options = {
	uploadDir: os.tmpdir(),
	autoClean: true
}
exp.use( FormData.parse( FormData_options ) )
exp.use( FormData.format() )








// routing
exp.get('/', async(request, response)  => {
	const text = SETTINGS.get('splash_banner')
	response.send( render( 'index', request, text ) )
})

exp.get('/post/:post', async( request, response) => {
	const uuid = request.params.post
	try{
		const post = await CACHE.get_post( false, uuid, true )
		if( !post ){
			return response.send( render('error', request, 'unable to load post'))
		}

		const full_text = await post.output_full( request )

		return response.send( render( 'post', request, {
			post: post,
			full_text: full_text,
		}))
	}catch( err ){
		log('flag', 'err retrieve post: ', err )
		return response.send( render('error', request, 'unable to load post'))
	}
})

exp.get('/user/:user', async( request, response) => {
	try{
		const slug = request.params.user
		const user = await get_user( slug )
		if( user ){
			response.send( render('user', request, {
				user: user,
			}))
		}else{
			log('flag', 'no user found: ', slug )
			response.send( render('error', request, 'error rendering user page' ) )
		}
	}catch( err ){
		log('flag', 'user err', errr )
		response.send( render('error', request, 'error rendering user page' ) )
	}
})

const pages = [
	'login',
	'register',
	'admin',
	'account',
	'create',
	'contact',
]

for( const page of pages ){
	exp.get( [ '/' + page ], (request, response) => {
		response.send( render( page, request ) )
	})
}

exp.get('/zohoverify/verifyforzoho.html', (request, response) => {
	response.sendFile( __dirname + '/client/zohoverify/verifyforzoho.html')
})


// // ------------------------------------
// // stripe stuff
// // ------------------------------------
// exp.get('/stripe', (request, response) => {
// 	if( env.PRODUCTION && !lib.is_admin( request ) ) return response.send( render('error', request, 'forbidden'))
// 	response.send( render( 'stripe', request ))
// })
// exp.get('/stripe_received*', (request, response) => {
// 	if( env.PRODUCTION && !lib.is_admin( request ) ) return response.send( render('error', request, 'forbidden'))
// 	STRIPE.handle_return( request, response )
// })
// exp.get('/portal*', (request, response) => {
// 	// if( env.PRODUCTION && !lib.is_admin( request ) ) return response.send( render('error', request, 'forbidden'))
// 	// STRIPE.handle_portal( request, response )
// 	const query = request.query
// 	log('flag', 'portal query: ', query )
// 	response.send( render('portal', request, {
// 		session_id: query.session_id
// 	}))
// })

// exp.post('/create-portal-session', bodyParser.urlencoded({ extended: true }), ( request, response ) => {
// 	STRIPE.create_portal( request, response )
// 	.catch( err => {
// 		log('flag', 'err stripe: ', err )
// 		response.send( render('error', request, 'error creating customer portal') )
// 	})
// })
// exp.post('/create-checkout-session', bodyParser.urlencoded({ extended: true }), ( request, response ) => {
// 	STRIPE.handle_checkout( request, response )
// 	.catch( err => {
// 		log('flag', 'err stripe: ', err )
// 		response.send( render('error', request, 'error attempting stripe checkout') )
// 	})
// })
// exp.post('/stripe_webhook', express.raw({ type: 'application/json' }), ( request, response ) => { 
// 	STRIPE.handle_webhook( request, response )  // , STORE
// })
// // ------------------------------------
// // end stripe stuff
// // ------------------------------------


exp.get('/await_confirm', ( request, response ) => {
	if( lib.is_logged( request )){
		response.send( render('redirect', request, 'account' ))
	}else{
		response.send( render('await_confirm', request ))
	}
})

exp.get('/confirm_code*', function( request, response ){
	auth.confirm_code( request )
		.then( res => {
			if( res.success ){
				response.send( render('redirect', request, 'account'))
			}else{
				response.send( render('error', request, 'there was an error confirming - you can try <a href="/await_confirm?new=false">sending a new code</a>'))
			}
		})
		.catch( err => {
			log('flag', 'error confirm_account: ', err )
			response.send( render('error', request, 'error confirming account'))
		})
})


exp.get('/logout', ( request, response ) => {
	request.session.destroy()
	response.send( render('redirect', request, '' ))
})

// exp.get('/robots.txt', (request, response) => {
// 	response.sendFile('/robots.txt', {root: './'}); log('routing', 'bot')
// })

exp.get('/_storage/mysqldumps/*', (request, response) => {
	// 
	if( !lib.is_admin( request )){
		return response.send( render('redirect', request, ''))
	}

	return response.send(404)// render('redirect', request, '404') )

	// try{
	// 	if( fs.existsSync( env.ROOT + request.path ) ){
	// 		response.sendFile( request.path, { root: __dirname } )
	// 	}else{
	// 		log('flag', 'failed to find: ', env.ROOT + request.path )
	// 		return response.send( render('redirect', request, '404') )
	// 	}
	// }catch( e ){
	// 	log('flag', e )
	// 	return response.send( render('redirect', request, '404'))
	// }
})

// Define a route to handle the fetch_paper_details request
exp.get('/fetch_paper_details', (req, res) => {

	const arxiv_url = req.query.url;
	const python_args = [arxiv_url];
	// const python_script = './server/py/get_arxiv_data.py';

	get_arxiv_data( arxiv_url, python_args )
	.then( r => {
		// log('flag', r )
		if( r.success ){
			res.json( r )
		}else{
			res.json({
				success: false,
				msg: r?.msg || 'in dev'
			})			
		}

	})
	.catch( err => {
		if( err.message ){
			log('flag', 'arxiv err', err.code, err.message )
		}else{
			log('flag', 'arxiv err', err )
		}
		res.json({
			success: false,
			msg: 'server error'
		})
	})

});

// ^^ GET
// -------
// vv POST




exp.post('/login', (request, response) => {
	auth.login_user(request)
		.then(function(res){
			response.json(res)
		})
		.catch(function(err){
			log('flag', 'error logging in: ', err )
			response.json({
				success: false,
				msg: 'error logging in'
			})
		})
})

exp.post('/register', function( request, response ){
	auth.register_user( request )
		.then( function( res ){
			response.json( res )
		})
		.catch(function(err){
			log('flag', 'error registering', err )
			response.json({
				success: false,
				msg: 'error registering'
			})
		})
})

exp.post('/send_confirm', function( request, response ){
	auth.send_confirm( request )
		.then(function( res ){
			response.json( res )
		})
		.catch(function( err ){
			log('flag', 'error send_confirm: ', err )
			response.json({
				success: false,
				msg: err.msg || 'error sending confirm',
			})
		})
})

exp.post('/action_account', ( request, response ) => {
	ACCOUNT.action( request )	
	.then( res => {
		response.json( res )
	})
	.catch( err => {
		log('flag', 'account err', err )
		response.json({
			success: false,
			msg: err.msg || 'error attempting action',
		})
	})
})

exp.post('/action_main', ( request, response ) => {
	MAIN.action( request )
	.then( res => {
		response.json( res )
	})
	.catch( err => {
		log('flag', 'action err', err )
		response.json({
			success: false,
			msg: err.msg || 'request error'
		})
	})
})

exp.post('/action_admin', function( request, response ){
	ADMIN.action( request )
	.then(function( res ){
		response.json( res )
	})
	.catch(function( err ){
		log('flag', 'error admin action: ', err )
		response.json({
			success: false,
			msg: 'error admin action',
		})
	})
})

exp.post('/file_handler', (request, response) => {

	aip_handler( request )
	.then( res => {

		if( !res?.success ) return response.json( res )

		ACCOUNT.action({
			session: {
				USER: request.session.USER,
			},
			body: {
				action: 'handle_upload',
				slug: res.slug,
				title: request.body.title,
			}
		})
		.then( res => {
			response.send( res )
		})
		.catch( err => {
			log('flag', 'upload err : ', err )
			response.send({
				success: false,
				msg: 'upload fail',
			})
		})

	})
	.catch( err => {
		log('flag', 'upload err : ', err )
		response.send({
			success: false,
			msg: 'upload fail',
		})
	})
})





exp.post('*', (request, response) => {
	log('flag', 'POST 404: ' + request.url)
	if(request.url.match(/\.html$/)){
		response.status(404).sendFile('/client/html/404.html', { root : '../' })    
	}else{
		response.end()
	}
})

exp.get('*', (request, response) => {
	response.status( 404 ).send( render('404', request) )
	// response.status(404).sendFile('/client/html/404.html', { root : '../'})    
})











function heartbeat(){
	// DO NOT convert to arrow function or else your sockets will silently disconnect ( no "this" )
	this.isAlive = Date.now()
	// log('flag', 'heartbeat')
}



DB.initPool(( err, pool ) => {

	if( err ) return console.error( 'no db: ', err )
	
	server.listen( env.PORT, function() {
		log( 'boot', `\x1b[33m
___________________________________________________
______________ ${ env.SITE_TITLE }
___________________________________________________
:: ${ host }
:: ${ env.PUBLIC_ROOT } :${ env.PORT }
:: ${ new Date().toString() }
\x1b[0m`)
	})

	BROKER.publish('CACHE_POSTS_UPDATE_SYNC')
	// , {
	// 	immediate: true,
	// })

	server.on('upgrade', function( request, socket, head ){

		log('flag', 'unhandled websocket req')

		// // log('flag', '****** UPGRADE ********')
		// redis_session( request, {}, () => {

		// 	// log('wss', 'redis session parsed')

		// 	WSS.handleUpgrade( request, socket, head, function( ws ) {
		// 		WSS.emit('connection', ws, request )
		// 	}, 'INDEX.JS ' + socket.id )
		// })
	})


	setTimeout(async() => {

		// if( env.LOCAL ) return lib.return_fail( 'env.LOCAL skipping cron', false )
		await SETTINGS.init()
		initCron()

	}, 1000 )

	// run_fills()
	// .catch( err => {
	// 	log('flag', err )
	// })

})










})(); // init






const get_user = async( slug ) => {
	const pool = DB.getPool()
	const sql = `SELECT * FROM users WHERE slug=? LIMIT 1`
	const res = await pool.queryPromise( sql, slug )
	if( res.error ) {
		log('flag', res.error, 'error querying user')
		return;
	}
	if( !res.results?.length ){
		log('flag', res.error, 'error querying user')
		return;
	}
	return new User( res.results[0] )
}








const run_fills = async() => {
	log('flag',`

------------------------------------
!!!! RUNNING FILLS !!!! 
------------------------------------

`)

	const pool = DB.getPool()
	let sql, res

	// ------------ 
	// back fill null user names
	// ------------

	sql = `SELECT * FROM users WHERE slug IS NULL`
	res = await pool.queryPromise( sql )

	let delay = 0
	for( const r of res.results || [] ){
		setTimeout(() => {
			const dummy_user = new User()
			dummy_user.gen_new_slug()
			.then( new_slug => {
				if( !new_slug ) throw new Error('no slug')
				// `pal_${ lib.random_hex(10)}`
				sql = `UPDATE users SET slug=? WHERE email=?`
				pool.queryPromise( sql, [ new_slug, r.email ])
				.then( res => {
					if( res.error ){
						log('flag', res.error )
					}else{
						log('flag', 'updated: ', r.email)
					}
				})
			})
			.catch( err => {
				log('flag','err', err )
			})
		}, 500 * delay )
		delay++
	}

}

