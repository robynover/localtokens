riot.tag2('photo-editable', '<div class="{opts.imgclass}"> <div id="photo-upload" if="{formDisplay}"> <p><strong>Upload Photo</strong></p> <input type="file" name="photo" id="photo-file" ref="photo"><br> <p>File must be less than 4MB</p> <button onclick="{upload}">Upload</button> <p><a href="#" onclick="{hideForm}">Cancel</a></p> </div> <div class="edit-overlay"> <i class="fa fa-pencil" aria-hidden="true" onclick="{showForm}"></i> </div> <img riot-src="{src}" if="{imgDisplay}"> </div>', 'photo-editable .edit-overlay,[data-is="photo-editable"] .edit-overlay{ position: absolute; opacity: .5; background-color: #fff; border:1px solid #fff; text-align: center; visibility: hidden; } photo-editable .fa-pencil,[data-is="photo-editable"] .fa-pencil{ font-size: 3rem; cursor: pointer; } photo-editable #photo-upload,[data-is="photo-editable"] #photo-upload{ border: 1px solid #cecece; }', '', function(opts) {
	this.src = opts.src;
	this.formDisplay = false;
	this.imgDisplay = true;

	this.on('mount',function(){
		$('img').on('load',function(){
			var w = $('img').width();
			var h = $('img').height();
			$('.edit-overlay').css('width',w);

		});
		$('img, .fa-pencil').on('mouseover',function(){
			$('.edit-overlay').css('visibility','visible');
		});
		$('.edit-overlay').on('mouseout',function(){
			$('.edit-overlay').css('visibility','hidden');
		});

	});

	this.showForm = function(){
		this.formDisplay = true;

	}.bind(this)

	this.hideForm = function(e){
		e.preventDefault();
		this.formDisplay = false;
		this.imgDisplay = true;

	}.bind(this)

	this.upload = function(e){
		e.preventDefault();
		var data = new FormData();

		var file = this.refs.photo;
		console.log(file);

	}.bind(this)

});