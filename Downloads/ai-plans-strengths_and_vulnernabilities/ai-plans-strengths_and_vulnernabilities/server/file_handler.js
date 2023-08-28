/*
	requires formdata middleware
	- express-form-data or otherwise
*/
const detect_type = require('detect-file-type')

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const log = require('./log.js')
const env = require('./.env.js')
const lib = require('./lib.js')
const jimp = require('jimp')
const PUBLIC = require('./data/PUBLIC.js')
const PRIVATE = require('./data/PRIVATE.js')
const DB = require('./db.js')


const {
	OTHER_TYPES,
	IMAGE_TYPES,
} = PRIVATE



const ALLOWED_TYPES = OTHER_TYPES.concat( IMAGE_TYPES )



module.exports = async( request ) => {

	if( request.session._last_uploaded ){
		if( Date.now() - request.session._last_uploaded < PUBLIC.UPLOAD_BUFFER_S ){
			return lib.return_fail('upload buffer block ' + lib.identify( request.session.USER ), 'wait ' + PUBLIC.UPLOAD_BUFFER_S + ' seconds between uploads' )
		}
	}
	request.session._last_uploaded = Date.now()

	// ----- validate request file exists

	const FILE = request.files?.upload
	if( !FILE ){
		log('flag', 'no upload files?', request.files )
		return lib.return_fail('no file provided', 'invalid file provided')
	}

	// log('flag', 'file_handler: ', Object.keys( request.body ), typeof request.files )
	log('file_handler', '\n***\nbeginning upload: ', {
		originalFilename: FILE.originalFilename, 
		path: FILE.path, 
		type: FILE.type,
		size: FILE.size,
	})

	// ----- validate allowed types

	const { ext, mime } = await new Promise((resolve, reject) => {
		detect_type.fromFile( FILE.path, ( err, res ) => {
			if( err ) return reject( err );
			resolve( res )
		})
	})

	log('file_handler', 'detected filetype: ', ext, mime )

	type = ext

	if( !ALLOWED_TYPES.includes( type ) ) return lib.return_fail('invalid upload type: ' + type, 'filetype is not allowed')
	
	// ----- validate size

	const size_res = validate_size( FILE, type )
	if( !size_res?.success ) return size_res

	log('file_handler', 'size valid: ', FILE.size, size_res.limit + 1000000 )

	// log('flag', 'req files: ', Object.keys( request.files ) )
	// log('flag', 'req body: ', Object.keys( request.body ) )
	// log('flag',' FILE: ', FILE )

	// ----- validate meta
	const meta_res = validate_upload_meta( FILE, type, request )
	if( !meta_res?.success ){
		delete meta_res.temp_path
		delete meta_res.final_path
		return meta_res
	}

	const {
		success,
		msg,
		temp_path,
		final_path,
		file_url,
	} = meta_res // , gallery

	log('file_handler', 'meta validation: ', msg || `
${ final_path }`)

	// ----- do upload

	mkdirp.sync( env.UPLOAD_DIR + '/', { mode: '0744' })

	// ----- main

	const full_main_path = final_path

	if( IMAGE_TYPES.includes( type ) ){

		let step = await new Promise((resolve, reject ) => {

			jimp.read( temp_path, (err, file) => {
				if( err ) {
					log('flag', 'jimp err', err )
					return resolve( false );
				}

				file
				.scaleToFit( PRIVATE.IMAGE.CONSTRAIN.MAIN, PRIVATE.IMAGE.CONSTRAIN.MAIN )
				.quality( 70 )
				// .greyscale()
				.write( path.resolve( full_main_path ))

				resolve(true)

			})

		})
		if( !step ) return lib.return_fail( 'failed main upload: ' + lib.identify( request.session?.USER ), 'failed to upload')

		// ----- thumb

		const full_thumb_path = final_path.replace('/fs/', '/fs/thumbs/')

		step = await new Promise((resolve, reject ) => {

			jimp.read( temp_path, (err, file) => {
				if( err ) {
					log('flag', 'jimp err', err )
					return resolve( false );
				}

				file
				.scaleToFit( PRIVATE.IMAGE.CONSTRAIN.THUMB, PRIVATE.IMAGE.CONSTRAIN.THUMB )
				.quality( 100 )
				// .greyscale()
				.write( path.resolve( full_thumb_path ))

				resolve(true)

			})

		})

		if( !step ) return lib.return_fail( 'failed thumb upload: ' + lib.identify( request.session?.USER ), 'failed to upload')

	}else{

		// fs.writeFile( env.UPLOAD_DIR + '/' + file_url, )
		await new Promise((resolve, reject ) => {
			fs.rename( temp_path, env.UPLOAD_DIR + '/' + file_url, err => {
				if( err ) return reject( err )
				resolve()
			})			
		})

		log('flag', '\n\n need to write other filetypes to disk here here\n\n')

	}

	log('file_handler', 'finished upload: \n' + file_url )

	return {
		success: true,
		slug: file_url,
		// final_path: final_path,
	}

} // file-handler






const validate_size = ( FILE, filetype ) => {

	let limit
	// if( FILE.type.match(/\/pdf/) ){
	if( filetype === 'pdf' ){
		limit = PUBLIC.UPLOAD_LIMIT_MB_PDF
	}else if( IMAGE_TYPES.includes( filetype ) ){
		limit = PUBLIC.UPLOAD_LIMIT_MB
	}else{
		limit = PUBLIC.UPLOAD_LIMIT_GENERIC_MB
	}

	if( FILE.size > limit * 1000000 ){
		return lib.return_fail( 'file size reject ' + FILE.size, 'files must be ' + limit + 'mb max' )
	}

	return { success: true, limit: limit }

} // validate size



// const file_ext = file => {

// 	const temp_path = file.path
// 	// const originalFilename = file.originalFilename

// 	const type = temp_path.split('.')[1]

// 	return type

// }







const validate_upload_meta = ( file, type, request ) => {

	if( typeof env.UPLOAD_DIR !== 'string' ) return lib.return_fail('missing upload dest', 'invalid upload destination')

	if( !ALLOWED_TYPES.includes( type )) return lib.return_fail('invalid upload type', 'invalid upload type')

	// const ext = file_ext( file )

	const tempPath = file.path
	const file_URL = Date.now() + '_' + lib.random_hex(12) + '.' + type
	const finalPath = env.UPLOAD_DIR + '/' + file_URL 

	return { 
		success: true,
		temp_path: tempPath,
		final_path: finalPath,
		file_url: file_URL,
	}

} // validate meta



// how to delete:

// fs.unlink( tempPath, err => { // unecessary with autoClean
// 	if( err ) return false
// 	response.status(403).contentType('text/plain').end('invalid file upload')
// })