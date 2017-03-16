define(function(require, exports, module){
	//其他控制器
	exports.methods = {
		//提供调用接口
		member:member,
		wallet:wallet,
		recharge:recharge
	};
	
	function member(){
		
	};
	
	//我的钱包
	function wallet(){
		
	};
	
	//充值
	function recharge(){
		
		//引入vue
		var vOption = {
			data : {
				money : null,
				amount : 0
			}
		};
		var v = require('newvue').methods.vue(vOption);
		
		
	};
	
});