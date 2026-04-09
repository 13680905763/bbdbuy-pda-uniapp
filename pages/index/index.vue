<template>
  <view class="container">

    <!-- 用户信息展示 -->
    <view class="user-info" v-if="userInfo">
      <image class="avatar" :src="userInfo.avatar || defaultAvatar" mode="aspectFill" />
      <view class="user-details">
        <text class="username">欢迎你，{{ userInfo.name || '用户' }}</text>
        <view v-if="isDevEnv" class="env-badge">测试环境</view>
      </view>
    </view>

    <view class="content">
      <view v-for="group in groupedItems" :key="group.title" class="group">
        <text class="group-title">{{ group.title }}</text>

        <view class="items">
          <view v-for="item in group.items" :key="item.label" class="item-card" @click="handleItemClick(item)">
            <view class="item-icon">{{ item.icon }}</view>
            <text class="item-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="footer" @click="onCheckUpdate">
      <text>当前版本 v{{ appVersion }}</text>
      <text class="footer-hint">点击检查更新</text>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { getUserInfo } from '../../services/auth'
import { baseURL, ENV_CONFIG } from '@/services/request'
// import { checkUpdate } from '@/utils/update.js' // TODO: 后端接口就绪后取消注释

const appVersion = ref('--')


const userInfo = reactive({
  name: '',
  avatar: ''
})
const defaultAvatar = '/static/default-avatar.png' // 你项目里放一个默认头像图片

const isDevEnv = computed(() => baseURL === ENV_CONFIG.dev)

const groupedItems = reactive([
  {
    title: '📥 入库',
    items: [
      { label: '收货', icon: '📦', path: '/pages/warehouse-inbound/receive/receive' },
      { label: '拍照', icon: '📷', path: '/pages/warehouse-inbound/inspect/inspect' },
      { label: '上架', icon: '📥', path: '/pages/warehouse-inbound/shelve/shelve' },
    ],
  },
  {
    title: '📤 出库',
    items: [
      { label: '拣货', icon: '🛒', path: '/pages/warehouse-outbound/pick/pick' },
      { label: '拍照', icon: '📷', path: '/pages/warehouse-outbound/pack/pack' },
	  { label: '上架', icon: '📥', path: '/pages/warehouse-outbound/putaway/putaway' },
	   { label: '发货', icon: '🚚', path: '/pages/warehouse-outbound/send/send' },
    ],
  },
  {
    title: '🛠 其他功能',
    items: [
      // { label: '库存盘点', icon: '📋', path: '/pages/warehouse-tools/inventory' },
      // { label: '异常处理', icon: '⚠️', path: '/pages/warehouse-tools/exceptions' },
	  // { label: '库存盘点', icon: '📋', path: '/pages/devpage/devpage' },
	  // { label: '异常处理', icon: '⚠️', path: '/pages/devpage/devpage' },
      { label: '退出登录', icon: '🚪', action: 'logout' },
    ],
  },
])

function handleItemClick(item) {
  if (item.action === 'logout') {
    uni.showModal({
      title: '确认退出登录？',
      confirmText: '确认退出',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          uni.removeStorageSync('cookie');
          uni.showToast({ title: '已退出登录', icon: 'success' });
		  uni.reLaunch({ url: '/pages/index/index' });
        }
      }
    });
  } else if (item.path) {
    uni.navigateTo({ url: item.path });
  }
}



// 手动检查更新 —— 后端接口就绪后取消注释
const onCheckUpdate = () => {
  // // #ifdef APP-PLUS
  // checkUpdate({ silent: false, showProgress: true })
  // // #endif
  // #ifndef APP-PLUS
  uni.showToast({ title: '仅 App 端支持热更新', icon: 'none' })
  // #endif
}

onMounted(async () => {
  const res = await getUserInfo()
  
  console.log('主页验证登录',res);
  userInfo.name = res.data.nickName
  userInfo.avatar = res.data.avatarFilePath
  
  // 获取真实版本号
  // #ifdef APP-PLUS
  plus.runtime.getProperty(plus.runtime.appid, (info) => {
    appVersion.value = info.version || '--'
  })
  // #endif
  // #ifndef APP-PLUS
  appVersion.value = '1.0.0 (H5)'
  // #endif
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #fff7f2;
  padding: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.content {
}

.footer {
  text-align: center;
  padding-top: 10px;
  color: #999;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-hint {
  color: #f0700c;
  font-size: 11px;
  margin-top: 4px;
  text-decoration: underline;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  font-size: 18px;
  color: #333;
}

.env-badge {
  display: inline-block;
  background-color: #ff9800;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  align-self: flex-start;
}

/* 你的其他样式保持不变 */

.group {
  margin-bottom: 24px;
}

.group-title {
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

.items {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.item-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  width: calc(33.333% - 8px);
  height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.3s ease;
}

.item-card:active {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.item-icon {
  font-size: 28px;
  color: #f0700c;
  margin-bottom: 6px;
}

.item-label {
  font-size: 14px;
  color: #333;
  text-align: center;
}
</style>
