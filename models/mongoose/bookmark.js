"use strict";

var mongoose = require('mongoose');

var bookmarkSchema = mongoose.Schema({
    username: String,
    post_id: mongoose.Schema.Types.ObjectId,
    datetime: {
    	type:Date,
    	default:Date.now
    },
    active: {
    	type: Boolean,
    	default: true
    } 
});

var Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark;