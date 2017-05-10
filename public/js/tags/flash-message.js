riot.tag2('flash-message', '<div class="flash">{msg} </div>', '', '', function(opts) {
		this.msg = opts.content;
		var self = this;

		opts.observable.on('done',function(msg){
			self.msg = msg;
			self.update();

		})
});