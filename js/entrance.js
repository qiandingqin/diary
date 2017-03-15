//seajs模块配置
seajs.config({
	//设置路径
	paths : {'js':'../../js'},
	//设置模块别名
	alias : {
		mui : 'js/mui.min.js',
		vue : 'js/vue.js',
		constant : 'js/constant.js',
		functions   : 'js/functions.js',
		common   : 'js/common.js',
		//IM SDK 路径
		im_config : 'js/webim.config.js',			//IM 配置文件
		strophe   : 'js/trophe-1.2.8.min.js',
		websdk    : 'js/websdk-1.4.10.js',
		newvue    : '../js/newvue.js',
		im        : '../js/im.js'
	},
	//加载必须预先加载的模块
	preload :['mui','constant','functions','common']
});
//加载依赖文件
seajs.use(['mui','vue','constant','functions','common'],function(){
	
	//全局控制初始化
	init();
	
	//加载控制器 (目录名就是控制器名,index目录下的所有文件对应js下index.js)
	seajs.use('js/' + $.getDirName(),function(obj){
		//执行方法 (文件名就是方法名)
		var method = obj.methods[$.getFileName(true)];
		method&&method();
	});
	
});
