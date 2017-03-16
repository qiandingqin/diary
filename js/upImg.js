define(function(require, exports, module){
	//封装上传图片
	function UpLoadImg(files,exports){
	
		this.files = files;
		this.host = exports.host;
		this.name = exports.name;
	};
	
	//获取图片的预览
	UpLoadImg.prototype.GetUrl = function(){
		var imgPathArr = [];
		for(var i = 0 ;i < this.files.length; i++){
			var path = window.URL.createObjectURL(this.files[i]);
			imgPathArr.push(path);
		};
		return imgPathArr;
	};
	
	//上传
	UpLoadImg.prototype.Up = function(callback){
		var Http = new XMLHttpRequest();
	    //创建form
	    var form = new FormData();
	    //配置参数
	    Http.open('post',this.host,true);
		//添加数据
	    for(var i = 0 ; i < this.files.length;i++){
	        form.append(this.name,this.files[i]);
	    };
		
		//上传状态事件
		Http.onreadystatechange = function(ev){
	   		
	   		if(ev.currentTarget.readyState == 4 && ev.currentTarget.status == 200){
	   			//上传成功
	   			callback&&callback(JSON.parse(ev.currentTarget.response));
	   		};
	   	};
	   	
		//上传进度事件
	   	Http.upload.addEventListener('progress',function(ev){
	   		//监听进度
	   		//console.log(ev);
	   		
	   	}, false);
	
		Http.send(form);
	};
	
	exports.UpLoadImg = UpLoadImg;
});