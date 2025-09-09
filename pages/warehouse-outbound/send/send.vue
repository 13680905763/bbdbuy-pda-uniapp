<template>
  <view class="page">
    <view class="container">
      <!-- 货架编码输入 + 扫码按钮 -->
      <view class="input-wrapper" v-if="!shelfCode">
        <input
          class="input"
          v-model="shelfInput"
          placeholder="请扫描发货单号"
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

      <!-- 已扫描拣货单号 -->
      <view v-if="shelfCode" class="shelf-title">
        拣货单号：{{ shelfCode }}
        <uni-icons
          type="close"
          size="20"
          color="#f56c6c"
          style="margin-left: 8px;"
          @click="clearShelfCode"
        />
      </view>
	 <view v-if="packageList.length > 0" style="margin-top: 20rpx; overflow-x: auto; max-width: 100vw;">
	   <uni-table
	     border
	     stripe
	     emptyText="暂无包裹信息"
	     style=" width: 100%; "
	   >
	     <uni-tr>
	       <uni-th align="center" width='30'>包裹编号</uni-th>
	       <uni-th align="center" width='20'>仓位</uni-th>
	       <uni-th align="center" width='10'>状态</uni-th>
	     </uni-tr>
	    <uni-tr v-for="(item, index) in packageList" :key="index">
	      <uni-td align="center">{{ item.packageCode || '--' }}</uni-td>
	      <uni-td align="center">{{ item.locationCode || '--' }}</uni-td>
	      <!-- <uni-td align="center">{{ item.quantity || '--' }}</uni-td> -->
	      <uni-td align="center">
	        <template v-if="item.status === 0">
	          <!-- 待拣货，显示扫码图标，点击触发扫码事件 -->
	          <uni-icons
	            type="scan"
	            size="24"
	            color="grey"
	            style="cursor: pointer;"
	            @click="handleScanPick(item)"
	            title="点击扫码拣货"
	          />
	        </template>
	        <template v-else-if="item.status === 1">
	          <!-- 已拣货，显示打勾图标，不可点击 -->
	          <uni-icons
	            type="checkmarkempty"
	            size="24"
	            color="#f0700c"
	            title="已拣货"
	          />
	        </template>
	        <template v-else>
	          <!-- 其他状态可以显示-- -->
	          --
	        </template>
	      </uni-td>
	    </uni-tr>
	   </uni-table>
	 </view>
    </view>

    <!-- 提交按钮 -->
    <view class="footer">
     <button
       class="btn-submit"
       :disabled="!shelfCode || packageList.length === 0 || loading || !packageList.every(item => item.status === 1)"
       @click="onSubmit"
     >
       <text v-if="loading">发货中...</text>
       <text v-else>出库发货</text>
     </button>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { getSendScan,submitSend} from '@/services/warehouse-outbound'
const shelfInput = ref("");
const shelfCode = ref("");
const packageList = ref([]);
const loading = ref(false);

const shelfInputRef = ref(null);
const handleScanPick = (item) => {
  uni.scanCode({
    success: (res) => {
      const scannedCode = res.result || "";
      // 这里可以校验 scannedCode 和 item.packageCode 是否匹配
      if (scannedCode === item.packageCode) {
        uni.showToast({ title: "发货成功", icon: "success" });
        // 这里更新状态为已拣货，比如：
        item.status = 1;
        // 如果你的数据是响应式的，这里改了状态界面会自动更新
      } else {
        uni.showToast({ title: "条码不匹配", icon: "none" });
      }
    },
    fail() {
      uni.showToast({ title: "扫码失败", icon: "none" });
    },
  });
};
// 清空拣货单号
const clearShelfCode = async () => {
  shelfCode.value = "";
  packageList.value = [];
  // await nextTick(() => {
  //   shelfInputRef.value?.focus();
  // });
};

// 扫码拣货单号
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

const onShelfConfirm = async () => {
  const val = shelfInput.value.trim();
  if (!val) {
    uni.showToast({ title: "请输入发货单号", icon: "none" });
    return;
  }
  loading.value = true;
 try {
    const res = await getSendScan(val); // 请求拣货单数据
	console.log('res扫描',res);
    if (res && res.success ) {
      shelfCode.value = val;
      packageList.value = 
		[ {
			  packageCode:res.data.packingPackageCode,
			  locationCode:res.data.location.locationCode,
			  // quantity:item.item.quantity,
			  status:0
		  }]
	   || [];
	  // console.log('pickdata', res.data.map(item=>{
		 //  return {
			//   packageCode:item.packageCode,
			//   locationCode:item.locationCode,
			//   // quantity:item.item.quantity,
			//   status:0
		 //  }
	  // }));
      shelfInput.value = "";
    } else {
      uni.showToast({ title: res?.message || "未找到发货单信息", icon: "none" });
    }
  } catch (err) {
	  console.log('err',err);
    uni.showToast({ title: "请求失败", icon: "none" });
  } finally {
    loading.value = false;
  }
};



// 提交拣货
const onSubmit = async () => {
  if (!shelfCode.value || packageList.value.length === 0) {
    uni.showToast({ title: "缺少发货单或包裹信息", icon: "none" });
    return;
  }

  loading.value = true;
  try {
    const payload = {
      shippingCode: shelfCode.value,
      packingPackageCode: packageList.value[0].packageCode
    };
console.log('payload',payload);
    // 请求后端接口
    const res = await submitSend(payload); // 这里用你封装的 API 方法
	console.log('发货接口',res);
    if (res.code === 200) {
      uni.showToast({ title: "发货完成", icon: "success" });
      // 清空数据，回到初始状态
      shelfCode.value = "";
      packageList.value = [];
      // await nextTick(() => {
      //   shelfInputRef.value?.focus();
      // });
    } else {
      uni.showToast({ title: res.message || "发货失败", icon: "none" });
    }
  } catch (err) {
    console.error(err);
    uni.showToast({ title: "请求失败", icon: "none" });
  } finally {
    loading.value = false;
  }
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
