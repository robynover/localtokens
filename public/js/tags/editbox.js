riot.tag2('editbox', '<div class="profile-text">{profile_text}</div> <p if="{isUser()}" class="edit-profile"> <a onclick="{toggle}" href="#"> <i class="fa fa-pencil" aria-hidden="true"></i> </a> </p> <div id="editmodal" show="{show_modal}"> <p class="modalclose"> <a onclick="{toggle}" href="#" class="close"> <i class="fa fa-times-circle-o" aria-hidden="true"></i> </a> </p> <textarea name="message" ref="message">{opts.profile_text}</textarea> <input type="hidden" name="id"> <button onclick="{save}">Save</button> </div>', '', '', function(opts) {
	this.profile_text = opts.profile_text;
	this.url = opts.url;
	this.show_modal = false;
	this.observable = opts.observable;

	var self = this;

	this.isUser = function(){
		if(opts.username == opts.profilename){
			return true;
		}
		return false;
	}

	this.toggle = function(e){
		e.preventDefault();
		if (this.show_modal == true){
			this.show_modal = false;
		} else {
			this.show_modal = true;
		}
	}

	this.save = function(){
		var http = new XMLHttpRequest();
	    http.open("POST", self.url, true);

	    params = "profile_text="+this.refs.message.value;

	    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		http.send(params);

	    http.onreadystatechange = function() {
	        if(http.readyState == 4 && http.status == 200) {
	            if (JSON.parse(http.responseText).success){
	            	self.show_modal = false;
	            	self.profile_text = self.refs.message.value;
	            	self.update();
	            	self.observable.trigger('done','Updated Successfully');
	            }
	        }
	    }
	}

});