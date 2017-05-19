<general-item-list>
	<h6>{ listTitle }</h6>
	<ul class={type} if={items}>
		<li each={ items }><a href={"/community/post/" + _id } >{ title }</a> &mdash;
		 <a href={"/user/profile/" + username}>{username}</a></li>
	</ul>
	<p hide={items}>None yet</p>

	<script>
		//this.listTitle = opts.type.charAt(0).toUpperCase() + opts.type.slice(1);
		if (opts.type == 'offering'){
			this.listTitle = "Offers";
		} else {
			this.listTitle = "Requests";
		}
		this.type = opts.type;
		this.items = null;

		var self = this;

		this.on('mount',function(){
			var http = new XMLHttpRequest();
		    var url = "/api/items/" + self.type;
		    http.open("GET", url, true);

		    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			http.send();

			http.onreadystatechange = function() {
			    if(http.readyState == 4 && http.status == 200) {
			    	var response = JSON.parse(http.responseText);
			        if (response.success){
			   			self.items = response.items;
			   			self.update();
			        }
			    }
			}
		});

	</script>

</general-item-list>