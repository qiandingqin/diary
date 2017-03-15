define(function(require, exports, module){
	//引入sdk
	require('webim.config.js');
	require('../js/strophe-1.2.8.min.js');
	require('../js/websdk-1.4.10.js');
	function connection(cbJson,isOnlone){
		//创建连接
		var conn = new WebIM.connection({
		    https: WebIM.config.https,
		    url: WebIM.config.xmppURL,
		    isAutoLogin: WebIM.config.isAutoLogin,
		    isMultiLoginSessions: WebIM.config.isMultiLoginSessions
		});
		
		//监听各种接收消息处理
		conn.listen({
			 //连接成功回调
			onOpened: function ( message ) {
				console.log('连接成功');
				//是否手动上线
				if(isOnlone)conn.setPresence();
				//开启心跳连接
				/*if(conn.isOpened()){
					conn.heartBeat(conn);
				};*/
		        cbJson.onOpened&&cbJson.onOpened(message);
		    },
		    onPresence: function ( message ) {
		    	//全局处理 对方拒绝添加好友
		    	if(message.type === 'unsubscribed'){
		    		var str = message.from + '拒绝添加你为好友';
					mui.toast('提示:' + str);
		    	};
		    	//收到联系人订阅请求、处理群组、聊天室被踢解散等消息
		    	cbJson.onPresence&&cbJson.onPresence(message);
		    },
		    onRoster : function(message){
		    	//全局处理好友申请
		    	if(message.subscription === 'both'){
		    		mui.toast(message.name + '同意添加您为好友');
		    	};
		    	cbJson.onRoster&&cbJson.onRoster(message);
		    },
		    onTextMessage:function(message){
		    	//接收文本消息
		    	cbJson.onTextMessage&&cbJson.onTextMessage(message);
		    },
		    onPictureMessage:function(message){
		    	//接收图片消息
		    	cbJson.onPictureMessage&&cbJson.onPictureMessage(message);
		    },
		    
		    onOnline: function () {
		    	//本机网络连接成功
		    	console.log(111)
		    },                  
    		onOffline: function () {
    			//本机网络掉线
    			console.log(234);
    		},                 
		    onError:function(message){
		    	//开启心跳
		    	if(!conn.isOpened()){
		    		console.log('执行开启心跳函数');
					conn.heartBeat(conn);
				};
		    	//连接失败
		    	cbJson.onError&&cbJson.onError(message);
		    	console.log(message);
		    }
		});
		
		//注册IM账号
		function regUser(regInfo,suc,err){
			var mask = new Mask();
			mask.show();
			var options = { 
			    username: regInfo.phone,
			    password: regInfo.pwd,
			    nickname: regInfo.nickname,
			    appKey: WebIM.config.appkey,
			    success: function (data) {
			    	mask.close();
			    	suc&&suc(data);
			    	mui.toast(STR.REGSUC);
			    	//注册成功 自动登录 关闭注册，登录窗口 打开首页
			    	login({phone:regInfo.phone,pwd:regInfo.pwd},function(){
			    		mui.plusReady(function(){
				    		openView({url : '../index/index.html'},function(){
				    			if(plus.webview.currentWebview().id == 'login'){
				    				fireCloseView();
				    			}else{
				    				fireCloseView('login');
				    				fireCloseView();
				    			};
				    		});
				    	});
			    	});
			    	
			    },
			    error: function (error) {
			    	mask.close();
			    	var result = JSON.parse(error.data);
			    	err&&err(error);
			    	//用户名重复
			    	if(result.error === 'duplicate_unique_property_exists'){
			    		mui.alert(STR.PHONE_EXISTS);
			    	};
			    },
			    apiUrl: WebIM.config.apiURL
			};
			//发起注册请求
		  	conn.registerUser(options);
		};
		//登录接口
		function login (regInfo,suc,err){
			var mask = new Mask();
			mask.show();
			var options = { 
				apiUrl: WebIM.config.apiURL,
				user: regInfo.phone,
				pwd: regInfo.pwd,
				appKey: WebIM.config.appkey,
				success:function(result){
					mask.close();
					//保存IM token
					window.localStorage.setItem('token',result.access_token);
					suc&&suc(result);
				},
				error:function(error){
					mask.close();
					mui.alert(STR.LOGINERR);
					err&&err(error);
				}
			};
			conn.open(options);
		};
		
		//token登录
		function tokenLogin(){
			var token = window.localStorage.getItem('token');
			if(!token)return;
			var user = window.localStorage.getItem('phone');
			var options = {
			    apiUrl: WebIM.config.apiURL,
			    user: user,
			    accessToken: token,
			    appKey: WebIM.config.appkey
			};
			conn.open(options);
		};
		
		//添加好友
		function addFriend(user,msg){
			conn.subscribe({ to: user, message:msg });
		};
		
		//登录
		tokenLogin();
		//对外提供IM常用接口
		return {
			conn    : conn,
			regUser : regUser,
			login   : login,
			tokenLogin : tokenLogin,
			addFriend:addFriend
		};
		
	};
	
	//rest API接口
	
	//获取token
	function getToken(cb){
		var appkey = WebIM.config.appkey.replace(/#/,'/');
		var url = IM_HOST + appkey + API.IM_GETTOKEN;
		mui.ajax({
			url : url,
			data:GET_TOKEN_DATA,
			success:function(result){
				cb&&cb(result.access_token);
			}
		});
	};
	
	var rest = {
		
		token : null,
		//获取用户信息
		getUser : function(user,cb){
			if(this.token){
				_getUser(this.token);
			}else{
				getToken(_getUser);
			};
			
			function _getUser(token){
				var appkey = WebIM.config.appkey.replace(/#/,'/');
				var url = IM_HOST + appkey + '/users/' + user;
				mui.ajax({
					url:url,
					headers:{Authorization:IM_GET_HEADER + token},
					success:function(result){
						cb&&cb(result.entities[0]);
					}
				});
			};
		},
		//重置IM用户密码
		resetPwd:function(user,pwd,cb){
			
			if(this.token){
				_resetPwd(this.token);
			}else{
				getToken(_resetPwd);
			};
			
			function _resetPwd(token){
				var appkey = WebIM.config.appkey.replace(/#/,'/');
				var url = IM_HOST + appkey + '/users/' + user + '/password';
				mui.ajax({
					url:url,
					type : 'put',
					processData : false,
					headers:{Authorization:IM_GET_HEADER + token},
					data : JSON.stringify({newpassword : pwd}),
					success:function(result){
						cb&&cb(result);
					}
				});
			};
		},
	};
	
	//获取token并保存
	getToken(function(token){
		rest.token = token;
	});
	
	//对外提供接口
	exports.methods = {
		connection : connection,
		rest : rest
	};
})