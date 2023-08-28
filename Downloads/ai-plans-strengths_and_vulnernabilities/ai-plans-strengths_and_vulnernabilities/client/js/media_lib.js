import env from './env.js?v=146'
import hal from './hal.js?v=146'
import fetch_wrap from './fetch_wrap.js?v=146'
import ui from './ui.js?v=146'
import * as lib from './lib.js?v=146'
import GLOBAL from './GLOBAL.js?v=146'
import { Modal } from './Modal.js?v=146'
import { 
	xhr_piece 
} from './file_handler.js?v=146'




const get = async( wrapper, show_errors ) => {

	const res = await fetch_wrap('/action_account', 'post', {
		action: 'get_media_library',
	})

	if( !res.success ){
		if( show_errors ){
			return hal('error', res?.msg || 'error fetching media library', 10 * 1000 )
		}else{
			return console.error( 'error fetching media lib', res )
		}
	}

	return res.results

}


const pop_modal = async( add_instructs ) => {

	const modal = new Modal({
		type: 'media-library',
		header: 'user media'
	})

	// upload title input
	const title = lib.b('input', false, 'input')
	title.placeholder = 'title'
	modal.content.append( title )

	if( add_instructs ){
		const expl = lib.b('div', 'expl')
		expl.innerHTML = `To include an image or PDF in your post, copy it's unique id and include it using 2 brackets:<br><span>[[ uuid ]]</span>.<br>The media will be embedded in the post at that location.`
		modal.content.append( expl )
	}

	// upload btn
	const hidden_upload = lib.b('input')
	hidden_upload.type = 'file'
	hidden_upload.addEventListener('change', e => {

		if( hidden_upload.files?.length !== 1 ) return hal('error', 'must choose one item for upload', 5000 )

		xhr_piece( hidden_upload.files[0], {
			title: title.value.trim(),
		}, false ) // ( hide spinner )
		.then( res => {

			console.log('img handle: ', res )

			if( !res.success ){
				ui.spinner.hide()
				return hal('error', res?.msg || 'error uploading', 20 * 1000 )
			}

			fill_items( item_list )

		})
		.catch( err => {
			hal('error', err?.msg || 'error uploading', 10 * 1000 )
			console.error( err )
			ui.spinner.hide()
		})

		console.log('uploading changed....', hidden_upload.file || hidden_upload.files )

	})

	const upload = lib.b('div', false, 'button')
	upload.innerText = 'upload'
	upload.addEventListener('click', () => {
		if( !title.value ){
			if( env.PRODUCTION && !confirm('proceed with no title?')) return;
		}

		hidden_upload.click()
	})
	modal.content.append( upload )

	// get user lib

	document.body.append( modal.ele )

	const items = await get()

	console.log('user items init load', items )

	if( !modal.ele.parentElement ) return console.log('no modal', modal ) // (modal has been closed)

	const item_list = lib.b('div', 'item-list')

	modal.content.append( item_list )

	for( const item of items ){
		item_list.append( build_media_item( item ) )
	}

}


const fill_items = async( wrapper ) => {

	wrapper.innerHTML = ''

	const items = await get()

	console.log('user items refresh load', items )

	for( const item of items ){
		wrapper.append( build_media_item( item ) )
	}

	if( !items.length ) wrapper.innerText = 'no items'

}


const build_media_item = item => {
	const wrapper = lib.b('div', false, 'media-item')
	wrapper.setAttribute('data-uuid', item.uuid )

	const preview = lib.b('div', false, 'media-preview')
	if( item.slug.match(/\.pdf/)){
		//
	}else{
		const img = lib.b('img')
		img.src = '/fs/thumbs/' + item.slug
		preview.append( img )
	}
	wrapper.append( preview )

	const details = lib.b('div', false, 'media-details')
	const title = lib.b('div', false, 'media-item-title')
	title.innerText = item.title || '(untitled)'
	details.append( title )
	const uuid = lib.b('div', false, 'media-uuid')
	uuid.innerText = item.uuid
	details.append( uuid )
	wrapper.append( details )

	const rm = lib.b('div', false, 'button')
	rm.innerHTML = '&times;'
	rm.addEventListener('click', () => {

		if( !confirm('delete item?') ) return;// hal('error', 'in dev', 5000 )

		fetch_wrap('/action_account', 'post', {
			action: 'remove_media',
			uuid: item.uuid,
		})
		.then( res => {
			if( res.success ){
				hal('success', 'removed', 5000 )
				wrapper.remove()
			}else{
				hal('error', res?.msg || 'error removing', 15000 )
			}
		})
	})
	wrapper.append( rm )

	return wrapper
}


export default {
	get,
	pop_modal,
}