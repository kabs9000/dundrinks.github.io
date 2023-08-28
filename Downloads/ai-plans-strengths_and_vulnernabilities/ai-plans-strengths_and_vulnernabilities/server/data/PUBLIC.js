const env = require('../.env.js')

//const { Vector3 } = require('three')


module.exports = {

	PUBLIC_ROOT: '',

	POST_CHAR_LIMIT: 50000,

	CONFIRM_MINUTES: 15,

	// STRIPE: env.STRIPE,

	UPLOAD_LIMIT_MB: 8,
	UPLOAD_LIMIT_MB_PDF: 5,
	UPLOAD_SEC_LIMIT: 15,

	CHAT_LENGTH: 500,

	POST_BUFFER_MS: ( env.LOCAL ? 5 : 60 ) * 1000,
	COMMENT_BUFFER_MS: ( env.LOCAL ? 5 : 30 ) * 1000,

	POST_LIMITS: { // char limits
		TITLE: 200,
		DESCRIPTION: 1200,
		CONTENT: 1000 * 500,
		ATTRIBUTION: 250,
		COMMENT_CONTENT: 10 * 1000,
	},

	VOTE_TYPES: {
		single_up: 1,
	},

	UPLOAD_BUFFER_S: 10,

	UPLOAD_LIMIT_GENERIC_MB: 1,

}
