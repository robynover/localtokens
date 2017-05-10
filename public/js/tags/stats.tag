<stats>
	<div><span class="num" ref="exchanges"></span> <span ref="eword">exchanges</span></div>
	<div>with <span class="num" ref="people"></span> <span ref="pword">people</span></div>

	<style>
		.num{
			font-weight: bold;
		}
	</style>

	<script>
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

	</script>

</stats>