<number-edit>

	<span ref="num" onkeypress= {submit} >{number}</span> 
	<a href="#" onclick={ toggleEditable }><i class="fa fa-pencil" aria-hidden="true"></i></a>

	<style>
		:scope .fa-pencil{
			visibility: hidden;
		}
		:scope:hover .fa-pencil{
			visibility: visible;
		}
		input{
			width: 3rem;
		}
		span.highlight{
			background-color: yellow;
			font-weight: bold;
		}

	</style>

	<script>
		this.number = opts.number;
		this.url = opts.url;
		this.showField = false;
		this.userid = opts.userid;

		if (this.userid){
			var parts = this.url.split('[id]');
			this.url = parts[0] + this.userid + parts[1];
		}

		var self = this;



		this.toggleEditable = function(e){
			e.preventDefault();
			if (!this.showField){
				var field = document.createElement("input");
				field.value = this.number;
				field.setAttribute("id", "numfield");
				this.refs.num.innerHTML = '';
				this.refs.num.appendChild(field);
				this.showField = true;
			} else {
				this.removeField();
				this.changeNum(); // save it
			}
			
		}

		this.removeField = function(){
			var field = document.getElementById('numfield');
			this.number = field.value;
			this.refs.num.removeChild(field);
			this.refs.num.innerHTML = this.number;
			this.showField = false;
		}

		this.submit = function(e){
			if (e.which == 13){ //return key
				this.removeField();
				this.changeNum();
			}
		}

		this.changeNum = function(){
			// indicate changing
			this.refs.num.setAttribute('class','highlight');

			 
			var http = new XMLHttpRequest();
			var params = 'num=' + this.number;
		    http.open("POST", this.url, true);

		    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			http.send(params);

			http.onreadystatechange = function() {
			    if(http.readyState == 4 && http.status == 200) {
			    	var response = JSON.parse(http.responseText);
			        if (response.success){
			   			//console.log('success');
			   			self.refs.num.setAttribute('class','');
			        }
			    }
			}
		}


	</script>

</number-edit>