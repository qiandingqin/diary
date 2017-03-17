//热更新文件
define(function(require,exports,module){
	
	//获取最新版本
	function getVersion(cb){
		$.ajax({
			url:API.GETVERSION,
			dataType: 'json',
			success:function(data){
				console.log(data);
				cb&&cb(data);
			},
			error:function(){
				console.log('错误')
			}
		});
	};
	
	function up(){
		
		mui.plusReady(function(){
			//获取当前版本号
			var currentVersion = _version(plus.runtime.version);
			//临时模拟版本号
			currentVersion = 100;
			//获取服务端版本号
			getVersion(function(result){
				
				var serverVersion = _version(result.version);
				
				//判断是否为最新客户端
				if(serverVersion <= currentVersion )return;
				console.log(serverVersion);
				//判断是否为显式更新
				if(result.update_type === 'show'){
					//显示询问
					_showIsUpDate();
				}else{
					//不显示直接升级，下次重启生效
				}
				
			});
			console.log(currentVersion);
		});
	};
	
	//处理版本号字串，方便比较
	function _version(str){
		
		if(!str)return;
		
		var verArr = str.split('.');
		var versionCode = 0;
		for(var i=0;i<verArr.length;i++){
			versionCode += verArr[i];
		};
		
		return parseInt(versionCode);
	};
	
	//下载更新文件
	function _downFile(url,cb){
		
		//下载文件
		
	};
	
	//显示下载进度
	function _showDown(){
		
	};
	
	//显示询问是否更新
	function _showIsUpDate(cb){
		
		mui.confirm('检查到有新版本 是否升级？','更新提示',['下次再说','更新'],function(e){
			if(e.index)cb&&cb();
		});
		
	};
	
	exports.methods = {
		getVersion : getVersion,
		up : up
	};
});
