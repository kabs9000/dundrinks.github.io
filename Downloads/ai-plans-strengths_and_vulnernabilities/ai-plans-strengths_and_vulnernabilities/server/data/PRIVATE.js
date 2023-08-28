const env = require('../.env.js')

// const {
// 	Vector3,
// } = require('three')

module.exports = {



	middle_english_names: [
	    "Ailward",
	    "Alisandre",
	    "Amis",
	    "Anselm",
	    "Arnald",
	    "Bardolf",
	    "Beryn",
	    "Cadwallader",
	    "Cecily",
	    "Clement",
	    "Constance",
	    "Cuthbert",
	    "Damaris",
	    "Eadric",
	    "Edith",
	    "Elisant",
	    "Eudo",
	    "Faramond",
	    "Felice",
	    "Galfrid",
	    "Gawain",
	    "Gertrude",
	    "Giles",
	    "Godfrey",
	    "Griffith",
	    "Grimbald",
	    "Griselda",
	    "Gundred",
	    "Gurth",
	    "Halward",
	    "Hamond",
	    "Hawise",
	    "Helena",
	    "Hereward",
	    "Hylda",
	    "Isolde",
	    "Jocelyn",
	    "Juliana",
	    "Kemp",
	    "Kenelm",
	    "Lancelot",
	    "Laudine",
	    "Lefchild",
	    "Letice",
	    "Lore",
	    "Maud",
	    "Melisende",
	    "Miles",
	    "Nigel",
	    "Odo",
	    "Osbert",
	    "Oswald",
	    "Pagan",
	    "Parnel",
	    "Philippa",
	    "Ranulf",
	    "Reginald",
	    "Roland",
	    "Rosamund",
	    "Rowland",
	    "Rufus",
	    "Sibyl",
	    "Sigurd",
	    "Sybil",
	    "Tacy",
	    "Theobald",
	    "Thurstan",
	    "Tristram",
	    "Waleran",
	    "Warin",
	    "Winifred",
	    "Wulfric",
	    "Wymond",
	    "Yvain",
	],

	name_length: 25,

	TICK_TIME: 1000,

	ITEM_TICK_TIME: env.LOCAL ? 2000 : 9 * 1000,

	ITEM_RANGE: 10 * 1000,

	STRIPE: env.PRIVATE_STRIPE,

	IMAGE: {
		CONSTRAIN: {
			MAIN: 1000,
			THUMB: 200,
		},
	},

	GPT_AVG_RESPONSE_MS: 1000,

	AWKWARD_MS: ( env.LOCAL ? 5 : 15 )  * 1000,

	VALID_MODELS: {
		'gpt-4': 'gpt-4',
		'gpt-3.5-turbo': 'gpt-3.5-turbo',
		'text-davinci-003': 'text-davinci-003',
	},

	OTHER_TYPES: [
		'pdf',
	],

	IMAGE_TYPES: [
		'jpg',
		'png',
		'jpeg',
		'gif',
	],

}