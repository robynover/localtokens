"use strict";
// -- Message Board: models are mongoose here, not sequelize! -- //

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
    thumb: String
    /*replies: [{
    	body: String,
    	username: String,
    	datetime: {
    		type:Date,
    		default:Date.now
    	}		
    }]*/
    
});

var Post = mongoose.model('Post', postSchema);
module.exports = Post;
