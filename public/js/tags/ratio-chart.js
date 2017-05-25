riot.tag2('ratio-chart', '<div class="ratio"> <div class="part earned-part" ref="earned">&nbsp;</div><div class="part spent-part" ref="spent">&nbsp;</div> <div>Incoming: {earned} | Outgoing: {spent}</div> </div>', 'ratio-chart .part,[data-is="ratio-chart"] .part{ display:inline-block; height: 4rem; } ratio-chart .earned-part,[data-is="ratio-chart"] .earned-part{ background-color: #50b6d6; } ratio-chart .spent-part,[data-is="ratio-chart"] .spent-part{ background-color: #1d434e; }', '', function(opts) {
		this.spent = parseInt(opts.spent);
		this.earned = parseInt(opts.earned);
		this.size = parseInt(opts.size);
		var self = this;

		this.init = function(){
			if (!this.spent){
				this.spent = 0;
			}
			if (!this.earned){
				this.earned = 0;
			}
			this.total = this.spent + this.earned;
			this.unit = this.size / this.total;
			this.spentSize = Math.round(this.unit * this.spent);
			this.earnedSize = Math.round(this.unit * this.earned);
		}

		this.init();

		this.on('mount',function(){
			self.refs.earned.style.width = this.earnedSize + 'px';
			self.refs.spent.style.width = this.spentSize + 'px';
		});

});