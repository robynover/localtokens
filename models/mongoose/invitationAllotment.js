"use strict";

var mongoose = require('mongoose');

var invitationAllotmentSchema = mongoose.Schema({
    
    userid: Number,
    username: String,
    limit: {
        type:Number,
        default: 0
    },
    invites: [mongoose.Schema.Types.ObjectId]
    
});

invitationAllotmentSchema.methods.addToLimit = function(amount){
    var limit = this.limit + parseInt(amount);
    this.limit = limit;
    return this.save();

};
invitationAllotmentSchema.methods.addInvite = function(id){
    if (!this.invites.includes(id)){
        this.invites.push(id); 
    }
    return this.save();
};

invitationAllotmentSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username });
};

invitationAllotmentSchema.virtual('used').get(function () {
    return this.invites.length;
});

invitationAllotmentSchema.virtual('left').get(function(){
    return this.limit - this.invites.length;
});

var InvitationAllotment = mongoose.model('InvitationAllotment', invitationAllotmentSchema);
module.exports = InvitationAllotment;