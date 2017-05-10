"use strict";
var gm = require('gm').subClass({imageMagick: true});

class Image{
	sizePhoto(filepath,dest,width,callback){
		gm(filepath)
		.autoOrient()
		.resize(width)  // max width
		.write(dest, function (err) {
			if (err){
			  console.log(err);
			} else {
				callback();
			}
		})
	}
}

module.exports = new Image();