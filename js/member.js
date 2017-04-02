define(function(require, exports, module){
	//其他控制器
	exports.methods = {
		//提供调用接口
		member:member,
		wallet:wallet,
		recharge:recharge,
		friend_diary:friend_diary,
		mydiary:mydiary
	};
	
	function member(){
		var vOption = {
			data : {user : JSON.parse(localStorage.getItem('selfUserInfo'))}
		};
		
		var v = require('newvue').methods.vue(vOption);
		
		//监听修改头像操作
		window.addEventListener('update',function(){
			v.user = JSON.parse(localStorage.getItem('selfUserInfo'));
		});
		
	};
	
	//我的钱包
	function wallet(){
		
	};
	
	//我的日记
	function mydiary(){
		friend_diary(true);
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
	
	//查询某用户的日记列表
	function friend_diary(isMember){
		
		var parameter = $.getUrlData();
		var userId = isMember?localStorage.getItem('id'):parameter.id;
		var userName = decodeURI(parameter.username);
		//设置头部
		if(!isMember)mui('#user')[0].innerText = userName;
		//引入vue
		var vOption = { data : {datas : []} };
		var v = require('newvue').methods.vue(vOption);
		var mask = new Mask();
		mask.show();
		//获取日记列表
		getDiaryList();
		
		//监听更新
		window.addEventListener('update',getDiaryList);
		
		function getDiaryList(){
			$.ajax({
				url:API.DIARYCIRCLE,
				data : {"search[user_id]" : userId,'sort':'-created_at'},
				success:function(result){
					mask.close();
					if(!result.success)return;
					mui.each(result.data,function(i,item){
						result.data[i].m = new Date(item.created_at * 1000).getMonth() + 1;
						result.data[i].d = new Date(item.created_at * 1000).getDate();
					});
					v.datas = result.data;
				},
				error : function(){
					mask.close();
				}
			});
		};
	};
	
});