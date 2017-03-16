define(function(require, exports, module){
	//其他控制器
	exports.methods = {
		//提供调用接口
		add_diary : add_diary,
		add_diary_menu : add_diary_menu,
		reg : reg,
		login : login,
		resetpwd : resetpwd,
		memberinfo:memberinfo,
		sel_temp:sel_temp,
		ardity_jurisdiction:ardity_jurisdiction,
		pushset : pushset
	};
	
	//用户资料中心
	function memberinfo(){
		var vOption = {
			data : {data : {}},
			methods : {logout : logoutBtn}
		};
		var v = require('newvue').methods.vue(vOption);
		
		//退出按钮
		function logoutBtn(){
			var mask = new Mask();
			mask.show();
			//退出
			logout(function(res){
				//退出成功
				mask.close();
				//清除本地储存数据
				window.localStorage.removeItem('phone');
				window.localStorage.removeItem('token');
				//打开登录界面
				openView({url : 'login.html'},function(){
					fireCloseView();
				});
			},function(){
				mask.close();
			});
			
		};
	};
	
	//注册 注册包含同时注册IM，跟自己服务器
	function reg(){
		//首先注册IM账号 成功后再注册自己服务器账号 保证双边账号同步
		//引入IM封装文件
		
		require.async('im',function(methods){
			var im = methods.methods.connection();
		
			var time = 60;
			//初始化 Vue 用做处理数据
			var vOption = {
				data : {phone : '',pwd : '',verifycode : '',isAgree : true,codetxt:STR.GETCODE,sendBtn:true},
				methods : {regBtn : regBtn,sendcode:sendcode}
			};
			var v = require('newvue').methods.vue(vOption);
			//注册按钮
			function regBtn(){
				var mask = new Mask();
				//验证手机号是否正确。
				var msg = '';
				if(!$.regExp('phonecode',this.phone)){
					msg = '手机号不正确';
				}else if(this.pwd.length < 6){
					msg = '密码长度在6位数以上';
				}else if(!this.isAgree){
					msg = '请先同意用户协议';
				};
				
				if(msg){ mui.alert(msg); return; };
				
				var dataJson = { phone:this.phone,pwd:this.pwd,nickname:this.phone};
				
				//注册账号->注册IM账号->保存用户信息->自动登录IM账号->保存IM token->打开首页->关闭注册登录界面
				regUser(function(res){
					//注册 IM账号 注册成功后调用注册服务器账号
					im.regUser(dataJson);
				});
				
				function regUser(cb){
					mask.show();
					var subJson = {
						'data[mobile]':dataJson.phone,
						'data[password]':dataJson.pwd,
						'data[code]': v.verifycode
					};
					//发起注册
					$.ajax({
						type:"post",
						url:API.REG,
						data : subJson,
						success:function(result){
							mask.close();
							if(result.success){
								//注册成功
								//保存用户基本信息
								window.localStorage.setItem('phone',result.data.mobile);
								cb&&cb(result);
							};
							
						},error:function(){mask.close();}
					});
				};
			};
			//发送验证码
			function sendcode(){
				var _this = this;
				var setInt = null;
				_this.codetxt = --time + 's后获取';
				_this.sendBtn = false;
				setInt = setInterval(function(){
					if(time <= 0){
						clearInterval(setInt);
						_this.sendBtn = true;
						_this.codetxt = STR.GETCODE;
						time = 60;
					}else{
						_this.codetxt = --time + 's后获取';
					};
				},1000);
				//发送验证码
				sendVerifyCode(_this.phone);
			};
		});
	};
	
	//登录页面 登录包含同时登录IM，跟自己服务器
	function login(){
		//双击退出应用
		doubleBack();
		//引入VUE封装文件
		var vOption = {
			data : {phone : '',pwd : ''},
			methods : {loginBtn : loginBtn}
		};
		var v = require('newvue').methods.vue(vOption);
		//关闭所有除login页面
		closeViewAll();
		//登录按钮
		function loginBtn(){
			var mask = new Mask();
			//验证手机号
			var msg = '';
			if(!$.regExp('phonecode',this.phone)){
				msg = '手机号不正确';
			}else if(this.pwd.length < 6){
				msg = '密码长度在6位数以上';
			};
			
			if(msg){ mui.alert(msg); return; };
			
			//登录
			var dataJson = { phone : this.phone, pwd : this.pwd};
			var subJson = {
				'data[username]' : dataJson.phone,
				'data[password]' : dataJson.pwd
			};
			mask.show();
			$.ajax({
				type:"post",
				url:API.LOGIN,
				data : subJson,
				success:function(res){
					mask.close();
					if(!res.success)return;
					window.localStorage.setItem('phone',dataJson.phone);
					window.localStorage.setItem('pwd',dataJson.pwd);
					openView({ url : '../index/index.html' },function(){
						console.log(234);
						fireCloseView();
					});
				},error:function(){mask.close();}
			});
		};
		function closeViewAll(){
			mui.plusReady(function(){
				var allView = plus.webview.all();
				mui.each(allView,function(i,item){
					if(item.id != 'login'){
						mui.fire(item,'closeCurView');
					};
				});
			});
		};
	};
	
	//重置密码
	function resetpwd(){
		
		var vOption = {
			data : {phone : '',pwd : '',confirmpwd:'',verifycode : '',codetxt:STR.GETCODE,sendBtn:true},
			methods : {resetBtn : resetBtn,sendcode:sendcode}
		};
		var v = require('newvue').methods.vue(vOption);
		var time = 60;
		
		//重置按钮
		function resetBtn(){
			
			var mask = new Mask();
			//验证手机号是否正确。
			var msg = '';
			if(!$.regExp('phonecode',this.phone)){
				msg = '手机号不正确';
			}else if(this.pwd.length < 6){
				msg = '密码长度在6位数以上';
			}else if(this.pwd != this.confirmpwd){
				msg = '两次密码不一样';
			};
			
			if(msg){ mui.alert(msg); return; };
			
			//发起重置密码请求
			var _this = this;
			var subJson = {
				"data[mobile]" : this.phone,
				"data[password]" : this.pwd,
				'data[code]' : this.verifycode
			};
			mask.show();
			$.ajax({
				type:"post",
				url:API.RESETPWD,
				data : subJson,
				success:function(result){
					mask.close();
					if(!result || !result.success)return;
					//修改IM密码
					require.async('im',function(methods){
						var im = methods.methods;
						var imconn = im.connection();
						var imrest = im.rest;
						imrest.resetPwd(_this.phone,_this.pwd,function(res){
							//修改成功 退出登录后退
							mui.plusReady(function(){
								var firstView = plus.webview.currentWebview().opener();
								if(firstView.id == 'login'){
									logout(function(){
										mui.toast(result.data);
										mui.back();
									});
								}else{
									mui.toast(result.data);
									mui.back();
								};
							});
						});
					});
				},
				error:function(){
					mask.close();
				}
			});
		};
		
		//发送验证码
		function sendcode(){
			var _this = this;
			var setInt = null;
			_this.codetxt = --time + 's后获取';
			_this.sendBtn = false;
			setInt = setInterval(function(){
				if(time <= 0){
					clearInterval(setInt);
					_this.sendBtn = true;
					_this.codetxt = STR.GETCODE;
					time = 60;
				}else{
					_this.codetxt = --time + 's后获取';
				};
			},1000);
			//发送验证码
			sendVerifyCode(_this.phone,null,'reset');
		};
		
	};
	
	//添加日记
	function add_diary(){
		//添加侧滑菜单移动方法
		startMove();
		//初始化 Vue 用做处理数据
		var vOption = {
			data : {
				title : '',
				date : $.getDate().split(' ')[0],
				weatherArr : WEATHER,
				weather : WEATHER[0],
				moodArr : MOOD,
				mood : MOOD[0],
				fontArr:FONT,
				font:FONT[0],
				content1:'',
				content2:'',
				template:'default',
				permit : 'public',
				push : ''
			},
			methods : {selDate : selDate,add : add,change : change}
		};
		var v = require('newvue').methods.vue(vOption);
		var files = [];
		//JS处理添加图片高度的问题
		var oDiv = document.querySelectorAll('div.autoHeight');
		var Textarea = document.querySelectorAll('textarea.autoHeight');
		var h = (window.innerWidth- 30) * 0.4;
		mui.each(oDiv,function(i,item){
			Textarea[i].style.height = item.style.height = h + 'px';
		});
		
		//监听切换模板
		window.addEventListener('tabTemp',function(e){
			var sel = e.detail.sel;
			v.template = sel;
		});
		
		//监听切换权限
		window.addEventListener('tabPermit',function(e){
			var permit = e.detail.permit;
			v.permit = permit;
		});
		
		//监听定向推送
		window.addEventListener('tabPush',function(e){
			var push = e.detail.push;
			v.push = push;
		});
		
		//监听选择文件事件
		function change(ev){
			var _this = ev.target;
			var oImg = _this.parentNode.querySelector('img');
			oImg.src = window.URL.createObjectURL(_this.files[0]);
			files.push(_this.files[0]);
			_this.remove();
		};
		
		//提交数据
		function add(){
			var mask = new Mask();
			mask.show();
			//准备数据
			var subJson = {
				"data[title]" : v.title,
				"data[content]" : v.content1 + v.content2,
				"data[weather]" : v.weather,
				"data[font]" : v.font,
				"data[feeling]" : v.mood,
				"data[template]" : v.template,
				"data[permit]" : v.permit,
				"data[push]" : v.push
			};
			
			//判断用户是否需要上传图片
			if(files.length){
				//引入上传图片组件
				require.async('upImg.js',function(e){
					//提交图片上传
					var upOp = {
						host : API.IMAGESUPLOAD,
						name : 'images[]'
					};
					var up = new e.UpLoadImg(files,upOp);
					up.Up(function(result){
						var imgPaths = result.data.success;
						//拼接图片地址
						var pathsStr = '';
						mui.each(imgPaths,function(i,item){
							pathsStr += item.path + ',';
						});
						pathsStr = pathsStr.substring(0,pathsStr.length - 1);
						subJson['data[images]'] = pathsStr;
						reseale(subJson);
					});
				});
			}else{
				reseale(subJson);
			};
			
			//提交数据
			function reseale(subJson){
				$.ajax({
					url : API.RESEASE,
					type: 'post',
					data : subJson,
					success:function(result){
						mask.close();
						if(!result.success)return;
						mui.toast('发布成功');
						openView({url : '../circle/diary_detail.html',data : {id : result.data.id}},fireCloseView);
					},
					error : function(){
						mask.close();
					}
				});
			};
		};
		
		//选择日期
		function selDate(){
			//选择日期组件
			require('../js/mui.picker.min.js');
			var options = {"type":"date","beginYear":2014,"endYear":2018};
			var picker = new mui.DtPicker(options);
			picker.show(function(rs){
				v.date = rs.value;
				picker.dispose();
			});
		};
	};
	
	//添加日记菜单
	function add_diary_menu(){
		
	};
	
	//选择模板
	function sel_temp(){
		mui('.sel_temp').on('tap','li',function(){
			var _this = this;
			mui('.sel_temp li').each(function(i,item){
				item.classList.remove('active');
			});
			_this.classList.add('active');
			//发送选择结果到添加日记界面
			mui.plusReady(function(){
				var targetView = plus.webview.getWebviewById('add_diary');
				mui.fire(targetView,'tabTemp',{sel : _this.dataset.temp});
			});
		});
	};
	
	//选择权限
	function ardity_jurisdiction(){
		var Radio = mui('.mui-table-view-radio')[0];
		Radio.addEventListener('selected',function(e){
			var permit = e.detail.el.dataset.type;
			//发送选择结果到添加日记界面
			mui.plusReady(function(){
				var targetView = plus.webview.getWebviewById('add_diary');
				mui.fire(targetView,'tabPermit',{permit : permit});
			});
		});
	};
	
	//选择定向推送
	function pushset(){
		var vOption = { data : {datas : [] , pushs : []} };
		//引入vue
		var v = require('newvue').methods.vue(vOption);
		//获取好友列表
		getFriendsList(function(newArr){
			v.datas = newArr;
		});
		v.$watch('pushs',function(newVal){
			//发送选择结果到添加日记界面
			mui.plusReady(function(){
				var targetView = plus.webview.getWebviewById('add_diary');
				mui.fire(targetView,'tabPush',{push : newVal.join(',')});
			});
		});
	};
	
	//添加日记侧滑菜单方法
	function startMove(){
		var main,menu, mask = mui.createMask(_closeMenu);
		var showMenu = false;
		mui.plusReady(function() {
			main = plus.webview.currentWebview();
			//setTimeout的目的是等待窗体动画结束后，再执行create webview操作，避免资源竞争，导致窗口动画不流畅；
			setTimeout(function () {
				//侧滑菜单默认隐藏，这样可以节省内存；
				menu = mui.preload({
					id: 'add_diary_menu',
					url: 'add_diary_menu.html',
					styles: { left: '100%', width: '70%', zindex: 9997 }
				});
			});
			
		});
		/*显示菜单菜单*/
		function openMenu() {
			if (!showMenu) {
				menu.show('none', 0, function() {
					menu.setStyle({ left: '30%', transition: { duration: 150 } });
				});
				//显示遮罩
				mask.show();
				showMenu = true;
			}
		}
		/*关闭侧滑菜单*/
		function closeMenu (t) {
			_closeMenu(t);
			//关闭遮罩
			mask.close();
		};
		
		/*关闭侧滑菜单（业务部分）*/
		function _closeMenu(t) {
			if (showMenu) {
				//menu页面同时移动
				menu.setStyle({ left: '100%', transition: { duration: t?0:150 } });
				//等窗体动画结束后，隐藏菜单webview，节省资源；
				setTimeout(function() { menu.hide(); }, 200); //改变标志位
				showMenu = false;
			};
		}

		//点击打开侧滑菜单；
		document.getElementById("show").addEventListener('tap',openMenu);
		//在android4.4中的swipe事件，需要preventDefault一下，否则触发不正常
		//故，在dragleft，dragright中preventDefault
		window.addEventListener('dragright', function(e) {
			e.detail.gesture.preventDefault();
		});
		window.addEventListener('dragleft', function(e) {
			e.detail.gesture.preventDefault();
		});
		//主界面向右滑动，若菜单未显示，则显示菜单；否则不做任何操作；
		window.addEventListener("swipeleft", openMenu);
		//主界面向左滑动，若菜单已显示，则关闭菜单；否则，不做任何操作；
		window.addEventListener("swiperight", closeMenu);
		//menu页面向左滑动，关闭菜单；
		window.addEventListener("menu:swipeleft", closeMenu);
		//监听事件通知关闭mask
		window.addEventListener('closeMask',function(){
			closeMenu(true);
		});
		//重写mui.menu方法，Android版本menu按键按下可自动打开、关闭侧滑菜单；
		mui.menu = function() {
			showMenu?closeMenu():openMenu();
		};
	};
})