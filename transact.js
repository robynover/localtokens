"use strict";

module.exports = function(app){
	var User = app.get('models').user;
	var Ledger = app.get('models').ledger;
	var CreditRules = app.get('models').credit_rules;
	var CreditsGranted = app.get('models').credits_granted;

	return {
		send: function(sender_id,receiver_id,amount,note){
			// check that sender has enough funds
			return User.findById(sender_id)
				.then(user=>{
					return user.getBalance()
						.then(balanceArr=>{
							console.log(user.max_negative_balance);
							console.log(parseInt(balanceArr[0].balance) + parseInt(user.max_negative_balance));

							if ( (parseInt(balanceArr[0].balance) + parseInt(user.max_negative_balance)) >= amount ){
								// send
								return Ledger.create({
											sender_id: sender_id,
											receiver_id: receiver_id,
											note: note,
											amount: amount 
										});
							} else{
								throw new Error("Sender doesn't have enough credits");
							}
						})
					});
		},
		log: function(user_id){
			var rule_num;
			// has user used any credit rules?
			return CreditsGranted.userHasHistory(user_id)
				.then(ct=>{
					if (ct[0].count == 0){
						rule_num = 1; // user is not in table; start with 1st rule
					} else {
						// get next rule
						return CreditRules.nextUserRule(user_id)
							.then( nr=>{
								if (nr[0]){
									rule_num = nr[0].rule_order;
								} else {
									rule_num = 0;
								}
							})
					}	
				})
				.then( ()=>{
					if (rule_num > 0){
						// is user eligible for next rule?
						return CreditRules.userEligibleForRule(user_id,rule_num,CreditsGranted)
							.then(ue =>{
								var eligible = ue[0].result;
								//if user is eligible for next rule
								if (eligible){
									// get the rule
									return CreditRules.findOne({
										where:{rule_order:rule_num}
									})
										.then( rule=>{	
											// add new CreditsGranted
											return CreditsGranted.create({
												amount_used: rule.benchmark,
												credit_given: rule.gain,
												user_id: user_id,
												rule_id: rule.id
											});	
										});
								}							
							})
					}	
				})
		}

	};
};