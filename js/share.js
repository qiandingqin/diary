//分享模块
define(function(require, exports, module){
	//其他控制器
	exports.share = function(option,suc,err){
		
		mui.plusReady(function(){
			//获取分享服务通道
			plus.share.getServices(function(server){
				var server = getShareServer(server,option.name);
				var shareJson = {
					title : option.title || '',
					content : option.content || ''
				};
				
				//授权
				server.authorize(function(d){
					d.send(shareJson,function(){
						suc&&suc();
					},function(){
						err&&err();
					});
				},function(){
					mui.toast('授权失败，取消分享');
				});
			});
		});
		
		
		//获取指定服务通道
		function getShareServer(obj,server){
			for(var i in obj){
				if(obj[i].id === server){
					return obj[i];
				};
			};
			return obj;
		};
		
	};
});