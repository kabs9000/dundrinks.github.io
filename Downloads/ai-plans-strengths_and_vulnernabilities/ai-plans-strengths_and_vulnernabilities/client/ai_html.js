
// const cache = '?v=146'
const log = require('../server/log.js')
const lib = require('../server/lib.js')
const env = require('../server/.env.js')
const CACHE = require('../server/CACHE.js')
const PUBLIC = require('../server/data/PUBLIC.js')




const build_meta = ( title, desc, url, meta_desc ) => {

	const fonts = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@100;300;500&display=swap" rel="stylesheet">`

	return `
	<title>${ title || env.SITE_TITLE }</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1">
	<meta name="Description" content=" ${ desc || env.SITE_DESC }">
	<meta property="og:url" content="${ url || env.SITE_URL }">
	<meta property="og:title" content="${ title || env.SITE_TITLE }">
	<meta property="og:description" content="${ meta_desc || env.SITE_META_DESC }"> 
	<meta property="og:image" content="${ env.SITE_IMAGE }"/>
	${ env.PRODUCTION ? fonts : '' }
	<link rel='icon' href='/resource/media/favicon.ico'/>`

}


const popups = `
<div id='dev'></div>
<div id='alert-contain'></div>`

const global_data = () => { return `<div id="global-data">${ JSON.stringify( PUBLIC ) }</div>` }

const scripts = {

	// auth
	index: `<script type='module' defer='defer' src='/js/auth/init_index.js?v=146'></script>`,
	auth: `<script type='module' defer='defer' src='/js/auth/init_auth.js?v=146'></script>`,
	account: `<script type='module' defer='defer' src='/js/auth/init_account.js?v=146'></script>`,
	admin: `<script type='module' defer='defer' src='/js/auth/init_admin.js?v=146'></script>`,
	create: `<script type='module' defer='defer' src='/js/auth/init_create.js?v=146'></script>`,
	post: `<script type='module' defer='defer' src='/js/auth/init_post.js?v=146'></script>`,
	contact: `<script type='module' defer='defer' src='/js/auth/init_contact.js?v=146'></script>`,
	user: `<script type='module' defer='defer' src='/js/auth/init_user.js?v=146'></script>`,
	await_confirm: `<script type='module' defer='defer' src='/js/auth/init_await-confirm.js?v=146'></script>`,
	send_confirm: `<script type='module' defer='defer' src='/js/auth/init_send-confirm.js?v=146'></script>`,
	redirect: `<script type='module' defer='defer' src='/js/auth/init_redirect.js?v=146'></script>`,
	error: `<script type='module' defer='defer' src='/js/auth/init_error.js?v=146'></script>`,
}


const styles = {

	// auth
	index: `<link rel='stylesheet' href='/css/splash.css?v=146'>`,
	base: `<link rel='stylesheet' href='/css/base.css?v=146'>`,
	auth: `<link rel='stylesheet' href='/css/auth.css?v=146'>`,
	account: `<link rel='stylesheet' href='/css/account.css?v=146'>`,
	user: `<link rel='stylesheet' href='/css/user.css?v=146'>`,
	create: `<link rel='stylesheet' href='/css/create.css?v=146'>`,
	post: `<link rel='stylesheet' href='/css/post.css?v=146'>`,
	contact: `<link rel='stylesheet' href='/css/contact.css?v=146'>`,
	admin: `<link rel='stylesheet' href='/css/admin.css?v=146'>`,
	modal: `<link rel='stylesheet' href='/css/modal.css?v=146'>`,

	// pages
	page: `<link rel='stylesheet' href='/css/page.css?v=146'>`,

}


const auth_links_side = request => {
	if( lib.is_logged( request ) ){
		return `
		<div class='auth-link menu-link'>
			<a href='/account'>account</a>
		</div>
		<div id='logout' class='auth-link menu-link'>
			<a href='/logout'>logout</a>
		</div>
		`
	}else{
		return `
		<div class='auth-link menu-link'>
			<a href='/login'>login</a>
		</div>`
	}
}

const auth_links_main = request => {
	if( lib.is_logged( request )){
		return `
	<div class='menu-link auth-link'>
		<a href='/account'>account</a>
	</div>
	<div class='menu-link auth-link'>
		<a href='/logout'>logout</a>
	</div>`
	}else{
		return `
		<div class='menu-link auth-link'>
			<a href='/login'>login</a>
		</div>`
	}
}

const admin_links = request => { 
	if( lib.is_admin( request ) ){
		return `
	<div id='admin-link' class='menu-link'>
		<a href='/admin'>admin</a>
	</div>`
	}
	return ''
}

