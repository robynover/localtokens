riot.tag2('balance', '<h5 if="{opts.header == ⁗true⁗}">Balance</h5> <div class="bal" ref="bal"></div>', 'balance,[data-is="balance"]{ text-align: center; } balance .bal,[data-is="balance"] .bal{ font-size: 4rem; }', '', function(opts) {
	var self = this;

	this.on('mount',function(){
		var http = new XMLHttpRequest();
		var username = opts.username;
		var url = '/api/user/' + username + '/balance';
	    http.open("GET", url, true);

	    http.send();

	    http.onreadystatechange = function() {
	    	if(http.readyState == 4 && http.status == 200) {
	    		var data = JSON.parse(http.responseText);
	            if (data.success){
	            	if (!data.balance){
	            		data.balance = "0";
	            	}
	            	self.refs.bal.innerHTML = data.balance;
	            } else {

	            }
	        }
	    }
	});

});