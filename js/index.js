define(function(require, exports, module){
	
	exports.methods = {
		index : index,
		guide : guide,
		search_friend : search_friend,
		msg : msg,
		friend_info : friend_info,
		msg_im : msg_im,
		friends:friends
	};
	//启动引导页面
	function guide(){
		var openBtn = document.getElementById("openBtn");
		//引导页立即体验按钮
		openBtn.addEventListener('tap',function(){
			var link = '../other/login.html';
			//判断是否登录状态
			if(isLogin())link = './index.html';
			openView({url : link},fireCloseView);
		});
	};
	
	//首页
	function index(){
		var mask = new Mask();
		//启用双击退出
		doubleBack();
		//渲染数据
		var vOption = { data : {datas : []} };
		//引入vue
		var v = require('newvue').methods.vue(vOption);
		
		//监听刷新数据事件
		window.addEventListener('updateFriendsList',function(){
			pending(function(res){
				mui('#msgNum')[0].innerText = res.length;
			});
			getFriendsList(function(newArr){
				v.datas = newArr;
			});
		});
		//获取好友列表
		getFriendsList(function(newArr){
			v.datas = newArr;
			//开启更新查询
			require('update.js').methods.up();
			
		});
		//获取待处理好友列表 修改头部消息通知数量
		pending(function(res){
			mui('#msgNum')[0].innerText = res.length;
		});
		
		//获取当前用户信息保存下来，方便以后使用
		getUserInfo(localStorage.getItem('id'),function(res){
			res.data.head_img = res.data.head_img?HOST + res.data.head_img:'';
			window.localStorage.setItem('user_avatar',res.data.head_img);
			window.localStorage.setItem('user_nickname',res.data.nickname || res.data.username);
			window.localStorage.setItem('selfUserInfo',JSON.stringify(res.data));
		});
	};
	//查找笔友
	function search_friend(){
		
		var vOption = {
			data : {datas : [],search_input:''},
			methods : {searchBtn : searchBtn , sendAddFriend : sendAddFriend}
		};
		//引入vue
		var v = require('newvue').methods.vue(vOption);
		//连续输入间隔 700毫秒发起查询
		v.$watch('search_input',function(newVal,oldVal){
			//判断变化的值是否为合法手机号 是则查询
			if($.regExp('phonecode',newVal)){
				search(newVal);
			};
		});
		
		//软键盘搜索按钮
		function searchBtn(ev){
			if(ev.keyCode === 13){
				search(v.search_input);
			};
		};
		
		//添加好友
		function sendAddFriend(userid){
			addFriendId(userid,function(res){
				if(res.success){
					mui.toast('添加:好友成功,请等待对方验证');
				}else{
					mui.toast(res.data);
				}
			});
		};
		
		//查询笔友
		function search(user){
			var mask = new Mask();
			mask.show();
			//查询数据
			$.ajax({
				url:API.MEMBERINFO,
				data : {"search[mobile]":user},
				success:function(result){
					mask.close();
					//处理数据
					var dataArr = [];
					mui.each(result.data,function(i,item){
						dataArr.push({
							//昵称为空使用 手机号
							nickname :item.nickname || item.username,
							user : item.username,
							id : item.id,
							avatar : '../../images/avatar.png'
						});
					});
					
					v.datas = dataArr;
				},
				error : function(){
					mask.close();
				}
			});
		};
	};
	
	//处理添加好友消息 接收推送日记
	function msg(){
		var vOptionMsg = {
			data : {datas : []},
			methods : {yesBtn  : yesBtn,noBtn : noBtn}
		};
		//引入vue
		var vMsg = require('newvue').methods.vue(vOptionMsg);
		var mask = new Mask();
		mask.show();
		//获取待处理好友申请列表
		pending(function(res){
			console.log(res);
			mui.each(res,function(i,item){
				res[i].add_at = $.getTimes(item.add_at).timerStr;
				res[i].nickname = item.user.nickname || item.user.username;
				res[i].avatar = item.user.head_img?HOST + item.user.head_img:'';
				vMsg.datas.push(item);
			});
		},mask);
		
		//同意添加好友
		function yesBtn(uid,index){
			yesForNo('yes',uid,index);
		};
		//拒绝添加好友
		function noBtn(uid,index){
			yesForNo('no',uid,index);
		};
		
		//添加拒绝好友申请
		function yesForNo(type,uid,index){
			var mask = new Mask();
			mask.show();
			var url = type == 'yes'?API.ACCEPT:API.REFUSE;
			$.ajax({
				url:url,
				data : {id : uid},
				success:function(result){
					mask.close();
					if(result.success){
						mui.toast(result.data);
						vMsg.datas.removeItem(index);
						reloadFriendsList();
					};
				},
				error:function(){
					mask.close();
				}
			});
		};
		//刷新首页好友列表
		function reloadFriendsList(){
			mui.plusReady(function(){
				var indexView = plus.webview.getWebviewById('index');
				mui.fire(indexView,'updateFriendsList');
			});
		};
	};
	
	//查看用户信息
	function friend_info(){
		var parameter = $.getUrlData();
		var phone = parameter.user;
		var userId = parameter.id;
		var vOption = {
			data : {user : {}},
			methods : {
				addFirend : addFirend,
				deleteFirend : deleteFirend,
				addSubscribed : addSubscribed,
				cancelSubscribed : cancelSubscribed
			}
		};
		var v = require('newvue').methods.vue(vOption);
		
		//获取用户信息
		getUserInfo(userId,function(result){
			var avatar = result.data.head_img;
			result.data.head_img = avatar?HOST + avatar:'';
			v.user = result.data;
		});
		
		//绑定事件
		//添加笔友
		function addFirend(uid){
			addFriendId(uid,function(result){
				if(result.success)mui.toast('添加成功，等等对方验证');
			});
		};
		//删除笔友
		function deleteFirend(uid){
			deleteFriendId(uid,function(result){
				mui.toast(result.data);
				if(result.success){
					reloadFriendsList();
					mui.back();
				};
			});
		};
		//添加关注
		function addSubscribed(uid){
			var _this = this;
			addSubscribedId(uid,function(result){
				mui.toast(result.data);
				if(result.success){
					_this.user.is_subscribed = true;
				};
			});
		};
		//取消关注
		function cancelSubscribed(uid){
			var _this = this;
			cancelSubscribedId(uid,function(result){
				mui.toast(result.data);
				if(result.success){
					_this.user.is_subscribed = false;
				};
			});
		};
		//打开私信聊天
		var openImBtn = mui('.openim')[0];
		openImBtn.addEventListener('tap',function(){
			var dataJson = {
				userId : v.user.id,
				name : v.user.nickname || v.user.username,
				portraitUri : v.user.head_img
			};
			openView({url : 'msg_im.html' , data : dataJson});
		});
	};
	
	//已关注笔友列表
	function friends(){
		var vOption = {
			data : {datas : {}},
			cycle:{created : getList}
		};
		var v = require('newvue').methods.vue(vOption);
		
		//获取已关注笔友列表
		function getList(){
			var _this = this;
			var mask = new Mask();
			mask.show();
			$.ajax({
				url:API.GETSUB,
				success:function(result){
					mask.close();
					mui.each(result.data,function(i,item){
						var avatar = item.user.head_img;
						item.user.head_img = avatar?HOST + avatar:'';
					});
					_this.datas = result.data;
				},error:function(){
					mask.close();
				}
			});
		};
		
	};
	
	//IM聊天室 单聊
	function msg_im(){
		
		require.async('chat.js');
		
	};
})