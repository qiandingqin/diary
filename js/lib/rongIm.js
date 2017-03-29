define(function(require,exports,module){
	
	//引入哈希加密
	require('lib/sha1.js');
	//引入融云SDK
	require('lib/RongIMLib-2.2.5.min.js');
	//链接融云
	var conn = function(userinfo,cbJson){
		//初始化
		RongIMClient.init(RONGIMKEY);
		//状态监听器
		RongIMClient.setConnectionStatusListener({
			onChanged: function (status) {
		        switch (status) {
		            //链接成功
		            case RongIMLib.ConnectionStatus.CONNECTED:
		                console.log('链接成功');
		                break;
		            //正在链接
		            case RongIMLib.ConnectionStatus.CONNECTING:
		                console.log('正在链接');
		                break;
		            //重新链接
		            case RongIMLib.ConnectionStatus.DISCONNECTED:
		                console.log('断开连接');
		                break;
		            //其他设备登录
		            case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
		                console.log('其他设备登录');
		                break;
		              //网络不可用
		            case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
		              console.log('网络不可用');
		              break;
		        };
			}
		});
		
	    // 消息监听器
		RongIMClient.setOnReceiveMessageListener({
		    // 接收到的消息
			onReceived: function (message) {
			    // 判断消息类型
			    switch(message.messageType){
			        case RongIMClient.MessageType.TextMessage:
			            //接收到文本消息 do something...
			            cbJson.textMessage&&cbJson.textMessage(message);
			            break;
			        case RongIMClient.MessageType.VoiceMessage:
			            //语音消息
			            cbJson.audioMessage&&cbJson.audioMessage(message);
			            break;
			        case RongIMClient.MessageType.ImageMessage:
			            //接收到图片消息 do something...
			            cbJson.imgMessage&&cbJson.imgMessage(message);
			            break;
			        case RongIMClient.MessageType.DiscussionNotificationMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.LocationMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.RichContentMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.DiscussionNotificationMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.InformationNotificationMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.ContactNotificationMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.ProfileNotificationMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.CommandNotificationMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.CommandMessage:
			            // do something...
			            break;
			        case RongIMClient.MessageType.UnknownMessage:
			            // do something...
			            break;
			        default:
			            // 自定义消息
			            // do something...
		        }
		    }
		});
		
		//获取token
		restApi.getToken(userinfo,function(res){
			//连接融云IM服务器
			RongIMClient.connect(res.token, {
		        onSuccess: function(userId) {
		          console.log("Login successfully." + userId);
		        },
		        onTokenIncorrect: function() {
		          console.log('token无效');
		        },
		        onError:function(errorCode){
		            var info = '';
		            switch (errorCode) {
		                case RongIMLib.ErrorCode.TIMEOUT:
		                  	info = '超时';
		                  	break;
		                case RongIMLib.ErrorCode.UNKNOWN_ERROR:
		                  	info = '未知错误';
		                  	break;
		                case RongIMLib.ErrorCode.UNACCEPTABLE_PaROTOCOL_VERSION:
		                  	info = '不可接受的协议版本';
		                  	break;
		                case RongIMLib.ErrorCode.IDENTIFIER_REJECTED:
		                	//info = 'appkey不正确';
		                	info = '系统错误，请联系管理员';
		                  	break;
		                case RongIMLib.ErrorCode.SERVER_UNAVAILABLE:
		                  	info = '服务器不可用';
		                  	break;
		            };
		            console.log(errorCode);
		            mui.toast(info);
	            }
	      });
		});
		
		//抛出客户端对象
		return RongIMClient;
	};
	
	//服务端API
	var restApi ={
		
		//生成签名
		createsigna : function(){
			
			var random = Math.random() * 100000;
			var time = new Date().getTime();
			var signature = hex_sha1(RONGIMSECRET + random + time);
			return{
				'App-Key' : RONGIMKEY,
				'Nonce' : random,
				'Timestamp' : time,
				'Signature' : signature
			};
		},
		//获取token 并链接
		getToken : function(userinfo,suc){
			var mask = new Mask();
			mask.show('连接中....');
			//获取token  获取后会自动连接
			mui.ajax({
				type : 'post',
				url : API.IM_RONGYUN_TOKEN,
				data : userinfo,
				headers : this.createsigna(),
				success:function(res){
					mask.close();
					suc&&suc(res);
				},error:function(){
					mask.close();
					mui.toast('连接聊天服务器失败，请稍后再试');
				}
			});
			
		}
		
	};
	
	exports.methods = {
		
		connection : conn
		
	};
	
});
