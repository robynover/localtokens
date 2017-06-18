"use strict";

var mongoose = require('mongoose');

var inviteRequestSchema = mongoose.Schema({
    
    email: String,
    datetime: {
    	type: Date,
    	default: Date.now
    },
    status: {
        type: String,
        enum: ['new','send','hold','remove'],
        default: 'new'
    },
    sent: {
    	type: Boolean,
    	default: false
    }
        
});

var InviteRequest = mongoose.model('InviteRequest', inviteRequestSchema);
module.exports = InviteRequest;