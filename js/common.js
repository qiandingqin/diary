//此文件作为通用全局控制JS
;function init(){
	isLogin();
	addCloseView();
	disposeA();
	hideScroll();
};
//处理a标签使用app方式跳转
function disposeA(){
	var muiA  = mui('a,.open');
	var openMethod = 'pop-in';
	var openTime = 200;
	mui.each(muiA,function(i,item){
		item.addEventListener('tap',tapEvent);
	});
	
	function tapEvent(ev){
		//默认阻止a标签跳转 tap事件不能阻止
		var href = '';
		href = this.dataset.href || this.href;
		if(!href || $.getFileName(null,href).indexOf('#') != -1 || href == 'javascript:;')return;
		if(!ev.target.classList.contains('mui-action-back'))ev.stopPropagation();
		//打开新窗口
		openView({url : href});
	};
	
};

//打开新窗口
function openView(obj,cb){
	obj.url = $.assembleData(obj.url,obj.data);
	createView(obj,cb);
};

//创建新窗口
function createView(obj,cb){
	if(!obj.url)return;
	var targetViewId = obj.id || $.getFileName(true,obj.url);
	var targetView = null;
	var targetViewStyle = obj.style || {};
	var viewAll = plus.webview.all();
	var curView = plus.webview.currentWebview();
	//检测目标窗口是否为自己
	if(targetViewId === curView.id)return;
	
	//检测窗口是否存在
	for(var i=0;i<viewAll.length;i++){
		if(viewAll[i].id == targetViewId){
			targetView = viewAll[i];
			break;
		};
	};
	if(targetView){
		//如果窗口已经存在
		//targetView.hide('none',0);
		showView(targetView,cb);
	}else{
		//如果窗口不存在
		var mask = new Mask();
		mask.show('加载中..');
		targetView = plus.webview.create(obj.url,targetViewId,targetViewStyle);
		targetView.addEventListener('loaded',function(){
			mask.close();
			showView(targetView,cb);
		});
	};
};

//显示窗口
function showView(viewObj,cb){
	//alert(3)
	//打开新窗口之后检测菜单窗口是否显示状态,显示则隐藏并干掉遮罩层
	setTimeout(function(){
		viewObj.show('pop-in',250,function(){
//			console.log('显示了' + viewObj.id)
			var menuView = plus.webview.getWebviewById('add_diary');
			if(menuView){mui.fire(menuView,'closeMask');}
			cb&&cb();
		});
	},200);
};

//检查登陆
function isLogin(){
	var token = window.localStorage.getItem('phone');
	return token;
};

//预留状态栏高度
function setViewPotion(){
	var header = document.querySelector('header');
	var muiContent = document.querySelector('.mui-content');
	mui.plusReady(function(){
		try{
			var h = plus.navigator.getStatusbarHeight();
			muiContent.style.marginTop = header.style.paddingTop = h + 'px';
			header.style.height = header.offsetHeight + h + 'px';
		}catch(e){}
	});
};

//隐藏滚动条
function hideScroll(){
	mui.plusReady(function(){
		var curView = plus.webview.currentWebview();
		curView.setStyle({scrollIndicator:'none'})
	});
};

//遮罩等待窗口
function Mask(){
	this.oDiv = document.createElement('div');
	this.oDiv.classList.add('maskBox');
	this.oDiv.style.height = window.innerHeight + 'px';
};

//发送手机验证码
function sendVerifyCode(phonecode,cb,isreset){
	
	var subJson = {
		'data[mobile]' : phonecode,
	};
	
	var url = API.SEND_CODE;
	
	if(isreset == 'reset'){
		url = API.RESETPWDCODE
	};
	
	$.ajax({
		type:"post",
		url:url,
		data : subJson,
		success:function(result){
			cb&&cb(result);
		},error:function(){}
	});
	
};

//退出登录
function logout(suc,err){
	$.ajax({ type:'post',url:API.LOGOUT,success:function(result){
		suc&&suc(result);
	},error:function(err){
		err&&err(err);
	}});
};

Mask.prototype.show = function(str){
	str = str || '等待中..';
	this.oDiv.innerHTML = '<div class="mask"><span class="mui-icon mui-icon-spinner wang-roteta"></span><p>'+str+'</p></div>';
	document.body.appendChild(this.oDiv);
};

Mask.prototype.close = function(){
	try{
		this.oDiv.parentNode.removeChild(this.oDiv);
	}catch(e){
		//TODO handle the exception
	}
};

