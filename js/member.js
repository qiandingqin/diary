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
		var moneyDom = document.getElementById("money");
		var money = JSON.parse(localStorage.getItem('selfUserInfo')) || {};
		money = money.money || 0;
		moneyDom.innerText = money;
		
		//监听更新
		window.addEventListener('update',function(){
			getCurUserInfo(function(res){
				window.localStorage.setItem('selfUserInfo',JSON.stringify(res.data));
				moneyDom.innerText = res.data.money;
			});
		});
		
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
			require.async('wang_payment.js',function(){
				//测试支付地址
				var alipayHost = API.ALIPAY;
				var wxpayHost = 'http://demo.dcloud.net.cn/payment/wxpayv3.HBuilder/?total=0.01';
				var subJson = {
					"data[subject]" : '达人日记',
					"data[total_fee]" : v.money,
					"data[body]" : '达人日记红币充值',
					"data[pay_type]" : v.paymentMehtod == 'alipay'?'alipay':'wechat'
				};
				//配置支付插件
				var config = {
					"address":v.paymentMehtod == 'alipay'?alipayHost:wxpayHost,
					"paymentMethod":v.paymentMehtod,
					"data":subJson,
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
					mui.toast('支付成功');
					//通知钱包界面更新数据
					mui.plusReady(function(){
						
						var targetView = plus.webview.getWebviewById('wallet');
						
						if(targetView){
							
							mui.fire(targetView,'update');
							
						};
						
					});
				};
				
				//支付失败
				function errorCallback(err){
					mask.close();
					mui.toast('支付失败');
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