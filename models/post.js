"use strict";
// -- Message Board: models are mongoose, not sequelize! -- //

var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    username: String,
    datetime: {
    	type:Date,
    	default:Date.now
    },
    title: String,
    body: String,
    replies: [{
    	body: String,
    	username: String,
    	datetime: {
    		type:Date,
    		default:Date.now
    	}		
    }]
    
});

var Post = mongoose.model('Post', postSchema);
module.exports = Post;
