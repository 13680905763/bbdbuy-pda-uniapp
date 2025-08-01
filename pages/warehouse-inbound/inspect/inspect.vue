<template>
	<view class="container">
		<view class="input-wrapper">
			<input v-model="code" placeholder="请输入条码或扫码" class="input" @input="onInputChange" confirm-type="search" @confirm="onInputConfirm" />
			<uni-icons type="scan" size="28" color="#f0700c" class="scan-icon" @click="startScan" />
		</view>
		<view v-if="loading" class="loading-text">查询中...</view>
		<view v-if="error" class="error-text">{{ error }}</view>
		<view v-if="packageInfo" class="package-card" scroll-y>
			<!-- 商品信息：左右布局 -->
			<view class="package-content">
				<!-- 左边图片 -->
				<image class="package-image" :src="packageInfo?.skuPicUrl || packageInfo?.picUrl" mode="aspectFill"></image>
				<!-- 右边文字 -->
				<view class="package-info">
					<view class="package-title">{{ packageInfo.productTitle }}</view>
					<view class="package-detail">
						<view>数量: {{ packageInfo.quantity }}</view>
						<view>{{ packageInfo.sku?.propName_valueName }}</view>
					</view>
				</view>
			</view>
			<!-- 👇 服务拍照区域 -->
			<view class="service-photo-wrapper">
				<view v-for="(service, idx) in services" :key="idx" class="service-block">
					<view class="service-header">
						<text class="service-name">{{ service?.serviceName }}</text>
						<button class="photo-btn" @tap="handleTakePhoto(idx)">
							<text class="icon-camera">📷</text>
							拍照
						</button>
					</view>
					<view class="photo-list">
						<view v-for="(img, imgIdx) in serviceImages[idx] || []" :key="imgIdx" class="photo-item">
							<image :src="img.fileUrl" class="photo-thumb" mode="aspectFill" @tap="previewImage(img.fileUrl, idx)" />
							<text class="photo-delete" @tap="handleRemoveImage(img.id, idx)">✖</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 底部固定提交按钮 -->
		<view class="submit-wrapper" v-if="packageInfo">
			<button :disabled="loading" @click="handleSubmit" class="submit-btn">
				{{ loading ? '提交中...' : '提交拍照完成' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getInspectScan, getInspectScanPhoto, detInspectScanPhoto, uploadImage,submitInspectConfirm } from '@/services/warehouse-inbound';
import { baseURL } from '@/services/request'
const code = ref('');
const loading = ref(false);
const error = ref('');
const packageInfo = ref(null);
const services = ref(null);
const serviceImages = ref({});
function startScan() {
	uni.scanCode({
		success: (res) => {
			code.value = res.result || '';
			queryPackageInfo(code.value);
		},
		fail: () => {
			uni.showToast({ title: '扫码失败', icon: 'none' });
		}
	});
}

let debounceTimer;
function onInputChange() {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		if (code.value.trim()) {
			queryPackageInfo(code.value.trim());
		} else {
			packageInfo.value = null;
			error.value = '';
		}
	}, 500);
}

function onInputConfirm() {
	if (code.value.trim()) {
		if (!barcode) {
			uni.showToast({ title: '未识别到条纹码', icon: 'none' });
			return;
		}
		queryPackageInfo(code.value.trim());
	}
}
async function queryPackageInfo(barcode) {
	try {
		const res = await getInspectScan(barcode);
		console.log('res', res);
		if (res.success) {
			const data = res.data;
			packageInfo.value = res.data?.packageItem?.orderProduct;
			services.value = res.data?.inboundServiceItemList;
			console.log('resPackageInfo', res);
			for (let i = 0; i < res.data?.inboundServiceItemList?.length; i++) {
				const item = res.data?.inboundServiceItemList[i];
				await fetchPhotos(i, item);
			}
		} else {
			uni.showToast({ title: res.msg, icon: 'none' });
		}
	} catch (err) {
		uni.showToast({ title: '扫描失败，请重试', icon: 'none' });
	}
}

async function fetchPhotos(serviceIdx, item = {}) {
	const service = services.value[serviceIdx] || item;
	if (!service?.id) return;
	const res = await getInspectScanPhoto(service.id);
	if (res.success) {
		serviceImages.value = {
			...serviceImages.value,
			[serviceIdx]: res.data || []
		};
	}
}
function previewImage(currentUrl, serviceIndex) {
	const urls = (serviceImages.value[serviceIndex] || []).map((item) => item.fileUrl);
	console.log('imglist', urls, currentUrl);
	uni.previewImage({
		current: currentUrl, // 当前预览的图片
		urls, // 所有可左右滑动的图片
		indicator: 'number', // 显示页码
		loop: true // 循环查看
	});
}

