//API接口设置
var HOST = 'http://bj.cmyba.cn/';
var IM_HOST = 'http://a1.easemob.com/';
var API = {
	//环信 IM接口
	//获取IM token
	IM_GETTOKEN : '/token',
	//注册
	REG : HOST + '?r=site/signup',
	//登录
	LOGIN : HOST + '?r=site/login',
	//退出登录
	LOGOUT : HOST + '?r=site/logout',
	//发送短信
	SEND_CODE : HOST + '?r=site/sendcode',
	//重置密码
	RESETPWD : HOST + '?r=site/reset-password-by-mobile',
	//重置密码短信 
	RESETPWDCODE : HOST + '?r=site/request-password-reset-by-mobile',
	//查询用户信息
	MEMBERINFO : HOST + '?r=user/index',
	//添加好友
	ADDFRIEND : HOST + '?r=pfriend/add',
	//删除好友
	DELETEFRIEND : HOST + '?r=pfriend/delete',
	//待处理好友列表
	PENDING : HOST + '?r=pfriend/pending',
	//好友列表
	FRIENDS : HOST + '?r=pfriend/index',
	//接受添加好友申请
	ACCEPT : HOST + '?r=pfriend/request-accept',
	//拒绝好友申请
	REFUSE : HOST + '?r=pfriend/request-refuse',
	//发布日记
	RESEASE : HOST + '?r=diary/create',
	//日记圈
	DIARYCIRCLE : HOST + '?r=diary/index',
	//单篇日记详情
	DIARYDETAIL : HOST + '?r=diary/view',
	//多图片上传
	IMAGESUPLOAD: HOST + '?r=site/image-uploads',
	//获取最新版本
	GETVERSION : 'http://bj.cmyba.cn:801',
	//获取指定ID用户信息
	GETUSERINFO : HOST + '?r=user/view',
	//添加关注
	ADDSUB : HOST + '?r=user/subscribe',
	//取消关注
	CANCELSUB : HOST + '?r=user/subscribe-cancel',
	//设置用户头像
	SETAVATAR : HOST + '?r=user/set-head-img',
	//发表评论
	PUBLISH_COMM : HOST + '?r=diary/add-comment',
	//获取日记评论列表
	GETCOMMLIST : HOST + '?r=diary/get-comments',
	//设置用户信息
	SETINFO : HOST + '?r=user/update'
};
//常量设置
var AJAX_TIMEOUT = 8000;				//ajax请求时间
var GET_TOKEN_DATA = {
	grant_type : 'client_credentials',
	client_id  : 'YXA69RDeQASOEeemvgUmgUi-AA',
	client_secret:'YXA6I1ZqCMy_ofGGy50z9XrRwKy5Kkw'
};
var IM_GET_HEADER = 'Bearer ';
var STR = {
	REGSUC : '注册成功',
	REGERR : '注册失败',
	PHONE_EXISTS : '手机号已存在',
	USER_NOT_EXISTS : '手机号不存在',
	LOGINERR : '登录失败 请检查手机号或密码',
	LOGINSUC : '登录成功',
	GETCODE : '获取验证码',
};

//发布日记界面 天气，心情，字体选择项

var WEATHER = ['阴','晴','雨','雪','雾','霾','雹'];
var MOOD = ['极好','一般般','郁闷','不开心','想哭'];
var FONT = ['大字体','中字体','小字体'];
