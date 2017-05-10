riot.tag2('confirm', '<div class="outerwrap"> <div class="wrap"> {opts.question} <br> <button onclick="{yes}">Yes</button> <button onclick="{no}">No</button> </div> </div>', 'confirm,[data-is="confirm"]{ position:absolute; top:50%; width: 100%; } confirm .outerwrap,[data-is="confirm"] .outerwrap{ text-align: center; } confirm .wrap,[data-is="confirm"] .wrap{ background-color: #fff; display:inline-block; padding: 1rem; border: 1px solid #cecece; }', '', function(opts) {
	this.observable = opts.observable;
	this.id = opts.id;

	this.yes = function(){
		this.observable.trigger('yes',this.id);
		this.unmount(true);
	}.bind(this)
	this.no = function(){

		this.unmount(true);
	}.bind(this)

});