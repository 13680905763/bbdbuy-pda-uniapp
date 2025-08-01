<template>
  <view class="container">
    <!-- 顶部输入区 -->
    <view class="header">
      <view class="input-wrapper">
        <input
          v-model="barcodeInput"
          type="text"
          placeholder="请扫描商品条码，回车确认"
          @confirm="onConfirm"
          focus
          class="input"
        />
        <uni-icons
          type="scan"
          size="28"
          color="#f0700c"
          class="scan-icon"
          @click="startScan"
        />
      </view>
      <view class="info-text">已扫描 {{ list.length }} 个包裹</view>
    </view>

    <!-- 中间包裹列表，撑满剩余空间并可滚动 -->
    <scroll-view class="list-container" scroll-y>
      <view
        v-for="item in list"
        :key="item.barcode"
        :class="['list-item', item.type === 1 ? 'type-ok' : 'type-unknown']"
      >
        <text class="item-name">{{ item.name }}</text>
        <text class="item-barcode">{{ item.barcode }}</text>
      </view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="submit-wrapper">
      <button
        :disabled="list.length === 0 || loading"
        @click="handleSubmit"
        class="submit-btn"
      >
        {{ loading ? "提交中..." : "提交收货" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { getReceiveScan,receiveSubmit } from '@/services/warehouse-inbound'
const barcodeInput = ref("");
const list = ref([]);
const loading = ref(false);

function startScan() {
  uni.scanCode({
    success: (res) => {
      if (res.result) {
        barcodeInput.value = res.result;
        handleScan(res.result);
      }
    },
    fail() {
      uni.showToast({ title: "扫码失败", icon: "none" });
    },
  });
}

async function handleScan(barcode) {
  if (!barcode) return;

  // 条码重复判断
  if (list.value.some((item) => item.barcode === barcode)) {
    uni.showToast({ title: "该条码已存在！", icon: "none" });
    return;
  }

  try {
    // 调用真实接口
    const res = await getReceiveScan(barcode);

    if (res.data === "WMS_RECEIVE_SCAN_UNKNOWN_LOGISTICS_CODE") {
      uni.showToast({ title: "未知物流", icon: "none" });
      list.value.unshift({ name: "未知物流", barcode, type: 0 });
    } else {
      uni.showToast({ title: "成功获取物流信息", icon: "success" });
      list.value.unshift({
        name: res.data.logisticsCompany,
        barcode: res.data.logisticsCode,
        type: 1,
      });
    }
  } catch (e) {
    uni.showToast({ title: "请求失败", icon: "none" });
  }
}

function onConfirm() {
  if (barcodeInput.value.trim()) {
    handleScan(barcodeInput.value.trim());
    barcodeInput.value = "";
  }
}

async function handleSubmit() {
  if (list.value.length === 0) {
    uni.showToast({ title: "没有可提交的包裹", icon: "none" });
    return;
  }
  loading.value = true;
  console.log('list.value.map((item) => item.barcode)',list.value.map((item) => item.barcode));
  try {
    const res = await receiveSubmit({logisticsCodeList:list.value.map((item) => item.barcode)});
    console.log("res", res);
    if (res.data === "SUCCESS") {
      uni.showToast({ title: "收货提交成功", icon: "success" });
      list.value = [];
	  barcodeInput.value = ''
    } else {
      uni.showToast({ title: "提交失败，请稍后重试", icon: "none" });
    }
  } catch (e) {
    uni.showToast({ title: "提交失败，请检查网络", icon: "none" });
  } finally {
    loading.value = false;
  }
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 满屏高度 */
  padding: 20px;
  box-sizing: border-box;
  background-color: #fff7f2;
}

/* 顶部区域 */
.header {
  flex-shrink: 0; /* 不收缩 */
}

/* 输入框样式 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 8px;
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

.info-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

/* 中间滚动列表区域 */
.list-container {
  flex: 1; /* 撑满剩余空间 */
  overflow-y: auto;
  background-color: white;
  border-radius: 12px;
  box-sizing: border-box;
  padding: 12px;
  box-shadow: 0 2px 8px rgb(240 112 12 / 0.2);
}

.list-item {
  display: flex;
  padding: 5px 0;
  font-size: 16px;
  background-color: #fff;
}

.item-name,
.item-barcode {
  flex: 2;
  padding: 8px;
  border: 1px solid #ddd;
  box-sizing: border-box;
  word-break: break-word;
  font-weight: bold;
}
.item-name {
  flex: 1 !important;
}
/* 去掉最后一行下边框 */
.list-item:last-child {
  border-bottom: none;
}

/* 颜色区分状态 */
.type-ok .item-name,
.type-ok .item-barcode {
  color: green;
}

.type-unknown .item-name,
.type-unknown .item-barcode {
  color: red;
}



/* 底部提交按钮 */
.submit-wrapper {
  flex-shrink: 0;
  margin-top: 12px;
}

.submit-btn {
  width: 100%;
  height: 40px;
  background-color: #f0700c;
  color: white;
  border: none;
  font-weight: bold;
  font-size: 16px;
}

.submit-btn:disabled {
  background-color: #f3a36b;
}
</style>