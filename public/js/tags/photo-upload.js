riot.tag2('photo-upload', '<p class="edit-photo"><i class="fa fa-pencil" aria-hidden="true" onclick="{toggleForm}"></i></p> <div id="user-photo-upload" show="{formVisible}"> <input type="file" name="profilephoto" id="user-photo-file" ref="photo"><br> <p>File must be less than 4MB</p> <button ref="button" onclick="{upload}">Upload</button> </div>', '', '', function(opts) {

	this.formVisible = false;
	this.url = opts.url;
	this.observable = opts.observable;

	var self = this;

	this.toggleForm = function(){
		if (this.formVisible == true){
			this.formVisible = false;
		} else {
			this.formVisible = true;
		}
	}
	this.upload = function(e){
		e.preventDefault();
		self.refs.button.innerHTML = '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>';
		var data = new FormData();
		var file = self.refs.photo.files[0];
		data.append('photo',file);

		var http = new XMLHttpRequest();
		http.open("POST", self.url, true);
		http.send(data);

		http.onreadystatechange = function() {
		    if(http.readyState == 4 && http.status == 200) {
		    	var reply = JSON.parse(http.responseText);
		        if (reply.success){
		        	self.formVisible = false;
		        	self.update();
		        	self.refs.button.innerHTML = 'Upload';
		        	self.observable.trigger('done',reply.path);
		        }
		    } else {
		    	console.log(http.responseText);
		    	console.log('error');
		    }
		}
	}

});