<user-field>
	<div class="wrap">
		<input type="text" name={opts.name} placeholder="username" id="receiver" ref="username" onblur={findUser} >
		<div class="field-validation" ref="feedback"></div>
	</div>
	
	<style>
		:scope{
			display:block;
			float:left;
			width: 100%;
		}
		input{
			float:left;
		}
		.field-validation{
			float:left;
			line-height: 3.5rem;
		}
	</style>

	<script>

	var self = this;
	this.on('mount',function(){
		if (opts.to){
			this.refs.username.value = opts.to;
			this.refs.username.focus();
		}
	});
	

	this.findUser = function(){
		var http = new XMLHttpRequest();
		var username = this.refs.username.value
		var url = '/api/user/' + username + '/exists';
	    http.open("POST", url, true);

	    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	    http.send();

	    http.onreadystatechange = function() {
	    	if(http.readyState == 4 && http.status == 200) {
	        	console.log(http.responseText);
	            if (JSON.parse(http.responseText).success){	
	            	self.refs.feedback.innerHTML = '<i class="fa fa-check-circle" aria-hidden="true"></i>';
	            	self.refs.feedback.classList.remove('error');
	            	self.refs.feedback.classList.add('success');
	            } else {
	            	self.refs.feedback.innerHTML = 'User not found';
	            	self.refs.feedback.classList.remove('success');
	            	self.refs.feedback.classList.add('error');
	            }
	        }
	    }
	}

	</script>

</user-field>