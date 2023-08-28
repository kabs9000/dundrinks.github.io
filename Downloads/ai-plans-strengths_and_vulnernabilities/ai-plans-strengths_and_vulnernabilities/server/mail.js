const log = require('./log.js')
const env = require('./.env.js')
const formData = require('form-data');


const nodemailer = require('nodemailer')
// const mailgun = require("mailgun-js")
const mailgun = require('mailgun.js')






// const SENDTYPE = 'MG_PUBLIC'
const SENDTYPE = 'NODEMAILER'

let _send, mg







if( !env.PRODUCTION ){

	_send = async( data ) => {

		log('mail', 'non production mail halt: ', data )
		return { success: true, halted: true }

	}



}else if( SENDTYPE === 'MG_PUBLIC' ){

	/* ----------------------------------- MAILGUN PUBLIC DOCS ----------------------------------- */

	mg = new mailgun( formData )

	const client = mg.client({
		username: 'api', 
		key: env.MAILGUN.KEY,
		public_key: env.MAILGUN.PUB_KEY,
	});

	_send = async( data ) => {
		const res = await client.messages.create( env.MAILGUN.DOMAIN, data )
		return res
	}








}else if( SENDTYPE === 'NODEMAILER' ){


	/* ----------------------------------- NODEMAILER ----------------------------------- */

	const transporter = nodemailer.createTransport({
		// host: 'mail.oko.nyc',
		host: env.MAIL.SERVER,
		service: env.MAIL.PROTOCOL,
		port: env.MAIL.PORT,
		secure: env.MAIL.SECURE,
		requireTLS: true,
		tls: {
			rejectUnauthorized: false
		},
		auth: {
			user: env.MAIL.ADMIN,
			pass: env.MAIL.PW
		}
	})

	_send = ( options ) => {

		return new Promise((resolve, reject) => {

			/////////////////////////// dev 
			if( !env.PRODUCTION ){ 										
				log('mail', 'email SKIPPED (dev)', options )
				resolve({
					response: 'sent',
					accepted: [1],
				})
				return true
			}
			
			transporter.sendMail( options, (error, info) => { 	
				if( error ){
					reject( error )
					return false
				}

				if( env.PRODUCTION ){ /////////////////////////// PRODUCTION, more concise
					log('mail', 'email SENT: ', {
						from: options.from,
						to: options.to,
						subject: options.subject,
						html: '( ' + options.html.length + ' characters )',
						text: '( ' + options.text.length + ' characters )' 
					})

				}else{ /////////////////////////// DEV, LOCAL, full log

					log('mail', 'email SENT: ', options )

				}

				resolve( info )

			})

		})

	}

}


const catch_send = async( data ) => {
	try{
		const res = await _send( data )
		return res
	}
	catch( err ){
		log('flag', 'mail err: ', err )
		log('flag', 'email: ', data.to, data.from, data.subject )
	}
}



module.exports = {
	client: mg,
	sendmail: catch_send,
}