const handleRemoveImage = async (imgId, serviceIdx) => {
	if (!imgId) {
		uni.showToast({ title: '无效的图片 ID', icon: 'none' });
		return;
	}

	const resConfirm = await uni.showModal({
		title: '确认删除',
		content: '确定要删除这张照片吗？',
		confirmText: '删除',
		cancelText: '取消'
	});

	if (!resConfirm.confirm) {
		// 用户取消删除
		return;
	}

	try {
		const res = await detInspectScanPhoto(imgId);
		console.log('res', res);
		if (res?.success) {
			uni.showToast({ title: res.msg || '删除成功', icon: 'success' });
			await fetchPhotos(serviceIdx);
		} else {
			uni.showToast({ title: res.msg || '删除失败', icon: 'none' });
		}
	} catch (error) {
		console.error('图片删除异常:', error);
		uni.showToast({ title: '图片删除异常', icon: 'none' });
	}
};

const handleTakePhoto = async (serviceIdx) => {
	try {
		const res = await uni.chooseImage({
			count: 1,
			sizeType: ['original', 'compressed'],
			sourceType: ['camera']
		});

		if (!res.tempFiles || res.tempFiles.length === 0) return;

		let file = res.tempFiles[0];
		let filePath = file.path;

		if (file.size > 1024 * 1024) {
			try {
				const compressRes = await uni.compressImage({
					src: filePath,
					quality: 80
				});
				filePath = compressRes.tempFilePath;
			} catch (err) {
				console.error('图片压缩失败:', err);
				uni.showToast({ title: '图片压缩失败，将尝试上传原图', icon: 'none' });
			}
		}

		// 🔄 显示 loading 提示
		uni.showLoading({ title: '上传中...', mask: true });

		const uploadTask = await new Promise((resolve, reject) => {
			uni.uploadFile({
				url: baseURL + '/inbound-service/upload',
				filePath,
				name: 'file',
				header: {
					'X-Language': 'en',
					'X-Currency': 'USD',
					'X-Timezone': 'Asia/Shanghai',
					Cookie: uni.getStorageSync('cookie') || ''
				},
				formData: {
					id: String(services.value[serviceIdx]?.id || ''),
					sort: String(serviceIdx)
				},
				success: (uploadRes) => {
					let data = uploadRes.data;
					try {
						data = JSON.parse(data);
					} catch {}
					if (data.success) {
						resolve(data);
					} else {
						reject(data);
					}
				},
				fail: (err) => {
					reject(err);
				}
			});
		});

		await fetchPhotos(serviceIdx);
		uni.showToast({ title: '上传成功', icon: 'success' });
	} catch (err) {
		console.error('拍照或上传失败:', err);
		uni.showToast({ title: '上传失败，请重试', icon: 'none' });
	} finally {
		// ✅ 不论成功失败都隐藏 loading
		uni.hideLoading();
	}
};

const handleSubmit = async () => {
  if (!services.value.length) return;

  const serviceIds = services.value.map(s => s.id); // 收集所有服务 ID

  try {
    loading.value = true;
	console.log('serviceIds',serviceIds);
    const res = await submitInspectConfirm(serviceIds);
console.log('handleSubmit',res,);
    if (res.success) {
      uni.showToast({
        title: "提交收货成功",
        icon: "success",
      });
      // 这里可以清空数据或跳转，比如：
      // services.value = [];
    } else {
      uni.showToast({
        title: `提交失败：${res?.msg || ''}`,
        icon: "none",
      });
    }
  } catch (err) {
    uni.showToast({
      title: "提交出错，请稍后再试",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.container {
	display: flex;
	flex-direction: column;
	height: 100%; /* 满屏高度 */
	padding: 20px;
	box-sizing: border-box;
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
	padding: 0 44px 0 12px; /* 右侧留空间给图标 */
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
.loading-text {
	color: #f0700c;
	font-weight: 600;
	margin-bottom: 12px;
}
.error-text {
	color: #e63946;
	font-weight: 600;
	margin-bottom: 12px;
}
.package-card {
	flex: 1; /* 撑满剩余空间 */
	overflow-y: auto;
	background-color: white;
	border-radius: 12px;
	box-sizing: border-box;
	padding: 12px;
	box-shadow: 0 2px 8px rgb(240 112 12 / 0.2);

}

.package-content {
	display: flex;
	gap: 20rpx;
}

.package-image {
	width: 160rpx;
	height: 160rpx;
	border-radius: 12rpx;
	background-color: #f5f5f5;
}

.package-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.package-title {
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.package-detail view {
	font-size: 28rpx;
	color: #666;
	margin-bottom: 4rpx;
}

.service-photo-wrapper {
	margin-top: 20rpx;
}

.service-block {
	padding-top: 16rpx;
	border-top: 1px solid #f0f0f0;
}

.service-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.service-name {
	font-size: 28rpx;
	color: #333;
}

.photo-btn {
	margin: 0;
	background: none;
	border: none;
	color: #007aff;
	font-size: 26rpx;
}
.photo-list {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 12rpx;
}

.photo-item {
	position: relative;
	display: inline-block;
	margin-right: 8px;
	margin-bottom: 8px;
}

.photo-thumb {
	width: 120rpx;
	height: 120rpx;
	border-radius: 8rpx;
}

.photo-delete {
	position: absolute;
	top: 4px;
	right: 4px;
	width: 24px;
	height: 24px;
	line-height: 24px;
	text-align: center;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	border-radius: 50%;
	font-weight: bold;
	font-size: 18px;
	cursor: pointer;
	user-select: none;
	z-index: 10;
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
