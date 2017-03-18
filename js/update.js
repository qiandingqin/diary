//热更新文件
define(function(require,exports,module){
	
	//获取最新版本
	function getVersion(cb){
		$.ajax({
			url:API.GETVERSION,
			dataType: 'json',
			success:function(data){
				cb&&cb(data);
			},
			error:function(){
				console.log('错误')
			}
		});
	};
	
	function up(){
		
		mui.plusReady(function(){
			
			plus.runtime.getProperty(plus.runtime.appid,function(inf){
				//获取当前版本号
				var currentVersion = _version(inf.version);
				//获取服务端版本号
				getVersion(function(result){
					var serverVersion = _version(result.version);
					//判断是否为最新客户端
					if(serverVersion <= currentVersion )return;
					//判断是否为显式更新
					if(result.update_type === 'show'){
						//显示询问
						_showIsUpDate(function(){
							_showDown(result);
						});
					}else{
						//不显示直接升级，下次重启生效
						_downFile(API.GETVERSION + result.file_url,true);
					}
				});
			});
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
	function _downFile(url,isHide){
		//下载文件
		var down = require('plusdown.js').down;
		var filepath = '_downloads/update/';
		var filename = url.split('/');
		filename = filename[filename.length-1];
		//配置下载参数
		var downOption = {
			url : url,
			filename : filename,
			filepath : filepath
		};
		if(isHide){
			down(downOption,function(data,path){
				downloadSuc(data,path,true);
			},downloadErr);
		}else{
			down(downOption,downloadSuc,downloadErr,downloading);
		};
	};
	
	//下载成功
	function downloadSuc(data,path,isHide){
		//安装应用
		plus.runtime.install(path,{},function(){
			//重启应用
			if(!isHide){
				plus.runtime.restart();
			};
		},function(err){
			mui.alert('安装失败');
			if(!isHide){
				updateBox.parentNode.removeChild(updateBox);
			};
		});
		
	};
	
	//下载失败
	function downloadErr(){
		
	};
	
	//下载进度事件
	function downloading(data){
		var updateBox = document.querySelector('.updateBox');
		var sizeTxt = updateBox.querySelector('.total');
		var updateStatus = updateBox.querySelector('.updateStatus');
		var totalSize = Math.floor(data.totalSize / Math.pow(1024,2) * 100) / 100;
		var progress = parseInt(data.downloadedSize / data.totalSize * 100);
		progress = isNaN(progress)?0:progress;
		//显示下载总大小
		sizeTxt.innerText = totalSize;
		//显示下载进度百分比
		updateStatus.innerText = '正在下载: '+ progress +'%';
		//进度显示
		mui('.updateBox').progressbar().setProgress(progress);
	};
	
	//显示下载进度
	function _showDown(data){
		
		//创建更新说明元素
		var str = _createDescDom(data.desc);
		//创建元素
		var updateBox = document.createElement('div');
		updateBox.classList.add('updateBox');
		updateBox.innerHTML += '<h4>更新说明</h4>';
		updateBox.innerHTML += '<div class="updateDesc">'+ str +'</div>';
		updateBox.innerHTML += '<p class="mui-progressbar mui-progressbar-in"><span></span></p>';
		updateBox.innerHTML += '<p class="updateSize">本次更新大小：<span class="total">0.00</span>MB</p>';
		updateBox.innerHTML += '<p class="updateStatus">初始化下载</p>';
		
		//插入文档
		document.body.appendChild(updateBox);
		
		//启动下载任务
		_downFile(API.GETVERSION + data.file_url);
	};
	
	//创建更新说明元素
	function _createDescDom(data){
		
		if(!data)return '';
		var strArr;
		var str = '';
		if(data.indexOf('|') == -1){
			strArr = [data];
		}else{
			strArr = data.split('|');
		};
		
		for(var i=0;i<strArr.length;i++){
			str += '<p>'+ (i+1) + '. ' + strArr[i] +'</p>'
		};
		
		return str;
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
