module.exports = function(req,res,next){
	//console.log('MIDDLEWARE');
	//console.log(req.path);
	var path = req.path;
	var parts = path.split('/');
	if (parts[1] !== 'api' && parts[1] !== 'signin' && parts[1] !== 'js' && parts[1] !== 'signup' && parts[1] !== 'invite' && parts[parts.length -1] !== "favicon.ico"){
		req.session.lastVisited = path;
		//console.log('saved '+path);
	}
	next();
}