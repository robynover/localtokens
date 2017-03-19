// For setting up the db //

// use .sync({force:true}) to delete any current table by the same name

// create User table 
User.sync().then(function () {
	console.log('user sync');
	// create Coin table and 1 coin record
	Coin.sync({force:true}).then(function() {
		console.log('coin sync');
	  	Coin.create({});
	  	// create ledger table
	  	Ledger.sync({force:true}).then(function() {
	  		console.log('ledger sync');
	  	});
	});
});

// create users
const hash = crypto.createHmac('sha256', Config.salt)
                   .update('opal123')
                   .digest('hex');
User.bulkCreate([{
	username: 'robyn',
	password: hash
},
{
	username: 'bobby',
	password: hash
}]).then(u=>{
	console.log(u);
});

