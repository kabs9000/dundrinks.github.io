import fetch_wrap from './fetch_wrap.js?v=146'
import * as lib from './lib.js?v=146'
import hal from './hal.js?v=146'


const arxiv_button = document.getElementById('fetch-paper-btn')
const arxiv_url = document.getElementById('arxiv-url')
const arxiv_prefix = 'https://arxiv.org/abs/'

// Function to fetch paper details from arXiv API
async function fetchPaperDetails() {

	if( !arxiv_url ) return console.error('missing arxiv ele')

	const arxivUrlValue = arxiv_url.value.trim();
	if (!arxivUrlValue.startsWith( arxiv_prefix ) ) {
	    return hal('error', 'Please enter a valid arXiv URL (e.g., https://arxiv.org/abs/1712.06365)', 8000 );
	}

	// Call the server endpoint to fetch paper details
	const the_url = `/fetch_paper_details\?url=${ encodeURIComponent( arxivUrlValue ) }`

	console.log('attempting', the_url )

	const res = await fetch_wrap( the_url, 'get' );

	console.log( 'woohoo', res )

	if ( res?.success ) {

		const paperDetails = res.data

			const modal = new Modal({
				type: 'summary',
				header: 'paper summary',
			})

			const expl = lib.b('div')
			expl.innerHTML = `
<p>
Paper title and attribution have been filled.  Attached below is the <b>summary</b> - this often needs cleanup by pasting into a plain text editor to ensure formatting.
</p>
<p>
To include the PDF embed, use the following shortcode:<br>
<code>[[arxiv ${ paperDetails.embed_ref }]]</code>
</p>
`

			const preview = lib.b('div', false, 'summary-preview')
			preview.innerText = paperDetails.summary?.[0] || paperDetails.summary
			modal.content.append( expl )
			modal.content.append( preview )
			document.body.append( modal.ele )

	    // Fill the input fields with paper details
	    document.getElementsByName('title')[0].value = paperDetails.title;
	    document.getElementsByName('description')[0].value = paperDetails.summary;
	    document.getElementsByName('attribution')[0].value = paperDetails.authors.join(', ');
	    // document.getElementsByName('content')[0].value = paperDetails.summary + '\\\n\\\n' + arxivUrlValue;

	} else {
		hal('error', res?.msg || 'error fetching paper details', 8000 )
	    console.error( res, 'Tried: ' + the_url );
	}
}

const formatInnerText = val => {
	return val.replace(/\`/g, '"').replace(/\\n/g, ' ')
}

if( arxiv_button ){
	// Add event listener to the fetch paper button
	arxiv_button.addEventListener('click', fetchPaperDetails);	
}else{
	console.error('could not find / bind to arxiv button')
}




export default {}