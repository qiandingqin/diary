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
				window.imSttus = status;
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
			            playTisp();
			            cbJson.textMessage&&cbJson.textMessage(message);
			            break;
			        case RongIMClient.MessageType.VoiceMessage:
			            //语音消息
			            playTisp();
			            cbJson.audioMessage&&cbJson.audioMessage(message);
			            break;
			        case RongIMClient.MessageType.ImageMessage:
			            //接收到图片消息 do something...
			            playTisp();
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
			            // do something... 自定义消息
			            /*判断类型：
			           	* addFriend = 接收到添加好友请求
			           	* okFriend = 接收到同意添加好友
			           	* noFriend = 接收到拒绝添加好友
			            */
			            
			            switch (message.objectName){
			            	case 'addFriend':
			            		cbJson.addFriend&&cbJson.addFriend(message);
			            		break;
		            		case 'okFriend':
		            			cbJson.okFriend&&cbJson.okFriend(message);
			            		break;
		            		case 'noFriend':
		            			cbJson.noFriend&&cbJson.noFriend(message);
			            		break;
			            	default:
			            		break;
			            }
			            
			            break;
			        default:
			            // 自定义消息
			            // do something...
		        }
		    }
		});
		
		//获取token
		var localToken = localStorage.getItem('localToken');
		//if(localToken){
		//	var tokenObj = {token : localToken};
		//	restApi.connSocket(tokenObj);
		//}else{
			restApi.getToken(userinfo,restApi.connSocket);
		//};
		
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
//			var mask = new Mask();
//			mask.show('连接中....');
			//获取token  获取后会自动连接
			mui.ajax({
				type : 'post',
				url : API.IM_RONGYUN_TOKEN,
				data : userinfo,
				headers : this.createsigna(),
				success:function(res){
//					mask.close();
					localStorage.setItem('localToken',res.token);
					suc&&suc(res);
				},error:function(){
//					mask.close();
					mui.toast('连接聊天服务器失败，请稍后再试');
				}
			});
			
		},
		
		//链接socket
		connSocket : function(res){
			console.log(res.token);
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
		},
		
		//发送自定义消息
		sendMsg : function(op,suc){
			var subJson = {
				fromUserId : op.fromUserId,
				toUserId : op.toUserId,
				objectName : op.method,
				content : JSON.stringify(op.content)
			};
			mui.ajax({
				url : API.IM_RONGYUN_SEND,
				type : 'post',
				data : subJson,
				headers : this.createsigna(),
				success:function(res){
					if(res.code == 200){
						suc&&suc();
					}
				}
			});
		},
		
		//检测指定ID用户是否在线
		checkOnline : function(userId,suc){
			mui.ajax({
				url : API.IM_CHECKONLINE,
				type : 'post',
				data : {userId : userId},
				headers : this.createsigna(),
				success:function(res){
					suc&&suc(res);
				}
			});
		},
		
	};
	
	exports.methods = {
		
		connection : conn,
		restApi : restApi
	};
	
});
