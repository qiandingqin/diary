var $ = {

	//解析url路径并返回
	analysis : function(url,type){
		if(!url){
			url = type === 'data'?window.location.search:window.location.pathname;
		};
		if(type !== 'data')url = url.split('/');
		return url;
	},
	
	//获取文件名
	getFileName : function(isSuffix,url){
		var urlData = this.analysis(url,'file');
		urlData = urlData[urlData.length-1];
		if(isSuffix && urlData.indexOf('.') != -1)urlData = urlData.split('.')[0];
		return urlData;
	},
	
	//获取get参数
	getUrlData : function(url){
		var urlData = this.analysis(url,'data');
		//处理返回get数据
		if(!urlData){
			//如果不存在数据
			return urlData;
		}else{
			urlData = urlData.substring(1,urlData.length);
			urlData = urlData.indexOf('&') == -1?[urlData]:urlData.split('&');
		};
		
		var obj = {};
		for(var i=0;i<urlData.length;i++){
			var dataArr =  urlData[i].split('=');
			obj[dataArr[0]] = dataArr[1];
		};
		//组装为对象返回
		return obj;
	},
	
	//获取目录
	getDirName : function(url){
		var urlData = this.analysis(url,'dir');
		return urlData[urlData.length-2];
	},
	
	//二次封装mui ajax
	ajax : function(obj){
		mui.ajax({
			url : obj.url,
			type : obj.type || 'get',
			data : obj.data || {},
			dataType : obj.dataType || 'json',
			headers : obj.headers || {},
			timeout : AJAX_TIMEOUT,
			success: function(result){
				if(obj.dataType == 'xml'){
					var xmlInfo = result.querySelector('INFO');
					var xmlResult = result.querySelector('RESULTS').innerHTML;
					if(xmlInfo || xmlResult == '32'){
						obj.error&&obj.error(result);
						mui.alert('抱歉,没有查询到此条码 我们会努力添加');
						return;
					};
				}else{
					if(!result || !result.success){
						if(result.data.indexOf('操作拒绝') == -1){
							mui.alert(result.data);
						};
					};
				};
				obj.success&&obj.success(result);
			},
			error : function(a,b,c){
				if(b === 'timeout'){
					mui.alert('访问服务器超时,请重试');
				}else{
					alert('系统错误');
				};
				obj.error&&obj.error();
			}
		});
	},
	//组装url参数
	assembleData : function(url,data){
		var str = '';
		for(var key in data){
			str += key + '=' + data[key] + '&';
		};
		str = str.substring(0,str.length-1);
	
		if(url.indexOf('?') == -1){
			str = '?' + str;
		}else{
			str = '&' + str;
		};
		return url + str;
	},
	//解析时间戳
	getTimes : function(str){
		var timeString = {};
		var timer;
		var nDate;
		//返回对象,2个子对象,date为日期对象,timerStr为拼接好的日期 若传入的是日期格式则返回时间戳
		//日期解析成时间戳
		str += '';
		if(str.indexOf('-') != -1 || str.indexOf('/') != -1){ 
			timeString.timerStr = new Date(str).getTime() / 1000;
		}else{
		//时间戳解析成日期	
			nDate = new Date(str * 1000);
			timeString.date = nDate;
			timeString.timerStr = nDate.getFullYear() + '-' + (nDate.getMonth() + 1) + '-' + nDate.getDate();
			timeString.timerStr += ' ' + nDate.getHours() + ':' + nDate.getMinutes();
		};
		return timeString;
	},
	//获取当前日期
	getDate : function(){
		return $.getTimes(new Date().getTime() / 1000).timerStr;
	},
	//正则验证
	regExp : function(method,str){
		
		var regExps = {
			phonecode : /^1\d{10}$/
		};
		
		return regExps[method]?regExps[method].test(str):'method is not find';
	},
	//获取今日，本周，本月开始，结束时间戳
	GetUnix : function(){
        this.nowDate = new Date();
        this.year = this.nowDate.getFullYear();
        this.month = this.nowDate.getMonth();
        this.day = this.nowDate.getDay();
        this.dates = this.nowDate.getDate();
   	},
   	//过滤数组下指定相同的json
   	filterArrJson: function(arr,str){
		//简单过滤掉数据下重复的json
		var newArr = [];
		for(var i in arr){
			var off = true;
			//比较新数组
			for(var k in newArr){
				if(newArr[k][str] === arr[i][str]){
					off = false;
					break;
				};
			};
			
			if(off){
				newArr.push(arr[i]);
				off = false;
			};
		};
		return newArr;
	},
	//判断JSON 是否为空
	isEmptyObject : function(e) {  
		for (var t in e){
			return 1;
		};
	},
};

//获取今日
$.GetUnix.prototype.getNowDate = function(){
    //获取今天0点
    var nowDateFirst = new Date(this.year,this.month,this.dates).getTime();
    //获取今天23.59.59
    var nowDateLast = new Date(this.year,this.month,this.dates,23,59,59).getTime();
    return {gt : nowDateFirst / 1000,lt : nowDateLast / 1000};
};

//获取本周
$.GetUnix.prototype.getNowDay = function(){
    var currentDate = this.nowDate;
    //返回date是一周中的某一天    
    var week = currentDate.getDay();  
    //返回date是一个月中的某一天    
    var month = currentDate.getDate();  
    //一天的毫秒数    
    var millisecond = 1000 * 60 * 60 * 24;  
    //减去的天数    
    var minusDay = week != 0 ? week - 1 : 6;  
    //本周 周一    0点
    var nowDayFirst = new Date(currentDate.getTime() - (minusDay * millisecond));
    var datesFirst = nowDayFirst.getDate();
    var nowDayFirstUnix = new Date(this.year,this.month,datesFirst).getTime();
    //本周 周日    23.59.59
    var nowDayLast = new Date(nowDayFirst.getTime() + (6 * millisecond));
    var datesLast = nowDayLast.getDate();
    var nowDayLastUnix = new Date(this.year,this.month,datesLast,23,59,59).getTime();
    return {gt : nowDayFirstUnix / 1000,lt : nowDayLastUnix / 1000};
};

//获取当月
$.GetUnix.prototype.getNowMonth = function(){
    //获取本月第一天
    var nowMonthFirst = new Date(this.year,this.month).getTime();
    //获取本月最后一天
    var nowMonthLast = new Date(this.year,this.month+1,0,23,59,59).getTime();
    return {gt : nowMonthFirst / 1000,lt : nowMonthLast / 1000};
};

//重写localStorage.setItem()
//var orignalSetItem = window.localStorage.setItem;
//window.localStorage.setItem = function(key,newValue){
//  var setItemEvent = new Event("setItem");
//  setItemEvent.newValue = newValue;
//  window.dispatchEvent(setItemEvent);
//  orignalSetItem.apply(this,arguments);
//};

//为系统对象提供删除置顶下标的数组
Array.prototype.removeItem = function(i){
	i+='';
	if(!i || isNaN(i) || i >= this.length)return this;
	return this.splice(i,1);
};