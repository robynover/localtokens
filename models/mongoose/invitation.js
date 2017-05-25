"use strict";

var mongoose = require('mongoose');
const crypto = require('crypto');
var config = require('../../config/config.js')[process.env.NODE_ENV];

var invitationSchema = mongoose.Schema({
    code: String,
    created_at: {
    	type:Date,
    	default:Date.now
    },
    inviter_id: Number,
    inviter_username: String,
    inviter_firstname: String,
    invitee_email: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
          },
          message: '{VALUE} is not a valid email address'
        }
    },
    sent: {
        type: Boolean,
        default: false
    },
    redeemed: {
        type: Boolean,
        default: false
    }
    
});

invitationSchema.methods.generateCode = function(){
    var d = new Date;
    var data = this.invitee_email + this.inviter_username + d.getTime() + config.inviteSalt
    var code = crypto.createHash('md5').update(data).digest("hex");
    this.code = code;    
};

invitationSchema.statics.findByCode = function(code) {
    return this.findOne({ code: code });
};

var Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;