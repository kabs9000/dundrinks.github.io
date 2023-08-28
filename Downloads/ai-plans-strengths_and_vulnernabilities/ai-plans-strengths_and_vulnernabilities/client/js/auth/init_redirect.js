
if( document.getElementById('redirect') ){
	let loc = document.getElementById('redirect').getAttribute('data-redirect') 
	location.href = '/' + loc
}else{
	location.href = '/'
}

