define(function(require, exports, module){
	
	exports.methods = {
		diary_detail : diary_detail,
		circle : circle
	};
	
	//日记详情
	function diary_detail(){
		var mask = new Mask();
		var diaryId = $.getUrlData().id;
		var vOption = {
			data : {
				title : '',
				content : '',
				imgs : [],
				date : '',
				day : '',
				user_name : '',
				user_id : '',
				weather : '',
				feeling : '',
				id : ''
			},
			methods : { give : give}
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
				v.content = r.content,
				v.user_name = r.user_name;
				v.user_id = r.user_id;
				v.feeling = r.feeling;
				v.weather = r.weather;
				v.id = r.id;
				v.date = $.getTimes(r.created_at).timerStr;
				v.day = new Date(parseInt(r.created_at) * 1000).getDay();
				v.imgHost = HOST;
				//分割图片路径
				if(r.images){
					if(r.images.indexOf(',') != -1){
						v.imgs = r.images;
					}else{
						v.imgs = r.images.split(',');
					};
				}else{
					v.imgs = [];
				};
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
	};
	
	function circle(){
		
		var vOption = {
			data : {datas : []},
			methods : {getDate : function(val){
				return $.getTimes(val).timerStr;
			}},
			//生命周期
			cycle : {
				created : getDateList
			}
		};
		var v = require('newvue').methods.vue(vOption);
		
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
					v.datas = result.data;
				},
				error:function(){
					mask.close();
				}
			});
			
		};
		
	};
	
});