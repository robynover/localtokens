"use strict";
// -- Message Board: models are mongoose here, not sequelize! -- //
// for image resize and orientation
var gm = require('gm').subClass({imageMagick: true});

var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    username: String,
    datetime: {
    	type:Date,
    	default:Date.now
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    photo: String,
    thumb: String,
    type: String,
    contact: String
    
});

postSchema.index({title:"text"});
postSchema.set('autoIndex', false);

postSchema.methods.convertPhotos = function(options,callback){
    /*
    example:
    options ={
        srcPath: 'original filename path',
        destPath: 'main destination',
        destName: 'new name of file'
        thumbPath: 'thumbnail destination'
    }
     */
    
    gm(options.srcPath)
    .autoOrient()
    .resize(800)  // max 800 width
    .write(options.destPath+ options.destName, function (err) {
      if (err){
        console.log(err);
        //resolve(); //reject()?
      } else {
        // --- create thumbnail from new file--- //
        gm(options.destPath+ options.destName).size(function (err, size) {
            if (!err){
                var orientation = size.width > size.height ? 'wide' : 'tall';
                var w = null;
                var h = null;
                var thumbsize = 100;
                if (orientation == 'wide'){
                    h = thumbsize;
                } else {
                    w = thumbsize;
                }
                this.resize(w,h)
                    .crop(thumbsize,thumbsize,0,0)
                    .write(options.thumbPath + options.destName, err=>{
                        if (err){
                            console.log(err);
                        } else {
                            //console.log('crop success');
                        }
                        callback();
                    });
            }
        });
      }
    });
};


var Post = mongoose.model('Post', postSchema);
module.exports = Post;
