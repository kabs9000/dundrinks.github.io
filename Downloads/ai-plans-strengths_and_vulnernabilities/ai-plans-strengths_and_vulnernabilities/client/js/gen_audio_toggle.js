import BROKER from './EventBroker.js?v=146'

let prevY, currY, relativeY

const audio = document.createElement('div')
audio.id = 'audio'
const audio_img = document.createElement('img')
audio_img.src = '/resource/media/audio.svg'
audio_img.setAttribute('draggable', false ) // gr, doesnt help
audio.appendChild( audio_img )
audio.addEventListener('mousedown', e => {
	prevY = e.clientY
	audio.addEventListener('mousemove', track_slider )
	audio.addEventListener('mouseup', remove_slider_listener )
	audio.addEventListener('mouseout', remove_slider_listener )
	audio.addEventListener('click', track_slider )
})


// audio.addEventListener('click', e => {

// })


const track_slider = e => {

	relativeY = 100 - ( e.clientY - audio.getBoundingClientRect().top )

	BROKER.publish('SOUND_PLACE_SLIDER', Math.floor( relativeY / 10 ) )

}


const place_slider = event => {

	audio_img.style.bottom = 0 + ( ( event * 10 ) * .7 ) + 'px'

}


const remove_slider_listener = () => {

	audio.removeEventListener('mousemove', track_slider )

	BROKER.publish('SOUND_VOLUME', Math.floor( relativeY / 10 ) )

}


const detect_mute = event => {

	event === 0 ? audio_img.src = '/resource/media/audio-mute.svg' : audio_img.src = '/resource/media/audio.svg'

}

BROKER.subscribe('SOUND_PLACE_SLIDER', place_slider )
BROKER.subscribe('SOUND_VOLUME', detect_mute )

export default () => {
	return audio
}

