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
				amount : 0,
				paymentMehtod : ''
			},
			methods : {
				payBtn : payBtn
			}
		};
		var v = require('newvue').methods.vue(vOption);
		
		//监听付款方式
		var paymentMethods = v.$el.querySelector('.mui-table-view-radio');
		paymentMethods,addEventListener('selected',function(e){
			v.paymentMehtod = e.target.dataset.payment;
		});
		
		
		//充值按钮
		function payBtn(){
			var mask = new Mask();
			mask.show();
			//引入html5plus_payment组件
			require.async('wang_payment.min.js',function(){
				//测试支付地址
				var alipayHost = 'http://demo.dcloud.net.cn/payment/alipay/?total=0.01';
				var wxpayHost = 'http://demo.dcloud.net.cn/payment/wxpayv3.HBuilder/?total=0.01';
				//配置支付插件
				var config = {
					"address":v.paymentMehtod == 'alipay'?alipayHost:wxpayHost,
					"paymentMethod":v.paymentMehtod,
					"success":successCallback,
					"error":errorCallback
				}
				//初始化支付插件
				var payment = new Payment(config);
				//支付
				payment.PaymentShow();
				
				//支付成功
				function successCallback(){
					mask.close();
					alert('支付成功');
				};
				
				//支付失败
				function errorCallback(){
					mask.close();
					alert('支付失败，在控制台返回了信息')
				};
			});
		};
		
	};
	
});