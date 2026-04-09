<template>
  <view class="container">

    <view class="login-box">
      <text class="title">BBD 仓库小助手</text>

      <input v-model="form.mobile" type="text" placeholder="请输入手机号" class="input" />
      <input v-model="form.password" type="password" placeholder="请输入密码" class="input" />

      <button class="login-button" @click="onLogin">登录</button>


       <!-- 环境切换区域 -->
       <view class="env-switch" @click="onSwitchEnv">
        <text class="env-text">当前环境: {{ currentEnvName }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { login, getPublicKey } from '@/services/auth'
import { baseURL, setBaseURL, ENV_CONFIG } from '@/services/request'
import JSEncrypt from 'jsencrypt'

const form = ref({
  mobile: '',
  password: '',
})

const currentEnvUrl = ref(baseURL)

const currentEnvName = computed(() => {
  return currentEnvUrl.value === ENV_CONFIG.dev ? '测试环境 (Dev)' : '正式环境 (Prod)'
})

const onSwitchEnv = () => {
  uni.showActionSheet({
    itemList: ['正式环境 (Prod)', '测试环境 (Dev)'],
    success: (res) => {
      if (res.tapIndex === 0) {
        setBaseURL(ENV_CONFIG.prod)
        currentEnvUrl.value = ENV_CONFIG.prod
      } else {
        setBaseURL(ENV_CONFIG.dev)
        currentEnvUrl.value = ENV_CONFIG.dev
      }
      uni.showToast({ title: '已切换环境', icon: 'none' })
    }
  })
}

const onLogin = async () => {
  if (!form.value.mobile || !form.value.password) {
    return uni.showToast({ title: '请输入手机号和密码', icon: 'none' })
  }
  try {
    // 1. 从后端获取公钥
    const publicKeyRes = await getPublicKey();

    const finalValues = { ...form.value };

    // 2. 用公钥加密用户名和密码
    if (publicKeyRes?.success && publicKeyRes?.data) {
      const encrypt = new JSEncrypt();
      let key = publicKeyRes.data;
      
      // 处理公钥格式：如果不是 PEM 格式，补全 PEM 头部并确保换行
      if (!key.includes('-----BEGIN PUBLIC KEY-----')) {
        key = `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
      }
      
      encrypt.setPublicKey(key);

      const encryptedMobile = encrypt.encrypt(form.value.mobile);
      const encryptedPassword = encrypt.encrypt(form.value.password);

      if (encryptedMobile && encryptedPassword) {
        finalValues.mobile = encryptedMobile;
        finalValues.password = encryptedPassword;
      } else {
        uni.showToast({ title: '加密失败，请检查公钥格式', icon: 'none' });
        return;
      }
    }

    // 3. 提交加密后的数据到登录接口
    const res = await login(finalValues);
    console.log('登录响应:', res);

    if (res.success) {
      uni.showToast({ title: '登录成功', icon: 'success' });
      // 成功跳转
      uni.reLaunch({ url: '/pages/index/index' })
    } else {
      uni.showToast({
        title: res.msg || '登录失败',
        icon: 'none',
      });
    }
  } catch (error) {
    console.error("提交异常:", error);
    uni.showToast({
      title: '网络异常或服务错误',
      icon: 'none',
    });
  }
}


</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
}



.login-box {
  padding: 60rpx 40rpx;
  background-color: rgba(255, 255, 255, 0.95);
  margin: 200rpx 40rpx 0;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.logo {
  width: 160rpx;
  margin: 0 auto 30rpx;
  display: block;
}

.title {
  display: flex;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
  color: #333;
}

.input {
  background-color: #f5f5f5;
  margin-bottom: 30rpx;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.login-button {
  background-color: #f0700c;
  color: #fff;
  font-size: 30rpx;
  border-radius: 8rpx;
  padding: 5rpx 0;
}

.extra {
  margin-top: 20rpx;
  text-align: right;
}

.forgot {
  color: #888;
  font-size: 24rpx;
  text-decoration: underline;
}

.env-switch {
  margin-top: 40rpx;
  text-align: center;
  padding-top: 20rpx;
  border-top: 1px solid #eee;
}

.env-text {
  color: #666;
  font-size: 26rpx;
}
</style>
