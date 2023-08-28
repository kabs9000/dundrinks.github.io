import GLOBAL from './GLOBAL.js?v=146'
import hal from './hal.js?v=146'
import ui from './ui.js?v=146'

// artist, title, size, description, anon, pillar_uuid, slot_index
const xhr_piece = async( file, data, hide_spinner ) => {

	data = data || {}

	const formData = new FormData()
	formData.enctype = 'multipart/form-data'
	// formData.append('type', 'piece')
	formData.append('upload', file ) // post value, file, name  // 'some-' + lib.random_hex( 6 ) // filename should be serverside
	// formData.append('artist', artist )
	// formData.append('title', title )
	// formData.append('size', size )
	// formData.append('description', description )
	for( const key in data ){
		if( key !== 'upload'){
			formData.append( key, data[ key ] )
		}
	}

	const xhr = new XMLHttpRequest()

	if( !hide_spinner ) ui.spinner.show()

	const res = await new Promise((resolve, reject) => {

		xhr.open('POST', '/file_handler', true)

		xhr.onreadystatechange = function() {

			if( this.readyState == XMLHttpRequest.DONE ){

				try{

					// console.log( 'file_handler res: ', this.response )

					const response = JSON.parse( this.response )

					resolve( response )

					// if( response.success ){
					// 	resolve( response )
					// }else{
					// 	hal('error', response.msg || 'error uploading')
					// 	console.log('upload res: ', response )
					// }

				}catch(e){
					if( this.response.match(/too large/i)){
						hal('error', 'image uploads must be ' + GLOBAL.UPLOAD_LIMIT_MB + 'mb or smaller', 10 * 1000)
					}
					reject( e )
				}

			}else{
				// data chunks here  // console.log('xhr readyState: ', this.readyState ) [ 0, 1, 2, ... ]
			}

		}

		xhr.send( formData )

		xhr.onerror = err => {
			console.log( err )
			reject( err )
		}

	})

	// if( !hide_spinner ) 
	ui.spinner.hide()

	return res

}


// const handle_sculpture = async( file, location ) => {

// 	console.log( file, location )

// }

export {
	xhr_piece,
}

