<script>
	// import { checkUpdate } from '@/utils/update.js' // TODO: 后端接口就绪后取消注释
	
	export default {
		onLaunch: function() {
			console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
			console.log('App Launch')
			
			// ✅ 启动时检查 WGT 热更新（静默模式）—— 后端接口就绪后取消注释
			// // #ifdef APP-PLUS
			// setTimeout(() => {
			// 	checkUpdate({ silent: true, showProgress: false })
			// }, 2000)
			// // #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
	}
	uni-page-body {
		height: 100%;
	}
	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
