"use strict";

var mongoose = require('mongoose');

var inviteRequestSchema = mongoose.Schema({
    
    email: String,
    datetime: {
    	type: Date,
    	default: Date.now
    },
    status: String,
    sent: {
    	type: Boolean,
    	default: false
    }
        
});

var InviteRequest = mongoose.model('InviteRequest', inviteRequestSchema);
module.exports = InviteRequest;