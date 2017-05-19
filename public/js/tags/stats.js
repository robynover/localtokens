riot.tag2('stats', '<div class="stats-container"> <div class="line1">&nbsp;</div> <div class="num" ref="exchanges"></div> <div ref="eword" class="line2">exchanges</div> </div> <div class="stats-container"> <div class="line1">with</div> <div class="num" ref="people"></div> <div ref="pword" class="line2">people</div> </div>', 'stats .num,[data-is="stats"] .num{ font-size: 4rem; } stats .line1,[data-is="stats"] .line1,stats .line2,[data-is="stats"] .line2{ text-transform: uppercase; } stats .line1,[data-is="stats"] .line1{ font-size: 80%; } stats .stats-container,[data-is="stats"] .stats-container{ width: 48%; float:left; }', '', function(opts) {
	var self = this;
	var eword = 'exchanges';
	var pword = 'people';

	this.on('mount',function(){
		var http = new XMLHttpRequest();
		var username = opts.username;
		var url = '/api/user/' + username + '/stats';
	    http.open("GET", url, true);

	    http.send();

	    http.onreadystatechange = function() {
	    	if(http.readyState == 4 && http.status == 200) {
	    		var data = JSON.parse(http.responseText);
	            if (data.success){
	            	self.refs.exchanges.innerHTML = data.transactions;
	            	self.refs.people.innerHTML = data.people;
	            	if (data.transactions == 1){
	            		eword = 'exchange';
	            	}
	            	if (data.people == 1){
	            		pword = 'person';
	            	}
	            	self.refs.eword.innerHTML = eword;
	            	self.refs.pword.innerHTML = pword;
	            }
	        }
	    }
	});

});