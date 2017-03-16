define(function(require, exports, module){
	
	exports.methods = {
		index : index,
		guide : guide,
		search_friend : search_friend,
		msg : msg,
		tj_friend_info : tj_friend_info,
		msg_im : msg_im
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
		
		//获取待处理好友申请列表
		pending(function(res){
			mui.each(res,function(i,item){
				res[i].add_at = $.getTimes(item.add_at).timerStr;
				vMsg.datas.push(item);
			});
		});
		
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
	function tj_friend_info(){
		var phone = $.getUrlData().user;
		var vOptionMsg = {
			data : {user : {nickname : phone}}
		};
		var v = require('newvue').methods.vue(vOptionMsg);
		
		//私信聊天
		var openImBtn = mui('.openim')[0];
		openImBtn.addEventListener('tap',function(){
			openView({url : 'msg_im.html?user=' + phone});
		});
	};
	
	//IM聊天室 单聊
	function msg_im(){
		var mask = new Mask();
		mask.show('连接中...');
		var phone = $.getUrlData().user;
		var msgHeight = document.querySelector('.msgList').offsetHeight;
		var vOptionMsg = {
			data : {datas : getChatLog(phone),textArea:''},
			methods : {send : send,sendImg : sendImg},
			cycle : {updated : setScroll}
		};
		var v = require('newvue').methods.vue(vOptionMsg);
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
		
		var im = require('im').methods.connection(iOption,true);
		var conn = im.conn;
		
		require.async('im',function(m){
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
		});
		
		mui('.nickname')[0].innerText = phone;
		
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
	        options.onFileDownloadComplete = function (file) {
	            // 图片下载成功
	            var fileUrl = window.URL.createObjectURL(file);
	            //推送到聊天区域
	            var curDate = parseInt(new Date().getTime() / 1000);
	            var dataJson = {
					user : msg.from,
					text : '',
					time : $.getTimes(curDate).timerStr,
					isSelf:false,
					img : msg.url,
					target : msg.from
				};
				saveChatLog(dataJson);
				//判断当前消息来源是否为正在聊天对象，否则存入缓存不做渲染
				if(msg.from == phone){
					v.datas.push(dataJson);
				};
	            console.log('图片下载成功');
	        };
	        WebIM.utils.download.call(conn, options);
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
            var imgFileName = '';
            msg.set({
                apiUrl: WebIM.config.apiURL,
                file: {data: blob, url: url},
                to: phone,                      // 接收消息对象
                roomType: false,
                chatType: 'singleChat',
                onFileUploadError: function (error) { },
                onFileUploadComplete: function (data) {
                	imgFileName = data.uri + '/' +data.entities[0].uuid;
                },
                success: function (id) {
                    var dataJson = {
						user : '我',
						text : '',
						time : $.getTimes(curDate).timerStr,
						isSelf:true,
						img : imgFileName,
						target : phone
					};
					saveChatLog(dataJson);
					v.datas.push(dataJson);
                }
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
	};
})