// ${ logo }
let slug
const build_header = function( type, request, header ){

	slug = request.session?.USER?.slug

	return `
	<div id='header' data-auth='${ !!lib.is_logged( request ) }' data-admin='${ !!lib.is_admin( request ) }' ${ slug ? 'data-user="' + slug + '"': '' }'>
		<div id='mobile-toggle'>menu</div>
		<div id='links' class='hidden'>
			<div class='menu-link'>
				<a href='/'>home</a>
			</div>
			<div class='menu-link'>
				<a href='/contact'>contact</a>
			</div>
			<div class='menu-link mobile-only'>
				<a href='/create'>submit a plan</a>
			</div>
			${ auth_links_side( request ) }
			${ admin_links( request ) }
		</div>
		<div id='main-links'>
			<div class='menu-link'>
				<a href='/create'>submit a plan</a>
			</div>
			${ auth_links_main( request ) }
		</div>
	</div>`

}



const search_bar = function() {
	return `<input id='search-bar' type='text' placeholder='Search...'>`
}



const page_title = type => {
	return `<h3 class='page-title'>${ type }</h3>`
}



module.exports = function render( type, request, data ){

	try{
	
		let css_includes = styles.base
		let script_includes = ''

		switch( type ){

		case 'index':

			css_includes += styles.auth + styles.index + styles.modal
			script_includes += scripts.index 

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, env.SITE_TITLE ) }
					<div id='content'>
						<h3>Alignment Plans</h3>
						${ search_bar() }
						<div id='post-listing'>
							${ render_main( CACHE.cache.POSTS ) }
						</div>
					</div>
				</body>
			</html>`


		case 'login':
	   		// <input class='button' type="submit" value="Login" />

			css_includes += styles.auth + styles.modal
			script_includes += scripts.auth //+ scripts.howler

			return `
			<html>
				<head>
					${ build_meta()}
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, 'login' )}
					<div id='content'>

						<div id='auth-wrap'>

							<div id='auth-nav'>
								<div class='auth-selector active' data-type='login'>
									login
								</div>
								<div class='auth-selector' data-type='register'>
									register
								</div>
							</div>

							<div id='login-form' class='auth-form selected'> 
						        
							    <input class='input' id='email' type="text" placeholder="email"/>
						   		<input class='input' id='password' type="password" placeholder="password"/>
						   		<br>
						   		<div class='button'>Login</div>
						   		<br>
						   		<!-- 
						   		<div id='oauth-providers'>
							   		<div id='github' class='button'>
							   			github
							   		</div>
							   		<br>
							   		<div id='google' class='button'>
							   			google
							   		</div>
							   		<br>
							   	</div>
							   	-->
						   		<div id='forgot'>
						   			<a href='/send_confirm'>
						   				forgot password
						   			</a>
						   		</div>
						    </div>

	   						<div id='register-form' class='auth-form'>
								<input class='input' type='email' id='register-email' placeholder="email">
								<input class='input' type='password' id='register-password' placeholder="password">
								<input class='input' type='password' id='password2' placeholder="password again">
								<div class='button'>Register</div>
							</div>

						</div>

					</div>
				</body>
			</html>`



		case 'account':

			css_includes += styles.auth + styles.account + styles.modal
			script_includes += scripts.account // + scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'account' ) }
					${ popups }
					${ global_data() }
					<div id='content' class='pal-contain'>
						${ page_title( type ) }
						<div id='user-wrap' class='pal-constrain'>
							<!-- pal details here -->
						</div>
						<div id='user-actions' class='pal-constrain'>
							<!-- account actions-->
						</div>
						<h3>media</h3>
						<div id='media-library'>
							<div class='button'>
								view
							</div>
							<div class='content'>
							</div>
						</div>
					</div>

				</body>
			</html>`


		case 'contact':

			css_includes += styles.auth + styles.contact + styles.modal
			script_includes += scripts.contact 

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'contact' ) }
					${ popups }
					${ global_data() }
					<div id='content' class='pal-contain'>
						${ page_title( type ) }
						<p>
							To get in touch, contact:<br>
							${ env.CONTACT_EMAIL }
						</p>
					</div>

				</body>
			</html>`


		case 'user':

			css_includes += styles.auth + styles.user + styles.modal
			script_includes += scripts.user 

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'user' ) }
					${ popups }
					${ global_data() }
					<div id='content' class='pal-contain'>
						${ data.user.output_html( request ) }
					</div>

				</body>
			</html>`


		case 'await_confirm':

			css_includes += styles.auth 
			script_includes += scripts.await_confirm //+ scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'await confirm' )}
					${ popups }
					${ global_data() }
					<div id='content'>
					</div>
				</body>
			</html>
			`

		case 'create':

			css_includes += styles.auth + styles.create + styles.modal
			script_includes += scripts.create 

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, env.SITE_TITLE ) }
					<div id='content'>
						<div id='explain'>
							<p>
								Use this form to document your plan.<br>
								<div id='media-lib' class='button'>media library</div>
							</p>
						</div>
						
						<div id='create-form'>

						    <!-- Existing input fields for creating a plan -->
						    <input type='text' name='title' class='input' placeholder=' Alignment Plan Title'>
						    <textarea class='input' name='description' placeholder=' Summary / abstract'></textarea>
						    <input type='text' name='attribution' class='input' placeholder=' Plan attribution (if you are not the original author)'>
						    <textarea class='input' name='content' placeholder=' Full plan'></textarea>
						    <br>
						    <br>

						    <div class='button submit'>
							submit and post
						    </div>

						</div>

					    <div id='arxiv-wrapper'>
						    <!-- New input field for arXiv URL -->
						    <input type='text' id='arxiv-url' class='input' placeholder='Enter arXiv URL'>
						    <button id='fetch-paper-btn' class='button'>Fetch Paper Details</button>
						</div>

					</div>
					
				</body>
			</html>`


		case 'post':

			css_includes += styles.auth + styles.post + styles.modal
			script_includes += scripts.post

			return `
			<html>
				<head>
					${ build_meta( 
						data?.post?.title, 
						data?.post?.description, 
						( data?.post ? env.SITE_URL + '/post/' + data.post.uuid : '' ), 
						data?.post?.description ) 
					}
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, data.post.title ) }
					<div id='content'>
						${ data.full_text }
						<div id='comments'>
							<h3>Vulnerabilities</h3>
							<div id='add-wrapper'>
								<div id='add-comment' class='button'>add a vulnerability</div>
							</div>
							<div class='content'>
							</div>
						</div>
					</div>
				</body>
			</html>`



		case 'admin':

			css_includes += styles.auth + styles.admin + styles.modal
			script_includes += scripts.admin //  + scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, 'admin' )}
					${ popups }
					${ global_data() }
					<div id='content' class='pal-contain'>
						${ page_title( type )}
						<div id='admin-views'>
							<!-- all js in here -->
						</div>
						<div id='admin-content' class='pal-constrain'>
						</div>
					</div>
				</body>
			</html>
			`
		
		case 'confirm':

			css_includes += styles.auth
			script_includes += scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>

					${ popups }
					${ global_data() }
					${ build_header( type, request, 'confirm' )}

					<h4>email confirm</h4>

				</body>
			</html>`


		case 'redirect':

			script_includes += scripts.redirect

			return `
			<html>
				<head>
					${ script_includes }
				</head>
				<body class='${ type }'>
					<div id='redirect' data-redirect='${ data }'></div>
				</body>
			</html>`

		case 'error':

			script_includes += scripts.error
			css_includes += styles.page + styles.modal

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ build_header( type, request, {} )}
					${ popups }
					${ global_data() }
					<div id='content'>
						${ typeof data === 'string' ? data : 'There was an error fulfilling this request' }
					</div>
				</body>
			</html>
			`

		case '404':

			css_includes += styles.auth
			script_includes += scripts.error // need to include some script..

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, '404' )}
					<div id='content'>
						<div class='fourohfour'>
							nothing to see here - check your URL<br>
							<a href='/'>click here</a> to return to base
						</div>
					</div>
					</body>
					</html>
				`
		default:

			css_includes += styles.auth
			script_includes += scripts.error // need to include some script..

			// script_includes += scripts.howler

			return `
			<html>
				<head>
					${ build_meta() }
					${ css_includes }
					${ script_includes }
				</head>
				<body class='${ type }'>
					${ popups }
					${ global_data() }
					${ build_header( type, request, '404' ) }
					<div id='content'>
						<div class='fourohfour'>
							nothing to be found here - check your URL<br>
							<a href='/'>click here</a> to return to base
						</div>
					</div>
				</body>
			</html>`

		}

	}catch( err ){
		log('flag', 'render err: ', err )
		return '<div>error rendering page</div>'
	}

}







// This goes in your server-side code where render_main is defined

// How posts are rendered on the main page
const render_main = cache_posts => {
    let html = '';
    for( const post of cache_posts ){
        // Generate a unique ID for each abstract and button
        const abstractId = `abstract-${post.uuid}`;
        const buttonId = `button-${post.uuid}`;

        html += `
        <div class='post-wrap'>
            <h4 class='post-title post-summary-field'><a href='/post/${post.uuid}'>${post.title}</a></h4>
            <div class='post-attributions'>
                <div class='post-attr'>${post.attribution ? 'attributed to: ' + post.attribution : ''}</div>
                <div class='post-poster'>posted by: ${post.gen_user_link()}</div>
            </div>
            <!-- Initially hide the abstract -->
            <div id='${abstractId}' class='post-description post-summary-field' style='display: none;'>${post.description}</div>
            <!-- Add a Show/Hide Abstract text -->
            <div id='${buttonId}' class='show-abstract' data-abstract-id='${abstractId}'>Click Here to Show Abstract</div>
            ${post.comment_summary_roll}
        </div>`;
    }
    return html;
};