//修改muiback 双击返回退出应用
function doubleBack(){
	mui.plusReady(function(){
		//处理逻辑：1秒内，连续两次按返回键，则退出应用；
		var first = null;
		mui.back = function() {
			//首次按键，提示‘再按一次退出应用’
			if (!first) {
				first = new Date().getTime();
				mui.toast('再按一次退出应用');
				setTimeout(function() {
					first = null;
				}, 1000);
			} else {
				if (new Date().getTime() - first < 1000) {
					plus.runtime.quit();
				}
			}
		};
	});
};

//发送关闭目标窗口，默认为当前窗口
function fireCloseView(viewId){
	mui.plusReady(function(){
		var curView = null;
		if(viewId){
			curView = plus.webview.getWebviewById(viewId);
		}else{
			curView = plus.webview.currentWebview();
		};
		mui.fire(curView,'closeCurView');
	});
};

//监听关闭自身事件
function addCloseView(){
	window.addEventListener('closeCurView',function(){
		mui.plusReady(function(){
			var curView = plus.webview.currentWebview();
			var indexView = plus.webview.getLaunchWebview();
			if(curView.id != indexView.id){
				setTimeout(function(){
					console.log('我是：' + curView.id + '接到了关闭指令');
					curView.close('none',0);
				},500);
			};
		});
	});
};

//处理监听消息处理为数组
function saveMsg(message){
	if(message.type !== 'subscribe')return;
	//处理申请验证信息
	var curTime = parseInt(new Date().getTime() / 1000);
	var infoArr = message.status.split('##**');
	message.msg = infoArr[0];
	message.time = $.getTimes((infoArr[1] || curTime)).timerStr;
	//存入plus储存 并显示消息数量  进入首页时需要清空值 避免重复添加一样的数据
	var oldStorage = window.localStorage.getItem('applyMsg');
	var oldObject = null;
	//判断旧值是否为空 如果为空则生成空数组
	oldObject = oldStorage?JSON.parse(oldStorage):[];
	//遍历旧数据 是否已经存在相同用户 存在则不继续，不存在则push
	for(var i in oldObject){
		if(oldObject[i].from === message.from)return;
	};
	//新数据添加到数组
	oldObject.push(message);
	//转为字符串存入本地储存
	oldObject = JSON.stringify(oldObject);
	window.localStorage.setItem('applyMsg',oldObject);
};

//保存聊天记录
function saveChatLog(ChatJson){
	//复制对象
	var cJsonString = JSON.stringify(ChatJson);
	var cJson = JSON.parse(cJsonString);
	//取出历史记录
	var oldLog = window.localStorage.getItem('chat');
	oldLog = JSON.parse(oldLog) || {};
	
	oldLog[cJson.target] = oldLog[cJson.target] || [];
	
	//添加新记录
	oldLog[cJson.target].push(cJson);
	//将新聊天记录转化为字符串
	var newlog = JSON.stringify(oldLog);
	//覆盖历史聊天记录
	window.localStorage.setItem('chat',newlog);
};

//取出聊天记录
function getChatLog(target){
	
	var chatLog = window.localStorage.getItem('chat');
	chatLog = JSON.parse(chatLog);
	
	//判断是否为空对象
	if(!$.isEmptyObject(chatLog)){
		return [];
	};
	
	return chatLog[target] || [];
	
};

//删除指定下标的消息
function rmItemMsg(index){
	//删除当前数组
	var nowStorage = JSON.parse(window.localStorage.getItem('applyMsg')) || [];
	nowStorage.removeItem(index);
	//重新添加到储存中
	window.localStorage.setItem('applyMsg',JSON.stringify(nowStorage));
};

//提取IM好友列表
function getFrendsList(data){
	var datas = [];
	for(var i in data){
		if(data[i].subscription === 'both' || data[i].subscription === 'from'){
			datas.push(data[i]);
		};
	};
	
	return datas;
};

