riot.tag2('edit-msg', '<div id="editmodal"> <p class="modalclose"> <a onclick="{close}" href="#" class="close"> <i class="fa fa-times-circle-o" aria-hidden="true"></i> </a> </p> <div class="thumb" if="{thumb}" ref="thumb"> <img riot-src="{thumb}"> <p><a href="#" onclick="{removePhoto}">Remove</a></p> </div> <div class="type-selector"> <input type="radio" name="type" value="offering" ref="ptype" checked="{ptype == \'offering\'}"> Offering &nbsp;&nbsp;<input type="radio" name="type" value="seeking" ref="ptype" checked="{ptype == \'seeking\'}"> Seeking </div> <div id="photo-upload"> <p><strong>Photo</strong></p> <div class="upload-details"> <input type="file" name="photo" id="photo-file" ref="photo"><br> <p>File must be less than 4MB</p> </div> </div> <input type="text" name="title" riot-value="{title}" ref="title"> <textarea name="message" ref="message">{content}</textarea> <input type="text" name="contact" riot-value="{contact}" ref="contact"> <button onclick="{save}">Save</button> <div class="error">{feedback}</div> </div>', 'edit-msg button,[data-is="edit-msg"] button{ float:left; } edit-msg .error,[data-is="edit-msg"] .error{ float:left; line-height: 3.5rem; margin-left: 1.5rem; } edit-msg #photo-upload,[data-is="edit-msg"] #photo-upload{ float:left; } edit-msg .thumb,[data-is="edit-msg"] .thumb{ float:left; width: 100px; text-align: center; font-size: 75%; } edit-msg .type-selector input,[data-is="edit-msg"] .type-selector input{ display: inline; }', '', function(opts) {
	this.id = opts.id;
	this.content = opts.content;
	this.title = opts.title;
	this.contact = opts.contact;
	this.observable = opts.observable;
	this.removeImg = false;
	this.thumb = opts.thumb;
	this.ptype = opts.type;
	var self = this;

	this.close = function(e){
		e.preventDefault();
		this.unmount(true);
	}
	this.removePhoto = function(e){
		e.preventDefault();
		this.refs.thumb.style.visibility = 'hidden';
		this.removeImg = true;
	}

	this.getType = function(){
		for (var i in this.refs.ptype){
			if (this.refs.ptype[i].checked){
				this.ptype = this.refs.ptype[i].value;
				return this.refs.ptype[i].value;
			}
		}
	}

	this.save = function(e){
		e.preventDefault();
		var data = new FormData();

		if (!self.refs.message.value){
			this.feedback = 'Body cannot be empty';
			return;
		}
		if (!self.refs.title.value){
			this.feedback = 'Title cannot be empty';
			return;
		}
		if (!self.refs.contact.value){
			this.feedback = 'Contact info cannot be empty';
			return;
		}

		data.append('message', self.refs.message.value);
		data.append('title', self.refs.title.value);
		data.append('contact', self.refs.contact.value);
		data.append('remove', self.removeImg);
		data.append('type', self.getType() );

		if (self.refs.photo.value){
			var file = self.refs.photo.files[0];
			data.append('photo',file);
		}

		var http = new XMLHttpRequest();
	    http.open("POST", '/api/post/edit/' + self.id, true);
		http.send(data);

	    http.onreadystatechange = function() {
	        if(http.readyState == 4 && http.status == 200) {
	        	var reply = JSON.parse(http.responseText);
	            if (reply.success){
	            	var obj = {};
	            	obj.body = self.refs.message.value;
	            	obj.title = self.refs.title.value;
	            	obj.contact = self.refs.contact.value;
	            	obj.type = self.ptype;
	            	if (self.refs.photo.value){
	            		obj.photo = reply.photo;
	            		obj.thumb = reply.thumb;
	            	}
	            	if (self.removeImg){
	            		obj.remove = true;
	            	}
	            	self.observable.trigger('done',obj);
	            	self.unmount(true);
	            }
	        }
	    }
	}

});