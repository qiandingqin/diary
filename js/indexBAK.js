define(function(require, exports, module){
	
	exports.methods = {
		index : index,
		guide : guide,
		search_friend : search_friend,
		send_add : send_add,
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
		mask.show();
		//启用双击退出
		doubleBack();
		//清空消息数据
		window.localStorage.removeItem('applyMsg');
		//渲染数据
		var vOption = { data : {datas : []} };
		//引入vue
		var v = require('newvue').methods.vue(vOption);
		//引入 IM SDK  配置监听接收添加好友消息
		//接收好友申请消息
		var iOption = { onPresence :saveMsg ,onOpened : onOpened,onRoster:onRoster,onError : function(){
			//连接IM失败
			mask.close();
		}};
		var im = require('im').methods.connection(iOption,true);
		
		//监听申请添加好友消息
		window.addEventListener('setItem',function(newVal){
			var msgNum = mui('#msgNum')[0];
			//修改首页头部消息数量
			msgNum.innerText = JSON.parse(newVal.newValue).length;
		});
		
		//监听刷新数据事件
		window.addEventListener('updateFriendsList',function(){
			var msgNum = mui('#msgNum')[0];
			var friendStorage = JSON.parse(window.localStorage.getItem('applyMsg')) || [];
			//修改首页头部消息数量
			msgNum.innerText = friendStorage.length;
			getFriendsList();
		});
		
		//查询好友列表
		function onOpened(msg){
			mask.close();
			getFriendsList();
		};
		
		//监听处理好友结果
		function onRoster(){
			getFriendsList();
		};
		
		//获取好友列表
		function getFriendsList(cover){
			//查询好友列表
			im.conn.getRoster({
				success:function(result){
					var friends = getFrendsList(result);
					var newArr = [];
					mui.each(friends,function(i,item){
						newArr.push({
							phone : item.name,
							nickname : item.name,
							avatar : '../../images/avatar.png'
						});
					});
					v.datas = newArr;
				}
			});
		};
		
	};
	//查找笔友
	function search_friend(){
		
		//引入IM SDK查询IM好友
		var imSdk = require('im').methods;
		var im = imSdk.connection();
		var imRest = imSdk.rest;
		var vOption = {
			data : {datas : [],search_input:''},
			methods : {searchBtn : searchBtn}
		};
		//引入vue
		var v = require('newvue').methods.vue(vOption);
		//连续输入间隔 700毫秒发起查询
		var time = 700;
		var timeout = null;
		v.$watch('search_input',function(newVal,oldVal){
			//timeout可能为空 可能有报错所以添加错误处理
			try{
				clearTimeout(timeout);
			}catch(e){};
			timeout = setTimeout(function(){
				search(newVal);
			},time);
		});
		
		//软键盘搜索按钮
		function searchBtn(ev){
			if(ev.keyCode === 13){
				search(v.search_input);
			};
		};
		
		//查询笔友
		function search(user){
			imRest.getUser(user,function(result){
				var dataJson = {
					nickname : result.nickname,
					avatar : '../../images/avatar.png',
					user : result.username
				};
				v.datas =[dataJson];
			});
		};
		
	};
	//发送添加添加笔友信息
	function send_add(){
		var im = require('im').methods.connection();
		//引入vue
		var vOption = {
			data : {diarycode : $.getUrlData().user,message : '',},
			methods : {send : send}
		};
		var v = require('newvue').methods.vue(vOption);
		
		
		//发送添加消息
		function send(){
			im.addFriend(this.diarycode,this.message);
			mui.toast('发送成功,请等待验证');
			//mui.back();
		};
	};
	
	//处理添加好友消息 接收推送日记
	function msg(){
		//取出储存的申请数据
		var applyMsg = JSON.parse(window.localStorage.getItem('applyMsg')) || [];
		var vOptionMsg = {
			data : {datas : applyMsg},
			methods : {yesBtn  : yesBtn,noBtn : noBtn}
		};
		//引入vue
		var vMsg = require('newvue').methods.vue(vOptionMsg);
		//接收好友申请消息
		var iOption = { onPresence :saveMsg ,onRoster:onRoster};
		var im = require('im').methods.connection(iOption,true);
		
		//监听
		window.addEventListener('setItem',function(newVal){
			newVal = JSON.parse(newVal.newValue) || [];
			vMsg.datas = newVal;
		});
		
		//同意添加好友
		function yesBtn(imType,user,index){
			//删除当前申请数据
			rmItemMsg(index);
			//刷新首页数据
			reloadFriendsList();
			if (imType === 'subscribe') {
				var phone = window.localStorage.getItem('phone');
				//同意添加好友操作的实现方法
			    im.conn.subscribed({ to: user, message : '[resp:true]' });
			    //需要反向添加对方好友
			    im.conn.subscribe({ to: phone, message : '[resp:true]' });
			    mui.toast('添加成功');
			};
		};
		//拒绝添加好友
		function noBtn(imType,user,index){
			//删除当前申请数据
			rmItemMsg(index);
			//刷新首页数据
			reloadFriendsList();
			if (imType === 'subscribe') {
			    /*同意添加好友操作的实现方法*/
			    im.conn.unsubscribed({ to: user, message : '拒绝添加！' });
			    mui.toast('已拒绝');
			};
		};
		
		//添加好友处理
		function onRoster(message){
			//console.log(message);
			//console.log('处理好友');
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
			data : {datas : [],textArea:''},
			methods : {send : send,sendImg : sendImg},
			cycle : {updated : setScroll}
		};
		var v = require('newvue').methods.vue(vOptionMsg);
		
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
				img : null
			};
			v.datas.push(dataJson);
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
					img : fileUrl
				};
				v.datas.push(dataJson);
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
					img : null
				};
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
                onFileUploadComplete: function (data) { },
                success: function (id) {
                    var dataJson = {
						user : '我',
						text : '',
						time : $.getTimes(curDate).timerStr,
						isSelf:true,
						img : url
					};
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