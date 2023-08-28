import env from './env.js?v=146'

const user = {}

if( env.EXPOSE ) window.USER = user

export default user