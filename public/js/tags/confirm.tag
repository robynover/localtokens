<confirm>

	<div class="outerwrap">
		<div class="wrap">
			{opts.question} <br>
			<button onclick={ yes }>Yes</button> 
			<button onclick={ no }>No</button>
		</div>
	</div>

	<style>
		:scope{
			position:absolute;
			top:50%;
			width: 100%;
		}
		.outerwrap{
			text-align: center;		
		}
		.wrap{
			background-color: #fff;
			display:inline-block;
			padding: 1rem;
    		border: 1px solid #cecece;
		}

	</style>


	<script>
	this.observable = opts.observable;
	this.id = opts.id;

	yes(){
		this.observable.trigger('yes',this.id);
		this.unmount(true);
	}
	no(){
		//this.observable.trigger('no');
		this.unmount(true);
	}


	</script>


</confirm>