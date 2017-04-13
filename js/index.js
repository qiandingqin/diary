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
		getCurUserInfo(function(res){
			res.data.head_img = res.data.head_img?HOST + res.data.head_img:'';
			window.localStorage.setItem('user_avatar',res.data.head_img);
			window.localStorage.setItem('user_nickname',res.data.nickname || res.data.diarysn);
			window.localStorage.setItem('selfUserInfo',JSON.stringify(res.data));
		});
		
		//接收好友添加处理
//		require.async('lib/rongIm.js',function(e){
//			var selfInfo = {
//				userId : localStorage.getItem('id'),
//				name : localStorage.getItem('user_nickname'),
//				portraitUri : localStorage.getItem('user_avatar')
//			};
//			var cbJson = {
//				addFriend : addFriend,
//				okFriend : okFriend,
//				noFriend : noFriend,
//				//文本消息
//				textMessage : textMessage,
//				//图片消息
//				imgMessage  : imgMessage,
//				//语音消息
//				audioMessage: audioMessage
//			};
//			var imClient = e.methods.connection(selfInfo,cbJson);
//			
//			//接收添加好友请求
//			function addFriend(msg){
//				
//				var msgContent = msg.content.message.content;
//				//创建本地消息
//				createLocalMsg({content:msgContent.content,title:msgContent.nickname});
//				
//				//获取待处理好友列表 修改头部消息通知数量
//				pending(function(res){
//					mui('#msgNum')[0].innerText = res.length;
//				});
//			};
//			
//			//接收好友同意添加消息
//			function okFriend(msg){
//				var msgContent = msg.content.message.content;
//				//创建本地消息
//				createLocalMsg({content:msgContent.content,title:msgContent.nickname});
//				//刷新好友列表
//				mui.trigger(window,'updateFriendsList');
//			};
//			
//			//接收好友拒绝添加消息
//			function noFriend(msg){
//				var msgContent = msg.content.message.content;
//				//创建本地消息
//				createLocalMsg({content:msgContent.content,title:msgContent.nickname});
//			};
//			
//			//接收文本消息
//			function textMessage(msg){
//				var dataJson = {
//					avatar : msg.content.extra.avatar,
//					name : msg.content.extra.name,
//					content : msg.content.content,
//					time : $.getTimes((msg.sentTime / 1000)).timerStr,
//					isSelf : false,
//					img : '',
//					audio : '',
//					type : 'text',
//					target : msg.targetId
//				};
//				createLocalMsg({content:msg.content.content,title:msg.content.extra.name});
//				//保存聊天记录
//				saveChatLog(dataJson);
//			};
//			//接收图片消息
//			function imgMessage(msg){
//				//获取文件后缀
//				var fileClassify = msg.content.imageUri.split('.');
//				fileClassify = '.' + fileClassify[fileClassify.length-1];
//				//base64转换文件
//				file2base64.dataURL2Audio(msg.content.content,'img/',fileClassify,function(file){
//					var dataJson = {
//						avatar : msg.content.extra.avatar,
//						name : msg.content.extra.name,
//						content : '',
//						time : $.getTimes((msg.sentTime / 1000)).timerStr,
//						isSelf : false,
//						img : file.fullPath,
//						audio : '',
//						type : 'img',
//						target : msg.targetId
//					};
//					createLocalMsg({content:'图片',title:msg.content.extra.name});
//					//保存聊天记录
//					saveChatLog(dataJson);
//				});
//			};
//			//接收语音消息
//			function audioMessage(msg){
//				//base64转换文件
//				file2base64.dataURL2Audio(msg.content.content,'audio/',null,function(file){
//					var dataJson = {
//						avatar : msg.content.extra.avatar,
//						name : msg.content.extra.name,
//						content : '',
//						time : $.getTimes((msg.sentTime / 1000)).timerStr,
//						isSelf : false,
//						img : '',
//						audio : file.__PURL__,
//						type : 'audio',
//						target : msg.targetId
//					};
//					createLocalMsg({content:'语音',title:msg.content.extra.name});
//					//保存聊天记录
//					saveChatLog(dataJson);
//				});
//			};
//			
//			mui.plusReady(function(){
//				//监听点击通知
//				plus.push.addEventListener( "click", function ( msg ) {
//					// 分析msg.payload处理业务逻辑 
//					//console.log(msg);
//				}, false );
//				//检测通讯界面是否存在 不存在判断是否已链接 是否重新连接
//				var targetView = null;
//				var m = e.methods.restApi;
//				setInterval(function(){
//					m.checkOnline(selfInfo.userId,function(res){
//						if(res.status != 1){
//							m.connSocket({token : localStorage.getItem('localToken')});
//						};
//					});
//				},2000);
//			});
//			
//		});
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
					
					//发送自定义消息通知目标查看好友添加消息
					require.async('lib/rongIm.js',function(e){
						e = e.methods.restApi;
						var op = {
							method : 'addFriend',
							fromUserId : localStorage.getItem('id'),
							toUserId : userid,
							content : {
								content : '你好，加个好友吧',
								nickname : localStorage.getItem('user_nickname')
							}
						};
						e.sendMsg(op);
					});
					
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
			mui.each(res,function(i,item){
				res[i].add_at = $.getTimes(item.add_at).timerStr;
				res[i].nickname = item.user.nickname || item.user.username;
				res[i].avatar = item.user.head_img?HOST + item.user.head_img:'';
				vMsg.datas.push(item);
			});
		},mask);
		
		//同意添加好友okFriend
		function yesBtn(uid,index,targetUserId){
			yesForNo('yes',uid,index,targetUserId); 
		};
		//拒绝添加好友noFriend
		function noBtn(uid,index,targetUserId){
			yesForNo('no',uid,index,targetUserId);
		};
		
		//添加拒绝好友申请
		function yesForNo(type,uid,index,targetUserId){
			var mask = new Mask();
			mask.show();
			var url = type == 'yes'?API.ACCEPT:API.REFUSE;
			$.ajax({
				url:url,
				data : {id : uid},
				success:function(result){
					mask.close();
					mui.toast(result.data);
					if(result.success){
						vMsg.datas.removeItem(index);
						reloadFriendsList();
						//发送同意添加好友消息
						require.async('lib/rongIm.js',function(e){
							e = e.methods.restApi;
							var op = {
								method : type=='yes'?'okFriend':'noFriend',
								fromUserId : localStorage.getItem('id'),
								toUserId : targetUserId,
								content : {
									content : type=='yes'?'我们已经是好友了，快来愉快的聊天吧':'拒绝了好友申请',
									nickname : localStorage.getItem('user_nickname')
								}
							};
							e.sendMsg(op);
						});
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
		
		//监听更新
		window.addEventListener('update',function(){
			getUserInfo(userId,function(result){
				var avatar = result.data.head_img;
				result.data.head_img = avatar?HOST + avatar:'';
				v.user = result.data;
			});
		});
		
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
					//通知圈子列表更新
					mui.plusReady(function(){
						var circleView = plus.webview.getWebviewById('circle');
						if(circleView){
							mui.fire(circleView,'update');
						};
					});
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
					//通知圈子列表更新
					mui.plusReady(function(){
						var circleView = plus.webview.getWebviewById('circle');
						if(circleView){
							mui.fire(circleView,'update');
						};
					});
				};
			});
		};
		//打开私信聊天
		var openImBtn = mui('.openim')[0];
		openImBtn.addEventListener('tap',function(){
			var dataJson = {
				userId : v.user.id,
				name : v.user.nickname || v.user.diarysn,
				portraitUri : v.user.head_img
			};
			openView({url : 'msg_im.html' , id : 'msg_im', data : dataJson});
		});
	};
	
	//已关注笔友列表
	function friends(){
		var vOption = {
			data : {datas : {sub:[],fans:[]}},
			cycle:{created : function(){
				getList.call(this);
				getList.call(this,'fans');
			}}
		};
		var v = require('newvue').methods.vue(vOption);
		
		//获取已关注笔友列表
		function getList(fans){
			var _this = this;
			var mask = new Mask();
			mask.show();
			$.ajax({
				url:fans?API.GETFANS:API.GETSUB,
				success:function(result){
					mask.close();
					mui.each(result.data,function(i,item){
						var avatar = item.user.head_img;
						item.user.head_img = avatar?HOST + avatar:'';
					});
					if(fans){
						_this.datas.fans = result.data;
					}else{
						_this.datas.sub = result.data;
					};
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