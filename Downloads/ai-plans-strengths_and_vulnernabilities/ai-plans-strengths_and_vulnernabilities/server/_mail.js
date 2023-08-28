const log = require('./log.js')
const env = require('./.env.js')



// const nodemailer = require('nodemailer')
// const mailchimp = require('@mailchimp/mailchimp_marketing')( env.MAILCHIMP.KEY )
// const mailchimpTx = require('@mailchimp/mailchimp_transactional')( env.MAILCHIMP.KEY ) 

/* 
	Mailchimp integration done following: https://www.grouparoo.com/blog/integrating-mailchimp-with-your-nodejs-app
*/

// mailchimp.setConfig({
// 	apiKey: env.MAILCHIMP.KEY,
// 	server: env.MAILCHIMP.SERVER,
// })

// mailchimpTx.users.ping()
// .then( res => {
// 	const { 
// 		status,
// 		statusText,
// 		headers,
// 		config,
// 		request,
// 		data,
// 	} = res.response
// 	log('flag', 'mailchimp init:', statusText, data )
// })

// may need:
// const options = {
//    url: ‘https://us6.api.mailchimp.com/3.0/lists/ac7ad45fa0’,
//    method: ‘POST’,
//    headers: {
//       Authorization: ‘auth <YOUR_API_KEY>’
//    },
//    body: addDataJson
// }

// const callPing = async() => {
// 	const response = await mailchimp.ping.get()
// 	return response
// }

// callPing()
// .then( res => {
// 	log('mailchimp', response )
// })

// Basic Auth
// mailchimp.setConfig({
//   apiKey: 'YOUR_API_KEY',
//   server: 'YOUR_SERVER_PREFIX',
// });
// OAuth2
// mailchimp.setConfig({
//   accessToken: 'YOUR_ACCESS_TOKEN',
//   server: 'YOUR_SERVER_PREFIX',
// });






// const transporter = nodemailer.createTransport({
// 	// host: 'mail.oko.nyc',
// 	host: env.MAIL.SERVER,
// 	service: env.MAIL.PROTOCOL,
// 	port: env.MAIL.PORT,
// 	secure: env.MAIL.SECURE,
// 	requireTLS: true,
// 	tls: {
// 		rejectUnauthorized: false
// 	},
// 	auth: {
// 		user: env.MAIL.ADMIN,
// 		pass: env.MAIL.PW
// 	}
// })

// const send = ( options ) => {

// 	return new Promise((resolve, reject) => {

// 		/////////////////////////// dev 
// 		if( !env.PRODUCTION ){ 										
// 			log('mail', 'email SKIPPED (dev)', options )
// 			resolve({
// 				response: 'sent',
// 				accepted: [1],
// 			})
// 			return true
// 		}
		
// 		transporter.sendMail( options, (error, info) => { 	
// 			if( error ){
// 				reject( error )
// 				return false
// 			}

// 			if( env.PRODUCTION ){ /////////////////////////// PRODUCTION, more concise
// 				log('mail', 'email SENT: ', {
// 					from: options.from,
// 					to: options.to,
// 					subject: options.subject,
// 					html: '( ' + options.html.length + ' characters )',
// 					text: '( ' + options.text.length + ' characters )' 
// 				})

// 			}else{ /////////////////////////// DEV, LOCAL, full log

// 				log('mail', 'email SENT: ', options )

// 			}

// 			resolve( info )

// 		})

// 	})

// }

module.exports = {
	mailchimpTx,
	// transporter,
	// send,
}