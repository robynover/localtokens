"use strict";

var mongoose = require('mongoose');

var feedbackSchema = mongoose.Schema({
    username: String,
    datetime: {
    	type:Date,
    	default:Date.now
    },
    content: String 
});

var Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;