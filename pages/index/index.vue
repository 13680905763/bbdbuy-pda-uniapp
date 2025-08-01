<template>
  <view class="container">

    <!-- 用户信息展示 -->
    <view class="user-info" v-if="userInfo">
      <image class="avatar" :src="userInfo.avatar || defaultAvatar" mode="aspectFill" />
      <text class="username">欢迎你，{{ userInfo.name || '用户' }}</text>
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
  </view>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getUserInfo } from '../../services/auth'
// 模拟接口，真实替换成你项目中的接口调用


const userInfo = reactive({
  name: '',
  avatar: ''
})
const defaultAvatar = '/static/default-avatar.png' // 你项目里放一个默认头像图片

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
      // { label: '拣货', icon: '🛒', path: '/pages/warehouse-outbound/pick' },
      // { label: '打包拍照', icon: '✅', path: '/pages/warehouse-outbound/pack' },
      // { label: '出库', icon: '🎁', path: '/pages/warehouse-outbound/ship' },
	  { label: '拣货', icon: '🛒', path: '/pages/devpage/devpage' },
	  { label: '打包拍照', icon: '✅', path: '/pages/devpage/devpage' },
	  { label: '出库', icon: '🎁', path: '/pages/devpage/devpage' },
    ],
  },
  {
    title: '🛠 其他功能',
    items: [
      // { label: '库存盘点', icon: '📋', path: '/pages/warehouse-tools/inventory' },
      // { label: '异常处理', icon: '⚠️', path: '/pages/warehouse-tools/exceptions' },
	  { label: '库存盘点', icon: '📋', path: '/pages/devpage/devpage' },
	  { label: '异常处理', icon: '⚠️', path: '/pages/devpage/devpage' },
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


// // 模拟登出接口，真实使用请替换
// async function outLogin() {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       uni.showToast({ title: '已退出登录', icon: 'success' })
//       resolve()
//     }, 800)
//   })
// }

onMounted(async () => {
  const res = await getUserInfo()
  console.log('res',res);
  userInfo.name = res.data.nickName
  userInfo.avatar = res.data.avatarFilePath
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

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
}

.username {
  font-weight: 600;
  font-size: 18px;
  color: #333;
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
