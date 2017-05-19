riot.tag2('number-edit', '<span ref="num" onkeypress="{submit}">{number}</span> <a href="#" onclick="{toggleEditable}"><i class="fa fa-pencil" aria-hidden="true"></i></a>', 'number-edit .fa-pencil,[data-is="number-edit"] .fa-pencil{ visibility: hidden; } number-edit:hover .fa-pencil,[data-is="number-edit"]:hover .fa-pencil{ visibility: visible; } number-edit input,[data-is="number-edit"] input{ width: 3rem; } number-edit span.highlight,[data-is="number-edit"] span.highlight{ background-color: yellow; font-weight: bold; }', '', function(opts) {
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
				this.changeNum();
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
			if (e.which == 13){
				this.removeField();
				this.changeNum();
			}
		}

		this.changeNum = function(){

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

			   			self.refs.num.setAttribute('class','');
			        }
			    }
			}
		}

});