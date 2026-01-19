<template>
  <view class="container">

    <view class="login-box">
      <text class="title">BBD 仓库小助手</text>

      <input v-model="form.mobile" type="text" placeholder="请输入手机号" class="input" />
      <input v-model="form.password" type="password" placeholder="请输入密码" class="input" />

      <button class="login-button" @click="onLogin">登录</button>

      <view class="extra">
        <text class="forgot" @click="onForgotPassword">忘记密码?</text>
      </view>

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
import { login } from '@/services/auth'
import { baseURL, setBaseURL, ENV_CONFIG } from '@/services/request'

const form = ref({
  mobile: 'admin',
  password: '123456',
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
  uni.request({
    url: baseURL + '/users/login',
    method: 'POST',
    data: form.value,
    header: {
      'Content-Type': 'application/json',
      'X-Language': 'en',
      'X-Currency': 'USD',
      'X-Timezone': 'Asia/Shanghai',
    },
    success: (res) => {
      console.log('res', res);
      if (res.data.success) {
        const setCookie = res.cookies[0];
        console.log('Set-Cookie:', setCookie,res);
        // 存入本地缓存
        if (setCookie) {
          uni.setStorageSync('cookie', setCookie);
          uni.showToast({ title: '登录成功', icon: 'success' });
          uni.reLaunch({ url: '/pages/index/index' })
        }
      } else {
        uni.showToast({
          title: res.data.msg,
          icon: 'none',
        });
      }
    },
    fail: (err) => {
      uni.showToast({
        title: '网络异常',
        icon: 'none',
      });
      reject(err);
    },
  });





  //   // 示例登录请求，可替换为你实际的登录接口
  //   const res =   await login(form.value)
  // console.log('res',res);
  //   if (res.success) {
  //     uni.showToast({ title: '登录成功', icon: 'success' })
  //     // uni.reLaunch({ url: '/pages/index/index' })
  //   } else {
  //     uni.showToast({ title: res.data.message || '登录失败', icon: 'none' })
  //   }
}

const onForgotPassword = () => {
  uni.showToast({ title: '请联系管理员重置密码', icon: 'none' })
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
