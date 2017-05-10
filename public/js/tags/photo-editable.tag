<photo-editable>

	<div class={ opts.imgclass }>
		<div id="photo-upload" if={formDisplay}>
			<p><strong>Upload Photo</strong></p>
			<input type="file" name="photo" id="photo-file" ref="photo"><br>
			<p>File must be less than 4MB</p>
			<button onclick={ upload } >Upload</button>
			<p><a href="#" onclick={ hideForm }>Cancel</a></p>
		</div>
		<div class="edit-overlay">
			<i class="fa fa-pencil" aria-hidden="true" onclick={ showForm }></i>
		</div>
		<img src={ src } if={imgDisplay} >
	</div>
	

	<style>
		.edit-overlay{
			position: absolute;
			opacity: .5;
			background-color: #fff;
			border:1px solid #fff;
			text-align: center;
			visibility: hidden;
		}
		
		.fa-pencil{
			font-size: 3rem;
			cursor: pointer;
		}

		#photo-upload{
			border: 1px solid #cecece;
		}

	</style>

	<script>
	this.src = opts.src;
	this.formDisplay = false;
	this.imgDisplay = true;

	this.on('mount',function(){
		$('img').on('load',function(){
			var w = $('img').width();
			var h = $('img').height();
			$('.edit-overlay').css('width',w);
			//$('.edit-overlay').css('height',h);
			//$('.edit-overlay').css('line-height',h+'px');
		});
		$('img, .fa-pencil').on('mouseover',function(){
			$('.edit-overlay').css('visibility','visible');
		});
		$('.edit-overlay').on('mouseout',function(){
			$('.edit-overlay').css('visibility','hidden');
		});

	});
	
	showForm(){
		this.formDisplay = true;
		//this.imgDisplay = false;
		//this.update();
	}

	hideForm(e){
		e.preventDefault();
		this.formDisplay = false;
		this.imgDisplay = true;
		//this.update();
	}

	upload(e){
		e.preventDefault();
		var data = new FormData();
		//var file = $('#photo-file').get(0).files[0];
		var file = this.refs.photo;
		console.log(file);

		/*data.append('photo',file);
		
		var reader = new FileReader();
		reader.readAsText(file, 'UTF-8');
		reader.onload = function(event){
		    var fileName = file.name; 
		    $.ajax({
		        url:'/api/user/photo',
		        method:'POST',
		        contentType: false,
		        processData: false,
		        data: data
		    }).done(function(data){
		        loadProfilePhoto();
		        $('#user-photo-upload').hide();
		        //remove spinner
		        $('#user-photo-upload button').html('Upload');
		    })
		};*/

	}

	</script>



</photo-editable>