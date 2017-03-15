//创建连接
var conn = new WebIM.connection({
    https: WebIM.config.https,
    url: WebIM.config.xmppURL,
    isAutoLogin: WebIM.config.isAutoLogin,
    isMultiLoginSessions: WebIM.config.isMultiLoginSessions
});
//添加回调函数
conn.listen({
    onOpened: function ( message ) {          //连接成功回调
        // 如果isAutoLogin设置为false，那么必须手动设置上线，否则无法收消息
        // 手动上线指的是调用conn.setPresence(); 如果conn初始化时已将isAutoLogin设置为true
        // 则无需调用conn.setPresence();             
        //conn.setPresence();
        console.log('连接成功');
        var newMsg = {
			time : $.getTimes('1489084054').timerStr,
			user : '我',
			text : '连接成功',
			isSelf : test,
		};
        v.msg.push(newMsg);
    },  
    onClosed: function ( message ) {
    	console.log('连接关闭');
    },         //连接关闭回调
    onTextMessage: function ( message) {
    	console.log(message);
    	var newMsg = {
			time : $.getTimes('1489084054').timerStr,
			user : message.from,
			text : message.data,
			isSelf : message.from == localStorage.getItem,
		};
        v.msg.push(newMsg);
    },    //收到文本消息
    onEmojiMessage: function ( message ) {
    	console.log('连接成功1');
    },   //收到表情消息
    onPictureMessage: function ( message ) {
    	console.log('连接成功2图片消息',message);
    	var options = {url: message.url};
        options.onFileDownloadComplete = function (a,b,c) {
            // 图片下载成功
            var wUrl = window.URL.createObjectURL(a);
            console.log(wUrl);
            var newMsg = {
				time : $.getTimes('1489084054').timerStr,
				user : message.from,
				text : '',
				isSelf : message.from == localStorage.getItem,
				img : wUrl
			};
	        v.msg.push(newMsg);
            console.log('Image download 成功!');
        };
        options.onFileDownloadError = function () {
            // 图片下载失败
            console.log('Image download failed!');
        };
        WebIM.utils.download.call(conn, options);
    }, //收到图片消息
    onCmdMessage: function ( message ) {
    	console.log('连接成功3');
    },     //收到命令消息
    onAudioMessage: function ( message ) {
    	console.log('连接成功4');
    },   //收到音频消息
    onLocationMessage: function ( message ) {
    	console.log('连接成功5');
    },//收到位置消息
    onFileMessage: function ( message ) {
    	console.log('连接成功6');
    },    //收到文件消息
    onVideoMessage: function (message) {
    	console.log('连接成功7');
        var node = document.getElementById('privateVideo');
        var option = {
            url: message.url,
            headers: {
              'Accept': 'audio/mp4'
            },
            onFileDownloadComplete: function (response) {
                var objectURL = WebIM.utils.parseDownloadResponse.call(conn, response);
                node.src = objectURL;
            },
            onFileDownloadError: function () {
                console.log('File down load error.')
            }
        };
        WebIM.utils.download.call(conn, option);
    },   //收到视频消息
    onPresence: function ( message ) {},       //收到联系人订阅请求、处理群组、聊天室被踢解散等消息
    onRoster: function ( message ) {},         //处理好友申请
    onInviteMessage: function ( message ) {},  //处理群组邀请
    onOnline: function () {},                  //本机网络连接成功
    onOffline: function () {},                 //本机网络掉线
    onError: function ( message ) {
    	//alert('登录失败')
    	console.log('连接出毛病' , message);
    },          //失败回调
    onBlacklistUpdate: function (list) {       //黑名单变动
        // 查询黑名单，将好友拉黑，将好友从黑名单移除都会回调这个函数，list则是黑名单现有的所有好友信息
        console.log(list);
    }
});

function regIm(phone,pwd,cb){
	
	regBtn.addEventListener('click',function(){
		var inputs = document.querySelectorAll('input');
		var options = { 
		    username: phone,
		    password: pwd,
		    nickname: phone,
		    appKey: WebIM.config.appkey,
		    success: function (data) { 
		    	cb&&cb(data);
		    },
		    error: function () { 
		    	mui.alert('注册失败');
		    },
		    apiUrl: WebIM.config.apiURL
		};
		//注册
	  	conn.registerUser(options);
	});
	
};
loginIm();
//登录
function loginIm(){
	
	var options = { 
	  apiUrl: WebIM.config.apiURL,
	  user: localStorage.getItem('phone'),
	  pwd: localStorage.getItem('pwd'),
	  appKey: WebIM.config.appkey
	};
	conn.open(options);
};

//获取token
function getToken(cb){
	var url = 'http://a1.easemob.com/1158170308178456/book/token';
	mui.ajax({
		//headers : {"Authorization":'YWMtifof6gSYEeezFnmRyCCHLfUQ3kAEjhHnpr4FJoFIvgAMul5QBJgR57bR-75e-PgeAwMAAAFase6NigBPGgAVBBQOnoHxDCKr3jYwEKREjbhpD8X9Afm9JX9CQl4LNw'},
		url : url,
		data:{
		  "grant_type": "client_credentials",
		  "client_id": "YXA69RDeQASOEeemvgUmgUi-AA",
		  "client_secret": "YXA6I1ZqCMy_ofGGy50z9XrRwKy5Kkw"
		},
		success:function(d){
			cb&&cb(d);
		}
	});
};

//获取未读消息
function getoffline(user,cb){
	getToken(function(token){
		mui.ajax({
			url : 'http://a1.easemob.com/1158170308178456/book/users/'+user+'/offline_msg_count',
			headers:{Authorization:'Bearer '+ token.access_token},
			success:function(result){
				cb&&cb(result);
			}
		});
	});
};
