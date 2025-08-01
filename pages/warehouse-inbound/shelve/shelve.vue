<template>
  <view class="page">
    <view class="container">
      <!-- 货架编码输入 + 扫码按钮 -->
      <view class="input-wrapper" v-if="!shelfCode">
        <input
		class="input"
          v-model="shelfInput"
          placeholder="请扫描货架编码"
          confirm-type="done"
          @confirm="onShelfConfirm"
          ref="shelfInputRef"
          type="text"
          input-border
          clearable
          maxlength="50"
         
        />
	<uni-icons
	  type="scan"
	  size="28"
	  color="#f0700c"
	  class="scan-icon"
	  @click="scanShelfCode"
	/>
      
      </view>

      <view v-if="shelfCode" class="shelf-title">货架位置：{{ shelfCode }}</view>

      <!-- 包裹条码输入 + 扫码按钮 -->
      <view v-if="shelfCode" class="input-wrapper" style="margin-top: 20rpx;">
        <input
		class="input"
          v-model="packageInput"
          placeholder="请扫描包裹条码"
          confirm-type="done"
          @confirm="onPackageConfirm"
          ref="packageInputRef"
          type="text"
          input-border
          clearable
          maxlength="50"
       
        />
		<uni-icons
		  type="scan"
		  size="28"
		  color="#f0700c"
		  class="scan-icon"
		  @click="scanPackageCode"
		/>
       
      </view>

      <view class="list-title">已扫描包裹列表（{{ packageList.length }}）</view>

      <scroll-view
        style="flex: 1; margin-top: 10rpx;"
        scroll-y
        :scroll-with-animation="true"
      >
        <view v-if="packageList.length === 0" class="empty-text">
          暂无包裹
        </view>

        <view v-for="item in packageList" :key="item.packageCode" class="item">
          <view class="item-left">
            <view class="item-code">{{ item.packageCode }}</view>
            <view class="item-status">{{ item.putawayStatus || '未知状态' }}</view>
          </view>
          <button class="btn-delete" @click="deletePackage(item.packageCode)">
            删除
          </button>
        </view>
      </scroll-view>
    </view>

    <view class="footer">
      <button
        class="btn-submit"
        :disabled="!shelfCode || packageList.length === 0 || loading"
        @click="onSubmit"
      >
        <text v-if="loading">提交中...</text>
        <text v-else>提交上架</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref,nextTick  } from "vue";

const shelfInput = ref("");
const shelfCode = ref("");
const packageInput = ref("");
const packageList = ref([]);
const loading = ref(false);

const shelfInputRef = ref(null);
const packageInputRef = ref(null);
import { getShelveScan,submitShelveConfirm} from '@/services/warehouse-inbound'


// 扫码货架编码
const scanShelfCode = () => {
  uni.scanCode({
    success: (res) => {
      shelfInput.value = res.result || "";
      onShelfConfirm();
    },
    fail() {
      uni.showToast({ title: "扫码失败", icon: "none" });
    },
  });
};

// 扫码包裹条码
const scanPackageCode = () => {
  uni.scanCode({
    success: (res) => {
      packageInput.value = res.result || "";
      onPackageConfirm();
    },
    fail() {
      uni.showToast({ title: "扫码失败", icon: "none" });
    },
  });
};

const onShelfConfirm =async () => {
  const val = shelfInput.value.trim();
  if (!val) {
    uni.showToast({ title: "请输入货架编码", icon: "none" });
    return;
  }
  shelfCode.value = val;
  shelfInput.value = "";
  // 聚焦包裹输入框
  await nextTick(() => {
    // 这里的代码会在 DOM 更新后执行
	packageInputRef.value?.focus();
  });

};

const onPackageConfirm = async () => {
  const val = packageInput.value.trim();
  if (!val) return;

  if (packageList.value.find((item) => item.packageCode === val)) {
    uni.showToast({ title: "该包裹已扫描", icon: "none" });
    packageInput.value = "";
    return;
  }

  try {
	  console.log('val',val);
    const res = await getShelveScan(val);
	console.log('res',res);
    if (res.data === "WMS_PUTAWAY_SCAN_UNKNOWN_PACKAGE_CODE") {
      uni.showToast({ title: "未知包裹", icon: "none" });
    } else {
      uni.showToast({ title: "成功获取包裹信息" , icon: "none"});
      packageList.value.unshift(res.data);
    }
  } catch {
    uni.showToast({ title: "读取包裹信息失败", icon: "none" });
  }
  packageInput.value = "";
};

const deletePackage = (code) => {
  packageList.value = packageList.value.filter((item) => item.packageCode !== code);
};

const onSubmit = async () => {
  if (!shelfCode.value) {
    uni.showToast({ title: "请先扫描货架编码", icon: "none" });
    return;
  }
  if (packageList.value.length === 0) {
    uni.showToast({ title: "请先扫描包裹", icon: "none" });
    return;
  }

  loading.value = true;
  try {
    const res = await submitShelveConfirm({
      locationCode: shelfCode.value,
      packageCodeList: packageList.value.map((p) => p.packageCode),
    });
	console.log('res',res);
    if (res.success) {
      uni.showToast({ title: "上架成功" });
      shelfCode.value = "";
      packageList.value = [];
	  await nextTick(() => {
		shelfInputRef.value?.focus();
	  });
     
    } else {
      uni.showToast({ title: res.msg, icon: "none" });
    }
  } catch {
    uni.showToast({ title: "提交失败", icon: "none" });
  }
  loading.value = false;
};
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.container {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.input {
  flex: 1;
  height: 40px;
  padding: 0 44px 0 12px;
  border-radius: 8px;
  border: 1px solid #f0700c;
  font-size: 16px;
  background-color: white;
}
.scan-icon {
  position: absolute;
  right: 12px;
  cursor: pointer;
  user-select: none;
}

.shelf-title {
  font-weight: bold;
  font-size: 30rpx;
  margin-top: 15rpx;
}
.list-title {
  font-weight: bold;
  margin-top: 20rpx;
  font-size: 28rpx;
}
.empty-text {
  text-align: center;
  color: #999;
  margin-top: 20rpx;
}
.item {
  display: flex;
  justify-content: space-between;
  padding: 15rpx 10rpx;
  box-sizing: border-box;
  border-bottom: 1rpx solid #ddd;
}
.item-left {
  display: flex;
  flex-direction: column;
}
.item-code {
  font-weight: 600;
  font-size: 28rpx;
  color: green;
}
.item-status {
  font-size: 24rpx;
  color: #666;
  margin-top: 4rpx;
}
.btn-delete {
	margin: 0;
  background-color: #f56c6c;
  color: white;
  border-radius: 4rpx;
  padding: 6rpx 10rpx;
  font-size: 24rpx;
}
.btn-submit {
  width: 100%;
  height: 40px;
  background-color: #f0700c;
  color: white;
  border: none;
  font-weight: bold;
  font-size: 16px;
}
.btn-submit:disabled {
  background-color: #d9d9d9;
  color: #999;
}
.footer {
  padding: 20rpx;
}
</style>
