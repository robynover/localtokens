<bookmark>
	<div title="bookmark this">
		<i class="fa fa-bookmark-o" aria-hidden="true" onclick={toggleMark} ref="icon"></i>
	</div>

	<script>
	this.id = opts.id;
	//this.bookmarked = false;
	self = this;

	this.toggleMark = function(e){
		var url;
		if (this.bookmarked){
			// turn off
			url = '/api/bookmark/remove';
			this.refs.icon.className = "fa fa-bookmark-o";
		} else {
			// turn on
			url = '/api/bookmark/add';
			this.refs.icon.className = "fa fa-bookmark";
		}
		var params = 'post_id=' + this.id;

		var http = new XMLHttpRequest();
		http.open("POST", url, true);
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    http.send(params);

	    http.onreadystatechange = function() {
	    	if(http.readyState == 4 && http.status == 200) {
	    		var data = JSON.parse(http.responseText);
	            if (data.success){
	            	if (self.bookmarked){
	            		self.bookmarked = false;
	            	} else {
	            		self.bookmarked = true;
	            	}
	            } 
	        }
	    }
	};

	this.on('mount',function(){
		// check if the bookmark is on or off
		var http = new XMLHttpRequest();
		var url = '/api/bookmark/' + self.id + '/status';
	    http.open("GET", url, true);
	    http.send();

	    http.onreadystatechange = function() {
	    	if(http.readyState == 4 && http.status == 200) {
	    		var data = JSON.parse(http.responseText);
	            if (data.active){	
	            	self.bookmarked = true;
	            	self.refs.icon.className = "fa fa-bookmark";
	            } else {
	            	self.bookmarked = false;
	            	self.refs.icon.className = "fa fa-bookmark-o";
	            }
	        }
	    }
	});

	</script>


</bookmark>
