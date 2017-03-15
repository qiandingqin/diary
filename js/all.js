mui.plusReady(function(){
	//隐藏滚动条
	plus.webview.currentWebview().setStyle({scrollIndicator:'none'});
	//监听所有a标签
	mui('a,.open').each(function(i,item){
		item.addEventListener('tap',function(ev){
			ev.preventDefault();
			var l = this.href || this.dataset.href;
			if(!l || l === 'javascript:;' || l.indexOf('#') != -1)return;
			if(!ev.target.classList.contains('mui-action-back'))ev.stopPropagation();
			mui.openWindow({
				url : l,
				id : l,
				show : {duration : 200,aniShow:'pop-in'}
			})
		});
	});
});