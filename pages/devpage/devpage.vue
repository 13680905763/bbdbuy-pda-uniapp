<template>
  <view class="page">
    <view class="content">
      <view class="icon">🚧</view>
      <view class="title">功能开发中</view>
      <view class="subtitle">当前功能处于开发中，敬请期待！</view>
    </view>
  </view>
</template>

<script setup>
// 这里可以放一些逻辑，比如页面标题设置
// uni.setNavigationBarTitle({ title: '开发中' })
</script>

<style scoped>
.page {
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background-color: #f9f9f9;
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
}
.content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 80%;
  max-width: 320px;
}
.icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 8px;
}
.subtitle {
  font-size: 16px;
  color: #888;
}
</style>
