
const DEV_DB = {
	HOST: '', // provided on request
	NAME: '', // provided on request
	USER: '', // provided on request 
	PW: '', // provided on request
	PORT: 3306, // 3306 == default,
	CHARSET: 'utf8mb4',
	PRIVATE_BACKUP_URL: [ FILL - your repo ] + '/_storage/mysqldumps',
	PUBLIC_BACKUP_URL: '_storage/mysqldumps',
	// SOCKETPATH: xxx // Unix socketPath :3
}
const port = 9004 // ( match with client env )

const ENV =  {
	
	CONTACT_EMAIL: 'anyone@ai_plans.com',

	SITE_TITLE :'AI Plans',
	SITE_URL: 'localhost:' + port,
	SITE_META_DESC: 'AI plans',
	SITE_IMAGE: 'localhost:' + port + '/resource/images/logo.jpg',
	SITE_DESC: 'Discussion and critique of plans for AI alignment',

	LOCAL: true,
	DEV: false,
	PRODUCTION: false,
	HOLDING: false,

	PORT: port,

	HTDOCS: [ FILL - your project root on filesyste ] + '/ai_plans',
	PUBLIC_ROOT: 'localhost:' + port,

	SECRET: 'anythingwilldo',

	ADMINS: [
		// FILL - your email & any other admins here
	],

	ACTIVE: { // which type of logging to show
		once: 1, // grey
		flag: 1, // red
		boot: 1, // lgreen
		gatekeep: 1,
		mail: 1,
		payments: 1,
		ai_cron: 1,
		User: 1,
		test: 1,
		webhook: 1,
		file_handler: 1,
		wss: 1,
	},

	DB: DEV_DB,

	MAIL: {
 		ADMIN: 'ai-plans@oko.nyc', // the actual login
		PW: '', // only needed on production
		PERSONAL: '',
		SERVER: '', //  only needed on production
		SECURE: true,
		PORT: 465,
		PROTOCOL: 'smtp',
	},

	IGNORE_ROUTES: [
		/^\/robots.txt/,
		/^\/favicon.ico/,
		/^\/$/,
		/.*\.php$/,
	],

	NO_LOG: ['^/wp-', '^/.well', '/robots', '^/.env', '.*.php$', '^/fs/.*', '^/client/.*'],

	REDIS: {
		HOST: 'localhost',
    		TTL: 1000 * 60 * 60 * 24 * 7 * 2,
		PORT: 6379,
		SECRET: 'anythingwilldo',
		MAP_URI: [ FILL - must create this plain json file for redis ] + '/REDIS_MAP.json',
		NAME: 'aipRedis', // whatever you want to call it, locally
	},

	UPLOAD_DIR: [ FILL - your filesystem project root ] + '/ai-plans/fs',

}


module.exports = ENV
