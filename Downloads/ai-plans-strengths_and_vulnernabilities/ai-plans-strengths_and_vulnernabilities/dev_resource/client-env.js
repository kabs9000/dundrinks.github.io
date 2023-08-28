const PORT = 9004 // ( match with server env port )

export default {

	LOCAL: true,
	DEV: false,
	PRODUCTION: false,

	EXPOSE: true, // makes many vars global which would otherwise be in module scope, for console access

	PUBLIC_URL: 'localhost:' + PORT,

}
