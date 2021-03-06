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
			openView({url : 'msg_im.html?user=' + phone});
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
		require.async('im',function(m){
			var mask = new Mask();
			var par = $.getUrlData();
			var phone = par.user;
			var username = par.username?decodeURI(par.username):phone;
			var msgHeight = document.querySelector('.msgList').offsetHeight;
			var vOptionMsg = {
				data : {datas : getChatLog(phone),textArea:''},
				methods : {send : send,sendImg : sendImg},
				cycle : {updated : setScroll}
			};
			var v = require('newvue').methods.vue(vOptionMsg);
			mask.show('连接中...');
			setScroll();
			//设置聊天区域滚动条位置
			function setScroll(){
				var msgList = v.$el.querySelector('.msgList');
				var msgListTioVal = msgHeight + msgList.scrollHeight;
				msgList.scrollTop = msgListTioVal;
			};
			//接收聊天消息
			var iOption = { 
				onOpened:closeMask,
				onError:closeMask,
				onTextMessage :onTextMessage ,
				onPictureMessage:onPictureMessage
			};
			
			var im = m.methods.connection(iOption,true);
			var conn = im.conn;
			var imLogin = im.login;
			var userInfo = {
				phone : localStorage.getItem('phone'),
				pwd : localStorage.getItem('pwd')
			};
			//登录IM聊天服务器
			imLogin(userInfo,function(){
				mask.close();
			},function(){
				mask.close();
			});
		
		
			mui('.nickname')[0].innerText = username;
			
			//连接成功失败关闭mask
			function closeMask(){ mask.close(); };
			
			//处理接收聊天消息
			function onTextMessage(msg){
				var txt = msg.data.split('##**');
				var time = $.getTimes(txt[1]).timerStr;
				var dataJson = {
					user : msg.from,
					text : txt[0],
					time : time,
					isSelf:false,
					img : null,
					target : msg.from
				};
				saveChatLog(dataJson);
				//判断当前消息来源是否为正在聊天对象，否则存入缓存不做渲染
				if(msg.from == phone){
					v.datas.push(dataJson);
				};
			};
			
			//处理接收图片消息
			function onPictureMessage(msg){
				console.log(msg);
				var options = {url: msg.url};
		        var fileSuffix = msg.filename.split('.');
		        fileSuffix = '.' + fileSuffix[fileSuffix.length-1];
		       	require.async('plusdown.js',function(e){
		       		var down = e.down;
		       		var curDate = parseInt(new Date().getTime() / 1000);
		       		var dataJson = {
						user : msg.from,
						text : '',
						time : $.getTimes(curDate).timerStr,
						isSelf:false,
						img : "",
						target : msg.from
					};
					
					var downOption = {
						url : msg.url,
						filename : new Date().getTime() + fileSuffix
					};
					//下载图片
					down(downOption,function(data,path){
						var dataJson = {
							user : msg.from,
							text : '',
							time : $.getTimes(curDate).timerStr,
							isSelf:false,
							img : path,
							target : msg.from
						};
						saveChatLog(dataJson);
						if(msg.from == phone){
							console.log('聊天记录已经保存',path)
							v.datas.push(dataJson);
						};
					});
		      	});
			};
			
			//发送文本消息
			function send(){
				if(!this.textArea)return;
				var _this = this;
				var curDate = parseInt(new Date().getTime() / 1000);
				sendPrivateText(_this.textArea + '##**' + curDate,phone,function(){
					
					var dataJson = {
						user : '我',
						text : _this.textArea,
						time : $.getTimes(curDate).timerStr,
						isSelf:true,
						img : null,
						target : phone
					};
					saveChatLog(dataJson);
					_this.datas.push(dataJson);
					//清空输入框
					_this.textArea = '';
					_this.$el.querySelector('send').focus();
				});
			};
			
			//发送图片消息
			function sendImg(ev){
				var _this = ev.target;
	            var blob = _this.files[0];
	            var url = window.URL.createObjectURL(blob);
	            var id = conn.getUniqueId();             // 生成本地消息id
	            var msg = new WebIM.message('img', id);  // 创建图片消息
	            var curDate = parseInt(new Date().getTime() / 1000);
	            msg.set({
	                apiUrl: WebIM.config.apiURL,
	                file: {data: blob, url: url},
	                to: phone,                      // 接收消息对象
	                roomType: false,
	                chatType: 'singleChat',
	                onFileUploadError: function (error) { },
	                onFileUploadComplete: function (data) {
	                	var imgFileName = data.uri + '/' +data.entities[0].uuid;
	                	
	                	//保存图片至本地
	                	require.async('plusdown.js',function(e){
	                		var down = e.down;
	                		var fileSuffix = _this.value.split('.');
		        			fileSuffix = '.' + fileSuffix[fileSuffix.length-1];
	                		//下载配置参数
	                		var downOption = {
	                			url : imgFileName,
	                			filename : new Date().getTime() + fileSuffix
	                		};
	                		//下载
	                		down(downOption,function(data,path){
	                			var dataJson = {
									user : '我',
									text : '',
									time : $.getTimes(curDate).timerStr,
									isSelf:true,
									img : path,
									target : phone
								};
								//保存到聊天记录
								saveChatLog(dataJson);
								v.datas.push(dataJson);
	                		});
	                	});
	                },
	                success: function (id) { }
	            });
	            conn.send(msg.body);
			};
			
			//封装IM 发送消息
			function sendPrivateText(str,userid,cb) {
			    var id = conn.getUniqueId();                 // 生成本地消息id
			    var msg = new WebIM.message('txt', id);      // 创建文本消息
			    msg.set({
			        msg: str,                  			     // 消息内容
			        to: userid,                          	 // 接收消息对象（用户id）
			        roomType: false,
			        success: function (id, serverMsgId) {
			            cb&&cb();
			        }
			    });
			    msg.body.chatType = 'singleChat';
			    conn.send(msg.body);
			};
		});
	};
})