//提取好友列表
function getFriendsList(cb){
	var mask = new Mask();
	mask.show();
	//查询好友列表
	$.ajax({
		url:API.FRIENDS,
		success:function(res){
			mask.close();
			var thisUser = localStorage.getItem('phone');
			//重组数据
			var newArr = [];
			mui.each(res.data,function(i,item){
				//判断添加者是否为当前用户 是则使用to_user_xx否则使用from_user_xx
				var newJson = {
					avatar : '',
					user_name : '',
					user_nickname : '',
					user_diarysn : '',
					user_id : ''
				};
				if(item.from_user_name === thisUser){
					//为自己
					newJson.user_name = item.to_user_name;
					newJson.nickname = item.to_user_nick;
					newJson.user_id = item.to_user_id;
				}else{
					newJson.user_name = item.from_user_name;
					newJson.nickname = item.user.nickname || item.user.username;
					newJson.user_id = item.from_user_id;
					newJson.avatar = item.user.head_img?HOST + item.user.head_img:'';
					newJson.user_diarysn = item.user.diarysn;
				};
				newArr.push(newJson);
			});
			cb&&cb(newArr);
		},error : function(){
			mask.close();
		}
	});
};

//添加好友
function addFriendId(uid,cb){
	var mask = new Mask();
	mask.show();
	$.ajax({
		url : API.ADDFRIEND,
		type: 'post',
		data : {"data[user_id]" : uid},
		success:function(result){
			mask.close();
			cb&&cb(result);
		},
		error : function(){
			mask.close();
		}
	});
};

//删除好友
function deleteFriendId(uid,cb){
	var mask = new Mask();
	mask.show();
	$.ajax({
		url : API.DELETEFRIEND + '&user_id=' + uid,
		type: 'post',
		success:function(result){
			mask.close();
			cb&&cb(result);
		},
		error : function(){
			mask.close();
		}
	});
};

//添加关注
function addSubscribedId(uid,cb){
	var mask = new Mask();
	mask.show();
	$.ajax({
		url : API.ADDSUB,
		data : {user_id : uid},
		success:function(result){
			mask.close();
			cb&&cb(result);
		},
		error : function(){
			mask.close();
		}
	});
};

//取消关注
function cancelSubscribedId(uid,cb){
	var mask = new Mask();
	mask.show();
	$.ajax({
		url : API.CANCELSUB,
		data : {user_id : uid},
		success:function(result){
			mask.close();
			cb&&cb(result);
		},
		error : function(){
			mask.close();
		}
	});
};

//获取待处理好友列表
function pending(cb,mask){
	$.ajax({
		url : API.PENDING,
		success : function(result){
			mask&&mask.close();
			//过滤已同意,已拒绝的
			result = result.data;
			mui.each(result,function(i,item){
				if(item.status == 10 || item.status == -10){
					result.removeItem(i);
				};
			});
			result = $.filterArrJson(result,'from_user_id');
			cb&&cb(result);
		},
		error:function(){
			mask&&mask.close();
		}
	});
};

//获取用户信息
function getUserInfo(id,cb){
	var mask = new Mask();
	mask.show();
	$.ajax({
		url:API.GETUSERINFO,
		data : {"user_id" : id},
		success:function(result){
			mask.close();
			cb&&cb(result);
		},
		error:function(){mask.close()}
	});
};

//设置用户信息
function setUserInfo(name,val,cb){
	/*POST提交数组数据：data[]，数组元素可以是：'email','signature','
	constellation','nickname','sex',
	'address','school','wechat','qq'中的任一个。*/
	var mask = new Mask();
	mask.show();
	
	//创建对象
	var subJson = {
		"data[email]" : val,
		"data[signature]" : val,
		"data[constellation]" : val,
		"data[nickname]" : val,
		"data[sex]" : val,
		"data[address]" : val,
		"data[email]" : val,
		"data[school]" : val,
		"data[wechat]" : val,
		"data[qq]" : val,
	};
	for(var key in subJson){
		if(key != name){
			delete subJson[key];
		};
	};
	
	$.ajax({
		url:API.SETINFO,
		type:'post',
		data:subJson,
		success:function(result){
			mask.close();
			mui.toast(result.data);
			if(result.success){
				var userInfo = JSON.parse(localStorage.getItem('selfUserInfo'));
				var keyVal = name.match(/\[(.+?)\]/)[1];
				userInfo[keyVal] = val;
				localStorage.setItem('selfUserInfo',JSON.stringify(userInfo));
				reloadUserInfo();
				if(keyVal == 'nickname'){
					//更新“我的”
					mui.plusReady(function(){
						var targetView = plus.webview.getWebviewById('member');
						mui.fire(targetView,'update');
					});
				}
			};
			cb&&cb(result);
		},
		error:function(){
			mask.close();
		}
	});
};

//刷新个人资料
function reloadUserInfo(){
	mui.plusReady(function(){
		var userinfoView = plus.webview.getWebviewById('memberinfo');
		mui.fire(userinfoView,'reloadUserInfo');
	});
};
