<flash-message>
	<div class="flash">{ msg } </div>

	<script>
		this.msg = opts.content;
		var self = this;

		opts.observable.on('done',function(msg){
			self.msg = msg;
			self.update();

		})
	</script>

</flash-message>