define(function(require, exports, module){
	
	exports.methods = {
		diary_detail : diary_detail,
		circle : circle,
		publish_comm : publish_comm,
		diary_comm : diary_comm
	};
	
	//日记详情
	function diary_detail(){
		var mask = new Mask();
		var diaryId = $.getUrlData().id;
		//引入图片预览
		require('mui.zoom.js');
		require('mui.previewimage.js');
		
		var vOption = {
			data : {
				title : '',
				content : '',
				imgs : [],
				date : '',
				day : '',
				user_name : '',
				user_id : '',
				avatar : '',
				weather : '',
				feeling : '',
				id : '',
				fans:'',
				is_auth:'',
				is_subscribed:'',
				avatar : '',
				template : ''
			},
			methods : { give : give , addSub : addSub , share : share ,openIm : openIm},
			cycle:{
				created : function(){
					//DOM加载完毕这执行图片预览方法
					this.$nextTick(function(){
						mui.previewImage();
						//处理部分元素高度
						var AutoHeightDom = this.$el.querySelectorAll('.autoHeight');
						var H = (window.innerWidth - 30) * 0.43 + 'px';
						mui.each(AutoHeightDom,function(i,item){
							item.style.height = H;
						});
					});
				}
			}
		};
		var v = require('newvue').methods.vue(vOption);
		mask.show();
		//获取日记详情
		$.ajax({
			url:API.DIARYDETAIL,
			data : {id : diaryId},
			success:function(r){
				mask.close();
				r = r.data;
				v.title = r.title;
				v.content = r.content;
				v.template = r.template;
				v.user_name = r.user.nickname || r.user.diarysn;
				v.user_id = r.user_id;
				v.phone = r.user_name;
				v.feeling = r.feeling;
				v.weather = r.weather;
				v.id = r.id;
				v.date = $.getTimes(r.created_at).timerStr;
				v.day = WEEK[new Date(parseInt(r.created_at) * 1000).getDay()];
				v.imgHost = HOST;
				v.fans = r.user.fans;
				v.is_auth = r.user.is_auth;
				v.is_subscribed = r.user.is_subscribed;
				//分割图片路径
				if(r.images){
					if(r.images.indexOf(',') != -1){
						v.imgs = r.images.split(',');
					}else{
						v.imgs = [r.images];
					};
				}else{
					v.imgs = [];
				};
				var avatar = r.user.head_img;
				v.avatar = avatar?HOST + avatar:'';
			},
			error : function(){
				mask.close();
			}
		});
		
		//打赏按钮点击
		function give(){
			mui.prompt('打赏金额','','打赏',null,function(e){
				alert('开发中');
			})
		};
		
		//关注按钮
		function addSub(uid){
			var _this = this;
			addSubscribedId(uid,function(result){
				mui.toast(result.data);
				if(result.success){
					_this.is_subscribed = true;
					//通知圈子列表，查看信息界面更新
					mui.plusReady(function(){
						
						var circleView = plus.webview.getWebviewById('circle');
						var friendView = plus.webview.getWebviewById('friend_info');
						
						if(circleView){
							mui.fire(circleView,'update');
						};
						
						if(friendView){
							mui.fire(friendView,'update');
						};
						
					});
				};
			});
		};
		
		//分享按钮
		function share(){
			//引入分享组件
			var _this = this;
			require.async('share.js',function(e){
				var share = e.share;
				var mask = new Mask();
				var option = {
					title : _this.title,
					content : _this.content.replace('&&__&&',''),
					name : 'weixin'
				};
				mask.show();
				share(option,function(){
					mask.close();
					mui.toast('分享成功');
				},function(){
					mask.close();
					mui.toast('分享失败');
				});
			});
		};
		
		//打开私信聊天
		function openIm(){
			var dataJson = {
				userId : v.user_id,
				name : v.user_name,
				portraitUri : v.avatar
			};
			openView({url : '../index/msg_im.html' , id : 'msg_im', data : dataJson});
		};
		
	};
	//日记圈
	function circle(){
		
		var vOption = {
			data : {datas : []},
			methods : {
				getDate : function(val){
					return $.getTimes(val).timerStr;
				},
				addSub : addSub
			},
			//生命周期
			cycle : {
				created : getDateList
			}
		};
		var v = require('newvue').methods.vue(vOption);
		
		//监听更新
		window.addEventListener('update',getDateList);
		
		//获取数据列表
		function getDateList(){
			var mask = new Mask();
			mask.show();
			$.ajax({
				url:API.DIARYCIRCLE,
				data : {sort:'-created_at'},
				success:function(result){
					mask.close();
					if(!result.success)return;
					
					mui.each(result.data,function(i,item){
						if(!item.user)return;
						var avatar = item.user.head_img;
						result.data[i].user.head_img = avatar?HOST + avatar:'';
						result.data[i].content = item.content.replace('&&__&&','');
					});
					v.datas = result.data;
				},
				error:function(){
					mask.close();
				}
			});
		};
		
		//添加关注
		function addSub(uid){
			var _this = this;
			addSubscribedId(uid,function(result){
				mui.toast(result.data);
				if(result.success){
					mui.each(_this.datas,function(i,item){
						if(item.user_id == uid){
							_this.datas[i].user.is_subscribed = true;
						};
					});
				};
			});
		};
		
	};
	
	//发表评论
	function publish_comm(id,v){
		var score;
		var userInfo = JSON.parse(localStorage.getItem('selfUserInfo'));
		//分数点击事件
		mui('.fen').on('tap','i',function(){
			var iAll = mui('.fen i');
			mui.each(iAll,function(i,item){
				item.classList.remove('active');
			});
			
			for(var i=0;i<=this.dataset.index;i++){
				iAll[i].classList.add('active');
			};
		});
		
		//提交
		mui('.publish_comm')[0].addEventListener('tap',function(){
			var content = mui('#content')[0].value;
			score = mui('.fen i.active').length;
			if(!content.length){
				mui.toast('评论内容不能输入空');
				return;
			};
			
			subData(content,score);
		});
		
		//提交数据
		function subData(content,score){
			var mask = new Mask();
			var subJson = {
				"data[content]" : content,
				"data[score]" : score
			};
			mask.show();
			$.ajax({
				type:"post",
				data : subJson,
				url:API.PUBLISH_COMM + '&id=' + id,
				success:function(result){
					mask.close();
					mui.toast(result.data);
					if(result.success){
						//刷新评论列表
						var vData = {
							user_id : userInfo.id,
							created_at:parseInt(new Date().getTime() / 1000),
							diary_id : id,
							head_img : userInfo.head_img,
							nickname : userInfo.nickname,
							score : score,
							username : userInfo.username,
							content : content
						};
						v.datas.unshift(vData);
						mui('#content')[0].value = '';
						mui('.comm_push')[0].classList.toggle('show');
					};
				},
				error:function(){mask.close();}
			});
		};
		
	};
	
	//评论列表
	function diary_comm(){
		var data = $.getUrlData();
		var title = decodeURI(data.title);
		var id = data.id;
		var comm_push = mui('.comm_push')[0];
		//发表按钮
		mui('.publish')[0].addEventListener('tap',function(){
			comm_push.classList.toggle('show');
		});
		
		//引入vue
		var vOption = {
			el : '.data_list',
			data : { datas :[] }
		};
		var v = require('newvue').methods.vue(vOption);
		
		getCommList();
		
		//监听刷新列表事件
		window.addEventListener('reloadList',getCommList);
		
		//获取评论列表
		function getCommList(){
			var mask = new Mask();
			mask.show();
			$.ajax({
				url:API.GETCOMMLIST,
				data:{id : id , sort:'-created_at'},
				success:function(result){
					mask.close();
					//处理时间
					mui.each(result.data,function(i,item){
						var avatar = item.head_img;
						result.data[i].head_img = avatar?HOST + avatar:'';
						result.data[i].created_at = $.getTimes(item.created_at).timerStr;
					});
					v.datas = result.data;
				},
				error:function(){mask.close();}
			});
		};
		
		//发表评论
		publish_comm(id,v);
	};
	
});