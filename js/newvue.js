define(function(require,exports,module){
	
	function newVue(option){
		var v = new Vue({
			el : option.el || '.mui-content',
			data : option.data || {},
			methods : option.methods || {},
			//初始化完成
			beforeCreate : function(){
				if(option.cycle){
					option.cycle.beforeCreate&&option.cycle.beforeCreate.call(this);
				};
			},
			//创建完成
			created : function(){
				if(option.cycle){
					option.cycle.created&&option.cycle.created.call(this);
				};
			},
			//数据更新
			updated:function(){
				disposeA();
				if(option.cycle){
					option.cycle.updated&&option.cycle.updated.call(this);
				};
			}
		});
		//监听所有A，.open标签
		disposeA();
		return v;
	};
	exports.methods = {
		vue : newVue
	};
	
});

