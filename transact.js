"use strict";

module.exports = function(app){
	var User = app.get('models').user;
	var Ledger = app.get('models').ledger;

	return {
		send: function(sender_id,receiver_id,amount,note){
			// check that sender has enough funds
			return User.findById(sender_id)
				.then(user=>{
					return user.getBalance()
						.then(balanceArr=>{
							
							if ( (parseInt(balanceArr[0].balance) + parseInt(user.max_negative_balance)) >= amount ){
								// send
								return Ledger.create({
											sender_id: sender_id,
											receiver_id: receiver_id,
											note: note,
											amount: amount 
										});
							} else{
								throw new Error("sender doesn't have enough credits");
							}
						})
					});
		}

	};
};