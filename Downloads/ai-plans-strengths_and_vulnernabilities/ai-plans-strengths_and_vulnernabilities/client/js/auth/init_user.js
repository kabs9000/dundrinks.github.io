import hal from '../hal.js?v=146'
import fetch_wrap from '../fetch_wrap.js?v=146'
import ui from '../ui.js?v=146'
import * as lib from '../lib.js?v=146'
import GLOBAL from '../GLOBAL.js?v=146'





// decl
const content = document.getElementById('content')




// lib

const build_post = post => {
	const wrap = lib.b('div', false, 'user-post')
	const title = lib.b('a', false, 'post-title')
	title.href = '/post/' + post.uuid
	title.innerText = post.title
	const created = lib.b('div', false, 'post-created')
	created.innerText = new Date( post._created ).toLocaleString().split(',')[0]
	wrap.append( title )
	wrap.append( created )
	return wrap
}




// init

fetch_wrap('/action_main', 'post', {
	action: 'get_user_posts',
	slug: location.href.split('/user/')[1],
})
.then( res => {

	if( res?.success ){

		const header = lib.b('h4')
		header.innerText = 'User posts'

		const user_posts = lib.b('div', 'user-posts')
		content.append( user_posts )
		for( const r of res.results ){
			user_posts.append( build_post( r ))
		}

	}else{
		console.log('error getting user: ', res )
	}

})