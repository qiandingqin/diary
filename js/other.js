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
		pushset : pushset,
		security : security,
		about : about,
		autograph:autograph,
		constellation:constellation,
		edit_nickname:edit_nickname,
		edit_sex:edit_sex,
		edit_address:edit_address,
		edit_email:edit_email,
		edit_school:edit_school,
		edit_wx:edit_wx,
		edit_qq:edit_qq,
		verify:verify
	};
	
	//用户资料中心
	function memberinfo(){
		var vOption = {
			data : {user : JSON.parse(localStorage.getItem('selfUserInfo'))},
			methods : {logout : logoutBtn,setAvatar:setAvatar}
		};
		var v = require('newvue').methods.vue(vOption);
		
		//监听刷新事件
		window.addEventListener('reloadUserInfo',function(){
			v.user = JSON.parse(localStorage.getItem('selfUserInfo'));
		});
		
		//修改头像
		function setAvatar(e){
			var files = e.target.files;
			var src = window.URL.createObjectURL(files[0]);
			this.user.head_img = src;
			//引入上传图片组件
			require.async('upImg.js',function(e){
				var option = {
					host : API.IMAGESUPLOAD,
					name : 'images[]'
				};
				var up = new e.UpLoadImg(files,option);
				var mask = new Mask();
				mask.show('上传中..');
				up.Up(function(result){
					if(!result.success)return;
					var path = result.data.success[0].path;
					//提交用户头像图片路径
					$.ajax({
						url:API.SETAVATAR,
						data:{headimg:path},
						success:function(result){
							mask.close();
							mui.toast(result.data);
							var userinfo = JSON.parse(localStorage.getItem('selfUserInfo'));
							userinfo.head_img = HOST + path;
							localStorage.setItem('selfUserInfo',JSON.stringify(userinfo));
							//通知“我的”界面刷新
							mui.plusReady(function(){
								var targetView = plus.webview.getWebviewById('member');
								mui.fire(targetView,'update');
							});
						},error:function(){
							mask.close();
						}
					});
				});
			});
		};
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
	
	//设置星座
	function constellation(){
		//监听单选框
		mui('.mui-table-view-radio')[0].addEventListener('selected',function(e){
			var val = e.target.querySelector('em').innerText;
			setUserInfo('data[constellation]',val);
		});
	};
	
	//设置昵称
	function edit_nickname(name){
		var data = decodeURI($.getUrlData().data);
		var inputVal = mui('input')[0];
		var saveBtn = mui('.save')[0];
		var dataName = name || 'data[nickname]';
		inputVal.value = data;
		
		saveBtn.addEventListener('tap',function(){
			if(!inputVal.value){
				mui.toast('不能输入空');
				return;
			};
			setUserInfo(dataName,inputVal.value);
		});
	};
	
	//设置性别
	function edit_sex(){
		//监听单选框
		mui('.mui-table-view-radio')[0].addEventListener('selected',function(e){
			var selVal = e.target.querySelector('a').innerText;
			var val;
			switch (selVal){
				case '保密':
					val = 0;
					break;
				case '男':
					val = 1;
					break;
				case '女':
					val = 2;
					break;
			};
			setUserInfo('data[sex]',val);
		});
	};
	
	//设置地址
	function edit_address(){
		var cityInput = mui('input')[0];
		var addressInput = mui('input')[1];
		var saveBtn = mui('.save')[0];
		
		require.async('mui.picker.js',function(){
			require.async('mui.poppicker.js',function(){
				var cityPicker = new mui.PopPicker({layer: 3});
				cityPicker.setData(cityData3);
				
				//区域点击弹出选择菜单
				cityInput.addEventListener('tap',function(){
					var _this = this;
					cityPicker.show(function(items){
						var selVal = items[0].text+'	'+items[1].text+'	'+items[2].text;
						_this.value = selVal;
					});
				});
			});
		});
		
		saveBtn.addEventListener('tap',function(){
			var val = cityInput.value + '	' + addressInput.value;
			setUserInfo('data[address]',val);
		});
	};
	
	//设置邮箱
	function edit_email(){
		edit_nickname('data[email]');
	};
	
	//设置学校
	function edit_school(){
		edit_nickname('data[school]');
	};
	
	//设置微信号
	function edit_wx(){
		edit_nickname('data[wechat]');
	};
	
	//设置QQ号
	function edit_qq(){
		edit_nickname('data[qq]');
	};
	
	//用户签名
	function autograph(){
		var userInfo = JSON.parse(localStorage.getItem('selfUserInfo'));
		var signature = userInfo.signature;
		var text = mui('#signature_text')[0];
		text.value = signature;
		
		mui('.save')[0].addEventListener('tap',function(){
			if(!text.value){
				mui.toast('不能输入空');
				return;
			};
			setUserInfo('data[signature]',text.value,function(){
				userInfo.signature = text.value;
				localStorage.setItem('selfUserInfo',JSON.stringify(userInfo));
			});
		});
		
	};
	
	//实名认证
	function verify(){
		
		var filesArr = [];
		
		//提交
		mui('.verify_sumbit')[0].addEventListener('tap',function(){
			var mask = new Mask();
			var inputText = mui('input[type=text],input[type=tel]');
			var inputFile = mui('input[type=file]');
			//检测姓名，身份证号是否为空
			for(var i=0,l=inputText.length;i<l;i++){
				
				if(!inputText[i].value){
					mui.toast(inputText[i].placeholder);
					return;
				};
				
			};
			
			//检测所需上传图片数量是否为空
			for(var i=0,l=inputFile.length;i<l;i++){
				
				if(!inputFile[i].value){
					var msg = inputFile[i].parentNode.parentNode.querySelector('p').innerText;
					mui.toast('请添加' + msg);
					return;
				};
				
			};
			
			mask.show();
			//先上传图片文件 成功后提交数据
			require.async('upImg.js',function(e){
				var upJson = {
					host : API.IMAGESUPLOAD,
					name : 'images[]'
				};
				var up = new e.UpLoadImg(filesArr,upJson);
				up.Up(function(result){
					if(!result.success){
						mask.close();
						return;
					};
					
					//组装提交数据
					var filepaths = result.data.success;
					var subJson = {
						"data[real_name]" : inputText[0].value,
						"data[card_sn]" : inputText[1].value,
						"data[card_front]" : filepaths[0].path,
						"data[card_back]" : filepaths[1].path,
						"data[card_hand]" : filepaths[2].path,
					};
					
					submitData(subJson,mask);
				});
			});
			
		});
		
		//监听选择图片
		mui('body').on('change','input[type=file]',function(){
			this.disabled = true;
			filesArr.push(this.files[0]);
			
			//预览
			var src = window.URL.createObjectURL(this.files[0]);
			this.parentNode.querySelector('img').src = src;
			
		});
		
		//提交数据
		function submitData(subJson,mask){
			$.ajax({
				type:"post",
				url:API.NAMEAUTH,
				data : subJson,
				success:function(result){
					mask.close();
					mui.toast(result.data);
					if(result.success){
						mui.back();
					};
				},
				error:function(){
					mask.close();
				}
			});
		};
	};
	
	//注册 注册包含同时注册IM，跟自己服务器
	function reg(){
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
			regUser();
			
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
							window.localStorage.setItem('id',result.data.id);
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
						}else{
							mui.toast(result.data);
						}
						
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
	};
	
	//登录页面 
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
					if(!res.success){
						mui.toast(res.data);
						return;
					};
					window.localStorage.setItem('phone',dataJson.phone);
					window.localStorage.setItem('pwd',dataJson.pwd);
					window.localStorage.setItem('id',res.data.user_id);
					openView({ url : '../index/index.html' },function(){
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
					mui.toast(result.data);
					if(!result || !result.success)return;
					//修改成功 退出登录后退
					mui.plusReady(function(){
						var firstView = plus.webview.currentWebview().opener();
						if(firstView.id == 'login'){
							logout(function(){
								mui.back();
							});
						}else{
							mui.back();
						};
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
		var files = {
			"default" : [null,null,null],
			"temp1" : [null,null],
			"temp2" : [null,null]
		};
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
		function change(ev,index){
			var _this = ev.target;
			var oImg = _this.parentNode.querySelector('img');
			oImg.src = window.URL.createObjectURL(_this.files[0]);
			files[v.template][index] = _this.files[0];
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
			var filesArr = [];
			
			for(var i=0,l=files[v.template].length;i<l;i++){
				if(files[v.template][i]){
					filesArr.push(files[v.template][i]);
				};
			};
			//判断用户是否需要上传图片
			if(filesArr.length){
				//引入上传图片组件
				require.async('upImg.js',function(e){
					//提交图片上传
					var upOp = {
						host : API.IMAGESUPLOAD,
						name : 'images[]'
					};
					
					var up = new e.UpLoadImg(filesArr,upOp);
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
						
						//通知日记圈，我的日记刷新数据
						mui.plusReady(function(){
							
							var circleView = plus.webview.getWebviewById('circle');
							var mydiaryView = plus.webview.getWebviewById('mydiary');
							
							if(circleView){
								mui.fire(circleView,'update');
							};
							if(mydiaryView){
								mui.fire(mydiaryView,'update');
							};
							
						});
						
						openView({url : '../circle/diary_detail.html',data : {id : result.data.id}},function(){
							fireCloseView();
						});
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
			require.async('../js/mui.picker.min.js',function(){
				var options = {"type":"date","beginYear":2014,"endYear":2018};
				var picker = new mui.DtPicker(options);
				picker.show(function(rs){
					v.date = rs.value;
					picker.dispose();
				});
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
	
	//安全中心
	function security(){
		
	};
	
	//关于我们
	function about(){
		//获取最新版本
		var update = require('update.js').methods;
		update.getVersion(function(result){
			var versioncode = document.getElementById("versioncode");
			versioncode.innerText = result.version;
		});
		
		mui.plusReady(function(){
			//获取当前版本
			plus.runtime.getProperty(plus.runtime.appid,function(info){
				document.getElementById("curVersion").innerText = info.version;
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