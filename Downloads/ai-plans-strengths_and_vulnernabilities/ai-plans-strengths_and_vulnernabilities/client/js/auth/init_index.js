import env from '../env.js?v=146'
import * as lib from '../lib.js?v=146'
import ui from '../ui.js?v=146'
import hal from '../hal.js?v=146'
import fetch_wrap from '../fetch_wrap.js?v=146'
import GLOBAL from '../GLOBAL.js?v=146'
import { Modal } from '../Modal.js?v=146'






const last_close = localStorage.getItem('ai-last-closed')

const buffer = env.LOCAL ? 1000 : 1000 * 60 * 60 * 24 * 2

if( last_close && Date.now() - last_close < buffer ){

	// already seen

}else{

	const modal = new Modal({
		type: 'splash-banner',
	})

	const text = lib.b('div')
	text.innerHTML = `

<p>Welcome to AI-plans.com!</p>

<p> Please read this carefully- an email address for feedback and questions will be available at the end </p>

<p>
AI-plans.com is a platform dedicated to advancing the field of AI Alignment. As such, it serves as a hub to compile, critique, and improve proposals for how to create aligned AI. We call these proposals "alignment plans." Researchers from universities, companies, and independent groups around the world are contributing their ideas.
</p>

<p>Our platform has two main goals:</p>

<ul>
  <li>Provide a comprehensive catalog of alignment plans that makes it easy to discover and learn about the leading approaches.</li>
  <li>Enable constructive debate and critiques to strengthen these plans over time.</li>
</ul>

<p>
 As a newcomer, you can browse and search our library of alignment plans to find plans relevant to problems you care about. Click on any plan to see an overview, key details, associated researchers, and current vulnerabilities.
</p>

<p>
(Plans are presently ranked top to bottom from least criticized to most criticized — we will implement a much more sophisticated ranking system soon — see https://aiplans.substack.com/ for more details.)
</p>

<p>
 If you register an account, you can add your own plans and share your own critiques. Respectful and thoughtful feedback is core to our mission.
</p>


<p>
Let us know if you have any other questions at:
</p>

<p>
  <a href="mailto:kabir03999@gmail.com">kabir03999@gmail.com</a>
</p>

<p>
Or comment on the Substack at:
</p>

<p>
  <a href="https://aiplans.substack.com/p/very-brief-summary-of-ai-planscom/comments">https://aiplans.substack.com/p/very-brief-summary-of-ai-planscom/comments</a>
</p>

<p>
We're glad you are here!
</p>


`
	modal.content.append( text )

	modal.close.addEventListener('click', () => {
		localStorage.setItem('ai-last-closed', Date.now() )
	})

	document.body.append( modal.ele )

}

