riot.tag2('item-list', '<h4>{listTitle}</h4> <ul class="{type}" if="{items}"> <li each="{items}"><a href="{⁗/community/post/⁗ + _id}">{title}</a></li> </ul> <p hide="{items}">None yet</p>', '', '', function(opts) {
		this.listTitle = opts.type.charAt(0).toUpperCase() + opts.type.slice(1);
		this.type = opts.type;
		this.username = opts.username;
		this.items = null;

		var self = this;

		this.on('mount',function(){
			var http = new XMLHttpRequest();
		    var url = "/api/items/" + self.type + "/" + self.username;
		    http.open("POST", url, true);

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

});