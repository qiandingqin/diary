define(function(require,exports,module){
	
	exports.down = function(option,suc,err){
		if(!option.url)return;
		//创建下载任务
		mui.plusReady(function(){
			var filepath = '_downloads/chat/img/';
			var fileSuffix = option.url.split('.');
			fileSuffix = fileSuffix[fileSuffix.length-1];
			var d = plus.downloader.createDownload(option.url,{filename:filepath + option.filename},function(data,status){
				
				if ( status == 200 ) { 
					var filePath = plus.io.convertLocalFileSystemURL( data.filename );
					suc&&suc(data,filePath);
					console.log('下载完成',filePath)
				} else {
					err&&err(data);
					console.log('下载失败');
				} ;
				
			});
			
			
			//监听下载状态
			d.addEventListener('statechanged',function(data,status){
				console.log('下载中',status);
			});
			
			d.start();
			
		});
		
	};
	
});
