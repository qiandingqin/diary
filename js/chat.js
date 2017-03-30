define(function(require,exports,module){
	//获取用户信息
	var par = $.getUrlData();
	var msgMic = mui('#msg_mic')[0];
	var msgCom = mui('#msg_com')[0];
	var msgText = mui('#msg_text')[0];
	var msgSound = mui('#msg_sound')[0];
	var msgSend = mui('#msg_send')[0];
	var soundAlert = mui('#sound_alert')[0];
	var headNickname = mui('h1.nickname')[0];
	var selImg = mui('#selImg')[0];
	var hide = 'mui-hidden';
	//配置录音时间
	var MIN_SOUND_TIME = 800;
	var MAX_SOUND_TIME = 10000;
	var timeout,stop = null;
	//获取自己的信息
	var selfUserInfo = {
		avatar : localStorage.getItem('user_avatar') || '../../images/avatar.png',
		name : localStorage.getItem('user_nickname'),
	};
	//初始化手势
	mui.init({
		gestureConfig: {
			tap: true, //默认为true
			doubletap: true, //默认为false
			longtap: true, //默认为false
			swipe: true, //默认为true
			drag: true, //默认为true
			hold: true, //默认为false，不监听
			release: true //默认为false，不监听
		}
	});
	par.name = decodeURI(par.name);
	//设置头部昵称
	headNickname.innerText = par.name;
	
	//融云SDK
	var im = require('./lib/rongIm.js').methods;
	//vue参数
	var vOption = { 
		el : '#msg-list',
		data : {datas : getChatLog(par.userId)},
		methods : {player : player},
		cycle : {updated : setScroll}
	};
	//引入vue
	var v = require('newvue').methods.vue(vOption);
	var setHeightTime = setInterval(setScroll,20);
	setTimeout(function(){
		clearInterval(setHeightTime);
	},100);
	//接收消息回调
	var cbJson = {
		//文本消息
		textMessage : textMessage,
		//图片消息
		imgMessage  : imgMessage,
		//语音消息
		audioMessage: audioMessage
	};
	//链接
	var selfInfo = {
		userId : localStorage.getItem('id'),
		name : localStorage.getItem('user_nickname'),
		portraitUri : localStorage.getItem('user_avatar')
	};
	var imClient = im.connection(selfInfo,cbJson);
	
	//接收文本消息
	function textMessage(msg){
		console.log(msg);
		var dataJson = {
			avatar : par.portraitUri || '../../images/avatar.png',
			name : par.name,
			content : msg.content.content,
			time : $.getTimes((msg.sentTime / 1000)).timerStr,
			isSelf : false,
			img : '',
			audio : '',
			type : 'text',
			target : msg.targetId
		};
		//保存聊天记录
		saveChatLog(dataJson);
		//判断是否为正在聊天用户对话
		if(msg.targetId == par.userId)v.datas.push(dataJson);
	};
	//接收图片消息
	function imgMessage(msg){
		//获取文件后缀
		var fileClassify = msg.content.imageUri.split('.');
		fileClassify = '.' + fileClassify[fileClassify.length-1];
		//base64转换文件
		file2base64.dataURL2Audio(msg.content.content,'img/',fileClassify,function(file){
			var dataJson = {
				avatar : par.portraitUri || '../../images/avatar.png',
				name : par.name,
				content : '',
				time : $.getTimes((msg.sentTime / 1000)).timerStr,
				isSelf : false,
				img : file.fullPath,
				audio : '',
				type : 'img',
				target : msg.targetId
			};
			
			//保存聊天记录
			saveChatLog(dataJson);
			//判断是否为正在聊天用户对话
			if(msg.targetId == par.userId)v.datas.push(dataJson);
		});
	};
	//接收语音消息
	function audioMessage(msg){
		//base64转换文件
		file2base64.dataURL2Audio(msg.content.content,'audio/',null,function(file){
			var dataJson = {
				avatar : par.portraitUri || '../../images/avatar.png',
				name : par.name,
				content : '',
				time : $.getTimes((msg.sentTime / 1000)).timerStr,
				isSelf : false,
				img : '',
				audio : file.__PURL__,
				type : 'audio',
				target : msg.targetId
			};
			
			//保存聊天记录
			saveChatLog(dataJson);
			//判断是否为正在聊天用户对话
			if(msg.targetId == par.userId)v.datas.push(dataJson);
		});
	};
	
	//发送文本消息
	msgSend.addEventListener('click',function(e){
		//信息为空不做处理
		if(!msgText.value)return;
		msgText.focus();
		e.preventDefault();
		//发送消息
		var msgContent = new RongIMLib.TextMessage({content:msgText.value,extra:selfUserInfo});
		
		sendMsg(imClient,msgContent,function(msg){
			console.log(msg);
			var dataJson = {
				avatar : selfUserInfo.avatar,
				name : selfUserInfo.name,
				content : msgText.value,
				time : $.getTimes((msg.sentTime / 1000)).timerStr,
				isSelf : true,
				img : '',
				audio : '',
				type : 'text',
				target : msg.targetId
			};
			//保存聊天记录
			saveChatLog(dataJson);
			//判断是否为正在聊天用户对话
			if(msg.targetId == par.userId)v.datas.push(dataJson);
            //清除输入框
			msgText.value = '';
		});
	});
	
	//发送图片消息
	selImg.addEventListener('tap',function(){
		mui.plusReady(function(){
			//打开系统相册
			plus.gallery.pick(function(filepath,a,b){
				var fileClassify = filepath.split('.');
				fileClassify = fileClassify[fileClassify.length-1];
				//压缩图片大小
				var option = {
					src : filepath,
					dst : '_downloads/chat/img/' + (new Date().getTime()) + '.' + fileClassify,
					width : '50%',
					height : 'auto',
					quality : 70
				};
				//压缩
				zip.imgZip(option,function(zipFile){
					
					//转换base64
					file2base64.Audio2dataURL(zipFile.target,function(base64File){
						//TODO
						var base64Str = base64File.result.replace('data:image/jpeg;base64,','');
						base64Str = base64Str.replace('data:image/png;base64,','');
						base64Str = base64Str.replace('data:image/jpg;base64,','');
						//发送图片消息
						var msgContent = new RongIMLib.ImageMessage({content:base64Str,imageUri:'',extra:selfUserInfo});
						sendMsg(imClient,msgContent,function(msg){
							var dataJson = {
								avatar : selfUserInfo.avatar,
								name : selfUserInfo.name,
								content : '',
								time : $.getTimes((msg.sentTime / 1000)).timerStr,
								isSelf : true,
								img : base64File.fileName,
								audio : '',
								type : 'img',
								target : msg.targetId
							};
							//保存聊天记录
							saveChatLog(dataJson);
							v.datas.push(dataJson);
						});
					});
					
				});
				
			});
		});
	});
	
	//长按屏幕录音
	msgSound.addEventListener('longtap',function(e){
		stop = false;
		soundAlert.classList.add('show');
		//开始录制
		audio.startRecord(function(recordFilePath){
			//转为base64编码
			file2base64.Audio2dataURL(recordFilePath,function(file){
				var base64Str = file.result.replace('data:audio/amr;base64,','');
				var msgContent = new RongIMLib.VoiceMessage({content:base64Str,extra:selfUserInfo});
				sendMsg(imClient,msgContent,function(msg){
					var dataJson = {
						avatar : selfUserInfo.avatar,
						name : selfUserInfo.name,
						content : '',
						time : $.getTimes((msg.sentTime / 1000)).timerStr,
						isSelf : true,
						img : '',
						audio : file.fileName,
						type : 'audio',
						target : msg.targetId
					};
					//保存聊天记录
					saveChatLog(dataJson);
					v.datas.push(dataJson);
				});
			});
			
		},function(a,b,c){
			console.log(a,'录制出错');
		});
		
		timeout = setTimeout(function(){
			//结束录制
			audio.stopRecord();
			mui.toast('录音时间不能超过'+(MAX_SOUND_TIME / 1000)+'秒');
		},MAX_SOUND_TIME);
		
		//向上滑动取消发送
		window.addEventListener('drag',drag);
	});
	
	//离开屏幕结束录音 发送语音消息
	msgSound.addEventListener('release',function(){
		clearTimeout(timeout);
		soundAlert.classList.remove('show');
		audio.stopRecord();
		mui('#audio_tips')[0].innerText = '手指上滑，取消发送';
		if(stop)return;
	});
	
	//向上滑动取消发送
	function drag(e){
		var tisp = '';
		if(Math.abs(e.detail.deltaY) > 50) {
			tisp = '手指松开，取消发送';
			stop = true;
		}else{
			tisp = '手指上滑，取消发送';
			stop = false;
		};
		mui('#audio_tips')[0].innerText = tisp;
	};
	
	
	//麦克风按钮点击 切换按钮
	msgMic.addEventListener('tap',function(){
		this.classList.add(hide);
		msgText.classList.add(hide);
		msgCom.classList.remove(hide);
		msgSound.classList.remove(hide);
	});
	//写字按钮点击切换
	msgCom.addEventListener('tap',function(){
		this.classList.add(hide);
		msgSound.classList.add(hide);
		msgText.classList.remove(hide);
		msgMic.classList.remove(hide);
	});
	//监听输入框变化修改按钮显示
	msgText.addEventListener('input',function(){
		if(this.value){
			msgMic.classList.add(hide);
			msgCom.classList.add(hide);
			msgSend.classList.remove(hide);
		}else{
			msgSend.classList.add(hide);
			msgMic.classList.remove(hide);
		};
	});
	//自定义方法
	//播放语音
	function player(path,ev){
		var tisp = null;
		
		mui('.audioBox').each(function(i,item){
			item.querySelectorAll('span')[1].innerText = '点击播放';
		});
		
		if(ev.target.classList.contains('audioBox')){
			tisp = ev.target.querySelectorAll('span')[1];
		}else if(ev.target.classList.contains('mui-icon')){
			tisp = ev.target.parentNode.querySelectorAll('span')[1];
		}else{
			tisp = ev.target;
		};
		tisp.innerText = '正在播放...';
		audio.player(path,function(){
			tisp.innerText = '点击播放';
		},function(){
			tisp.innerText = '播放失败';
		});
	};
	
	//封装发送消息
	function sendMsg(imClient,msgContent,suc,err){
		//类型 私聊
		var conversationtype = RongIMLib.ConversationType.PRIVATE;
		//发送目标id
		var targetId = par.userId;
		imClient.getInstance().sendMessage(conversationtype, targetId, msgContent, {
            // 发送消息成功
            onSuccess: function (msg) {
                //message 为发送的消息对象并且包含服务器返回的消息唯一Id和发送消息时间戳
				suc&&suc(msg);
            },
            onError: function (errorCode,message) {
                var info = '';
                switch (errorCode) {
                    case RongIMLib.ErrorCode.TIMEOUT:
                        info = '超时';
                        break;
                    case RongIMLib.ErrorCode.UNKNOWN_ERROR:
                        info = '未知错误';
                        break;
                    case RongIMLib.ErrorCode.REJECTED_BY_BLACKLIST:
                        info = '在黑名单中，无法向对方发送消息';
                        break;
                    case RongIMLib.ErrorCode.NOT_IN_DISCUSSION:
                        info = '不在讨论组中';
                        break;
                    case RongIMLib.ErrorCode.NOT_IN_GROUP:
                        info = '不在群组中';
                        break;
                    case RongIMLib.ErrorCode.NOT_IN_CHATROOM:
                        info = '不在聊天室中';
                        break;
                    default :
                        info = x;
                        break;
                }
                mui.toast(info);
            }
     	});
	};
	//设置聊天区域滚动条位置
	function setScroll(){
		v.$nextTick(function(){
			var msgList = document.querySelector('.msgList');
			var msgListTioVal = msgList.offsetHeight + msgList.scrollHeight;
			msgList.scrollTop = msgListTioVal;
		});
	};
	//音频类
	var audio = {
		r : null,
		p : null,
		o : {
			filename : '_downloads/chat/audio',
			format: 'amr'
		},
		//开始录制音频
		startRecord : function(suc,err){
			var _this = this;
			mui.plusReady(function(){
				_this.r = plus.audio.getRecorder();
				_this.r.record(_this.o,suc,err);
			});
		},
		//播放音频
		player : function(path,suc,err){
			var _this = this;
			if(this.p){
				this.p&&this.p.stop();
			};
			
			mui.plusReady(function(){
				_this.p = plus.audio.createPlayer(path);
				_this.p.play(suc,err)
			});
		},
		//结束录制
		stopRecord : function(){
			this.r&&this.r.stop();
		},
		//结束播放
		stopPlayer : function(tisp){
			this.p&&this.p.stop();
			if(tisp)tisp.innerText = '点击播放';
		}
	};
	//图片压缩
	var zip = {
		imgZip : function(option,suc,err){
			mui.plusReady(function(){
				plus.zip.compressImage(option,suc,err);
			});
		}
	};
});
