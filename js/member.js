define(function(require, exports, module){
	//其他控制器
	exports.methods = {
		//提供调用接口
		member:member,
		wallet:wallet,
		recharge:recharge,
		friend_diary:friend_diary,
		mydiary:mydiary,
		diary_draft:diary_draft
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
		var vOption = { 
			data : {datas : []},
			methods : {
				edit : edit,
				remove : remove
			}
		};
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
						result.data[i].content_old = item.content;
						result.data[i].content = item.content.replace('&&__&&','');
					});
					v.datas = result.data;
				},
				error : function(){
					mask.close();
				}
			});
		};
		
		//编辑日记
		function edit(d){
			var content = d.content_old.split('&&__&&');
			var imgArr;
			if(d.images){
				if(d.images.indexOf(',') != -1){
					imgArr = d.images.split(',');
				}else{
					imgArr = [d.images];
				};
			}else{
				imgArr = [];
			};
			var paramsJson = {
				title : d.title,
				date :  $.getTimes(d.created_at).timerStr.split(' ')[0],
				weatherArr : WEATHER,
				weather : d.weather,
				moodArr : MOOD,
				mood : d.feeling,
				fontArr:FONT,
				font:d.font,
				content1:content[0] || '',
				content2:content[1] || '',
				template:d.template,
				permit : d.permit,
				push : d.push,
				images : imgArr,
				id : d.id
			};
			openView({
				url : '../other/add_diary.html',
				data : { type : 'edit' , data : JSON.stringify(paramsJson) }
			});
		};
		//删除日记
		function remove(id,index){
			var _this = this;
			mui.confirm('确定删除这篇日记吗？','提示',['否','是'],function(e){
				if(!e.index)return;
				var mask = new Mask();
				mask.show();
				$.ajax({
					url : API.REMOVEDIARY + '&id=' + id,
					type : 'post',
					success:function(res){
						mask.close();
						mui.toast(res.data);
						if(res.success){
							_this.datas.removeItem(index);
						};
					},error:function(){
						mask.close();
					}
				});
				
			});
		};
		
	};
	//保存日记
	function diary_draft(){
		var datas = JSON.parse(localStorage.getItem('diarySave')) || {};
		var vOption = { data : {datas : datas} };
		var v = require('newvue').methods.vue(vOption);
		
		//监听更新
		window.addEventListener('update',function(){
			datas = JSON.parse(localStorage.getItem('diarySave')) || {};
			v.datas = datas;
		});
		
	};
	
});