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
		item.addEventListener('tap',function(ev){
			//默认阻止a标签跳转 tap事件不能阻止
			ev.preventDefault();
			this.href = this.dataset.href || this.href;
			if(!this.href || $.getFileName(null,this.href).indexOf('#') != -1 || this.href == 'javascript:;')return;
			if(!ev.target.classList.contains('mui-action-back'))ev.stopPropagation();
			//打开新窗口
			openView({url : this.href});
		});
	});
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
	//打开新窗口之后检测菜单窗口是否显示状态,显示则隐藏并干掉遮罩层
	var menuView = plus.webview.getWebviewById('add_diary');
	if(menuView){mui.fire(menuView,'closeMask');}
	setTimeout(function(){
		viewObj.show('pop-in',250,function(){
			cb&&cb();
		},'capture');
	},50);
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
	if(this.oDiv)this.oDiv.remove();
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
			console.log('我是：' + curView.id + '接到了关闭指令');
			setTimeout(function(){
				curView.close('none',0);
			},400);
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

//删除指定下标的消息
function rmItemMsg(index){
	//删除当前数组
	var nowStorage = JSON.parse(window.localStorage.getItem('applyMsg')) || [];
	nowStorage.removeItem(index);
	//重新添加到储存中
	window.localStorage.setItem('applyMsg',JSON.stringify(nowStorage));
};

//提取好友列表
function getFrendsList(data){
	var datas = [];
	for(var i in data){
		if(data[i].subscription === 'both' || data[i].subscription === 'from'){
			datas.push(data[i]);
		};
	};
	
	return datas;
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

//获取待处理好友列表
function pending(cb){
	$.ajax({
		url : API.PENDING,
		success : function(result){
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
	});
};
