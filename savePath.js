module.exports = function(req,res,next){
	//console.log('MIDDLEWARE');
	//console.log(req.path);
	var path = req.path;
	var parts = path.split('/');
	if (parts[1] !== 'api' && parts[1] !== 'signin' && parts[parts.length -1] !== "favicon.ico"){
		req.session.lastVisited = path;
		//console.log('saved '+path);
	}
	next();
}