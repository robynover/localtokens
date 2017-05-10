riot.tag2('items', '<h1>Items {item_type}</h1> <ul> <li each="{items}"> {description}&nbsp;<a id="item_{id}" href="#" class="del" onclick="{delete}"><i class="fa fa-times" aria-hidden="true"></i></a> </li> </ul> <form onsubmit="{add}"> <input ref="input"> <button>Add</button> </form> <p>{success}</p>', 'items,[data-is="items"]{ display: block } items li,[data-is="items"] li{ list-style-type: none; } items a.del,[data-is="items"] a.del{ visibility: hidden; } items li:hover a.del,[data-is="items"] li:hover a.del{ visibility: visible; }', '', function(opts) {
		this.items = opts.items;
		this.success = '';
		var self = this;

		if (opts.item_type.toLowerCase() == 'offering'){
			this.item_type = 'Offering';
		} else {
			this.item_type = 'Seeking';
		}

		this.add = function(e) {
		  e.preventDefault();
		  if (this.refs.input.value.length > 0) {

		    var http = new XMLHttpRequest();
		    var url = "/api/user/item/new";
		    var params = 'type='+this.item_type.toLowerCase()+'&description='+this.refs.input.value;
		    var item = this.refs.input.value;
		    this.refs.input.value = '';

		    http.open("POST", url, true);

		    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			http.send(params);

		    http.onreadystatechange = function() {
		        if(http.readyState == 4 && http.status == 200) {
		            console.log(http.responseText);
		            if (JSON.parse(http.responseText).success){
		            	self.success = "Item added";
		            	console.log(self);
		            	self.items.push({
		            		description: item,
		            		id: JSON.parse(http.responseText).item_id
		            	});
		            	self.update();
		            }
		        }
		    }

		  }
		}.bind(this)

		this.delete = function(e){
			e.preventDefault();
			var li = e.target.parentNode.parentNode;

			this.update();
		}.bind(this)

});