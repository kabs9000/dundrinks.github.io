const axios = require('axios');
const fs = require('fs');
const log = require('./log.js')
const { parseString } = require('xml2js');



function extractArxivId( url ) {
    // Regular expressions for matching ArXiv identifiers
    const newScheme = /\d{4}\.\d+(v\d+)?/;
    const oldScheme = /([\w\.-]+\/\d{4}\d+)/;
    
    const match = url.match( newScheme ) || url.match( oldScheme );
    if ( match ) {
        return match[0];
    }
    return null;
}

async function getArxivPaper( url ) {

    const articleId = extractArxivId( url );
    if ( !articleId ) {
    	log('flag', 'failed to extract arxiv id', articleId, url )
        return null;
    }

    try {

    	const try_url = `http://export.arxiv.org/api/query?id_list=${articleId}`

    	log('flag', 'fetching XML data: ', try_url )

        const response = await axios.get( try_url );

        const paperData = await parseXML( response.data )

        paperData.extracted_id = articleId

        log('flag', 'axios XML parse res: ',  paperData )

        // response.data.feed.entry[0];

        return paperData;

    } catch (error) {
    	log('flag', error )
        return null;
    }
}

function parseXML(xmlData) {
    return new Promise((resolve, reject) => {
        parseString(xmlData, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.feed.entry[0]);
            }
        });
    });
}

function ensurePathExists(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

async function getArxivData( url, args ) {

	try{

	    // const arguments = process.argv.slice(2);
    
	    if (args.length === 0) {
	        throw new Error('Received no arguments.');
	    }
	    
	    // const url = args[0];

	    log('flag', 'given args: ', url, args )
	    
	    const paper = await getArxivPaper( url );
	    if (!paper) {
	        return {
	        	success: false,
	        	msg: 'Article not found'
	        }
	    }

	    const data = {};

	    data.title = paper.title[0];

	    data.authors = paper.author.map(author => author.name);

	    data.summary = paper.summary;

	    // log('flag', 'what is paper ', paper )
	    // log('flag', 'can we do clearner URL... ', paper.id[0] )

	    const paper_slug = get_paper_slug( paper.id[0] )
	    if( typeof paper_slug !== 'string' || paper_slug.length < 5 ) return {
	    	success: false,
	    	msg: 'invalid paper URL generated',
	    }

	    const pdfPath = `./fs/arxiv/${ paper_slug }.pdf`;
	    ensurePathExists('./fs/arxiv/');

		if( fs.existsSync( pdfPath ) ){

			log('flag', 'paper already exists: ', pdfPath )

		}else{

		    const pdf_link = paper.link[1]?.['$']?.href  // what is that ??

		    // log('flag', 'paper link data: ', paper.link[0] )
		    // log('flag', 'paper link data: ', paper.link[1] )

		    const response = await axios({
		        method: 'get',
		        url: pdf_link,
		        responseType: 'stream'
		    })

	        response.data.pipe( fs.createWriteStream( pdfPath ) );
		}

		data.pdf_path = pdfPath;
		data.embed_ref = pdfPath.replace('./fs/arxiv/', '').replace('.pdf', '')
	    
	    return {
	    	success: true,
	    	data: data
	    };

	}catch( err ){
		log('flag', 'arxiv err', err )

	}

}

const get_paper_slug = url => {
	if( typeof url !== 'string' ) return log('flag', 'invalid paper url', url )
	return url.replace(/https?:?\/?\/?/, '').replace(/\//g, '_')
}

module.exports = getArxivData


