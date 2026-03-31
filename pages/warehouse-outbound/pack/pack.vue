<template>
	<view class="container">
		<view class="input-wrapper">
			<input v-model="code" placeholder="请输入拣货单号" class="input" @input="onInputChange" confirm-type="search" @confirm="onInputConfirm" />
			<uni-icons type="scan" size="28" color="#f0700c" class="scan-icon" @click="startScan" />
		</view>
		<view v-if="error" class="error-text">{{ error }}</view>
		<view class="package-card" scroll-y>
			<!-- 👇 服务拍照区域 -->
			<view class="service-photo-wrapper">
				<view v-for="(service, idx) in services" :key="idx" class="service-block">
					<view class="service-header">
						<text class="service-name">{{ service?.serviceName }}</text>
						<view class="" style="display: flex; gap: 8rpx">
							<button class="photo-btn" @tap="handleTakePhoto(idx)">
								<text class="icon-camera">📷</text>
								照片
							</button>
							<button class="photo-btn" @tap="handleTakeVideo(idx)">
								<text class="icon-camera">📷</text>
								视频
							</button>
						</view>
					</view>
					<view class="photo-list">
						<view v-for="(file, fileIdx) in serviceImages[idx] || []" :key="fileIdx" class="photo-item">
							<!-- 图片 -->
							<image
								v-if="file.fileType && file.fileType.startsWith('image/')"
								:src="file.fileUrl"
								class="photo-thumb"
								mode="aspectFill"
								@tap="previewImage(file.fileUrl, idx)"
							/>

							<!-- 视频 -->

							<video v-else-if="file.fileType && file.fileType.startsWith('video/')" :src="file.fileUrl" class="video-thumb" controls :id="'video_' + idx">
								<cover-view class="photo-delete" @tap="(e) => handleRemoveImage(e, file.id, idx)">✖</cover-view>
							</video>

							<!-- 删除按钮 -->
							<text class="photo-delete" @tap="(e) => handleRemoveImage(e, file.id, idx)">✖</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		<!-- 底部固定提交按钮 -->
		<view class="submit-wrapper">
			<button :disabled="loading" @click="handleSubmit" class="submit-btn">
				{{ loading ? '提交中...' : '提交拍照完成' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getPackScan, getPackScanPhoto, detPackScanPhoto, submitPackConfirm } from '@/services/warehouse-outbound';
import { baseURL } from '@/services/request';
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
		const res = await getPackScan(barcode);
		if (res.success) {
			const data = res.data;
			console.log('services', res.data);
			services.value = res.data?.services;
			for (let i = 0; i < res.data?.services?.length; i++) {
				const item = res.data?.services[i];
				await fetchPhotos(i, item);
			}
		} else {
			uni.showToast({ title: res.msg, icon: 'none' });
		}
	} catch (err) {
		console.log(err);
		uni.showToast({ title: '扫描失败，请重试', icon: 'none' });
	}
}

async function fetchPhotos(serviceIdx, item = {}) {
	const service = services.value[serviceIdx] || item;
	if (!service?.id) return;
	const res = await getPackScanPhoto(service.id);
	console.log('resp', res);
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

const handleRemoveImage = async (e, imgId, serviceIdx) => {
	if (e && typeof e.stopPropagation === 'function') {
		e.stopPropagation();
	}
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
		const res = await detPackScanPhoto(imgId);
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

const processUploads = async (files, serviceIdx, isSilent = false) => {
  if (!files || files.length === 0) return;

  if (!isSilent) {
    uni.showLoading({ title: '准备上传...', mask: true });
  } else {
    uni.showToast({ title: '后台上传中...', icon: 'none' });
  }

  // 单张上传逻辑
  const uploadSingle = async (file, index, total) => {
    let filePath = file.path;

    // 压缩大图
    if (file.size > 1024 * 1024) {
      try {
        const compressRes = await uni.compressImage({
          src: filePath,
          quality: 80,
        });
        filePath = compressRes.tempFilePath;
      } catch (err) {
        console.error('图片压缩失败:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject({ errMsg: 'upload timeout' });
      }, 20000); // 20秒超时保护

      const uploadTask = uni.uploadFile({
        url: baseURL + '/outbound-service/upload',
        filePath,
        name: 'file',
        header: {
          'X-Language': 'en',
          'X-Currency': 'USD',
          'X-Timezone': 'Asia/Shanghai',
          Cookie: uni.getStorageSync('cookie') || '',
        },
        formData: {
          id: String(services.value[serviceIdx]?.id || ''),
          sort: String(serviceIdx),
        },
        success: (res) => {
          clearTimeout(timeout);
          let data = res.data;
          try {
            data = JSON.parse(data);
          } catch {}
          data.success ? resolve(data) : reject(data);
        },
        fail: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      // 显示上传进度
      if (!isSilent) {
        uploadTask.onProgressUpdate((progress) => {
          const msg = `第 ${index + 1}/${total} 张：${progress.progress}%`;
          uni.showLoading({ title: msg });
          console.log(msg);
        });
      }
    });
  };

  // 自动重试 + 顺序上传（让进度更清晰）
  const results = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    try {
      const result = await uploadSingle(files[i], i, total);
      results.push({ status: 'fulfilled', value: result });
    } catch (err) {
      console.warn(`第 ${i + 1} 张上传失败:`, err);
      // 自动重试一次
      try {
        const retryResult = await uploadSingle(files[i], i, total);
        results.push({ status: 'fulfilled', value: retryResult });
      } catch (retryErr) {
        console.error(`第 ${i + 1} 张重试失败:`, retryErr);
        results.push({ status: 'rejected', reason: retryErr });
      }
    }
  }

  // 统计结果
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failCount = results.length - successCount;

  await fetchPhotos(serviceIdx);

  // 提示
  if (!isSilent) {
    uni.hideLoading();
    if (failCount === 0) {
      uni.showToast({ title: `成功上传 ${successCount} 张`, icon: 'success' });
    } else {
      uni.showToast({
        title: `上传完成：成功 ${successCount} 张，失败 ${failCount} 张`,
        icon: 'none',
      });
    }
  } else {
    if (failCount === 0) {
      uni.showToast({ title: '后台上传成功', icon: 'success' });
    } else {
      uni.showToast({ title: '后台上传部分失败', icon: 'none' });
    }
  }
};

const runCameraLoop = async () => {
  const files = [];

  while (true) {
    try {
      const res = await uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['camera'],
      });

      if (res.tempFiles && res.tempFiles.length > 0) {
        files.push(...res.tempFiles);
        continue;
      }

      return files;
    } catch (err) {
      const errMsg = err?.errMsg || '';
      if (errMsg.includes('cancel') || errMsg.includes('fail')) {
        return files;
      }
      console.log('Camera loop ended', err);
      if (files.length > 0) {
        return files;
      }
      throw err;
    }
  }
};

const handleTakePhoto = async (serviceIdx) => {
  try {
    // 1️⃣ 用户选择来源
    const action = await uni.showActionSheet({
      itemList: ['拍照', '从相册选择'],
    });

    if (action.tapIndex === 0) {
      // 拍照模式：先连续拍完，再统一上传
      const tempFiles = await runCameraLoop(serviceIdx);
      if (!tempFiles || tempFiles.length === 0) return;
      await processUploads(tempFiles, serviceIdx, false);
    } else {
      // 相册模式：原有逻辑
      const res = await uni.chooseImage({
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album'],
      });
      if (!res.tempFiles || res.tempFiles.length === 0) return;
      await processUploads(res.tempFiles, serviceIdx, false);
    }
  } catch (err) {
    console.error('选择图片异常:', err);
    if (err?.errMsg?.includes('cancel')) {
      return;
    }
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};


const handleTakeVideo = async (serviceIdx) => {
	try {
	// 1️⃣ 选择来源
	const action = await uni.showActionSheet({
	  itemList: ['拍摄视频', '从相册选择'],
	});
	const sourceType = action.tapIndex === 0 ? ['camera'] : ['album'];
	
	// 2️⃣ 选择或拍摄视频
	const res = await uni.chooseVideo({
	  sourceType,
	  maxDuration: 60, // 最长60秒
	});
	
	if (!res.tempFilePath) return;
	
	
	const filePath = res.tempFilePath;
	    const fileSize = res.size || 0;
	
	    // 3️⃣ 限制大小
	    if (fileSize > 50 * 1024 * 1024) {
	      uni.showToast({ title: '视频不能超过50MB', icon: 'none' });
	      return;
	    }
	
	    uni.showLoading({ title: '视频上传中...', mask: true });
	
	    // 4️⃣ 单次上传逻辑
	    const uploadVideo = () => {
	      return new Promise((resolve, reject) => {
	        const timeout = setTimeout(() => reject({ errMsg: 'upload timeout' }), 30000);
	
	        const uploadTask = uni.uploadFile({
	          url: baseURL + '/outbound-service/upload',
	          filePath,
	          name: 'file',
	          header: {
	            'X-Language': 'en',
	            'X-Currency': 'USD',
	            'X-Timezone': 'Asia/Shanghai',
	            Cookie: uni.getStorageSync('cookie') || '',
	          },
	          formData: {
	            id: String(services.value[serviceIdx]?.id || ''),
	            sort: String(serviceIdx),
	          },
	          success: (uploadRes) => {
	            clearTimeout(timeout);
	            let data = uploadRes.data;
	            try {
	              data = JSON.parse(data);
	            } catch {}
	            data.success ? resolve(data) : reject(data);
	          },
	          fail: (err) => {
	            clearTimeout(timeout);
	            reject(err);
	          },
	        });
	
	        // ✅ 上传进度回调
	        uploadTask.onProgressUpdate((progress) => {
	          uni.showLoading({
	            title: `视频上传中... ${progress.progress}%`,
	            mask: true,
	          });
	          console.log(`视频上传进度: ${progress.progress}%`);
	        });
	      });
	    };
	
	    // 5️⃣ 上传 + 自动重试一次
	    let uploadResult;
	    try {
	      uploadResult = await uploadVideo();
	    } catch (err) {
	      console.warn('视频上传失败，重试中...', err);
	      uploadResult = await uploadVideo();
	    }
	
	    // 6️⃣ 刷新视频列表
	    await fetchPhotos(serviceIdx);
	    uni.hideLoading();
	    uni.showToast({ title: '视频上传成功', icon: 'success' });
	  } catch (err) {
	    console.error('视频选择/上传出错:', err);
	    uni.hideLoading();
	
	    // 用户主动取消，不提示
	    if (err?.errMsg?.includes('cancel')) {
	      console.log('用户取消视频上传');
	      return;
	    }
	
	    uni.showToast({ title: '上传失败，请重试', icon: 'none' });
	  } finally {
	    uni.hideLoading();
	  }
	};
	

const handleSubmit = async () => {
	if (!services.value.length) return;

	const serviceIds = services.value.map((s) => s.id); // 收集所有服务 ID

	try {
		loading.value = true;
		console.log('serviceIds', serviceIds);
		const res = await submitPackConfirm({ idList: serviceIds });
		if (res.success) {
			uni.showToast({
				title: '提交拍照完成 ',
				icon: 'success'
			});
			// 这里可以清空数据或跳转，比如：
			services.value = [];
			code.value = '';
		} else {
			uni.showToast({
				title: `提交失败：${res?.msg || ''}`,
				icon: 'none'
			});
		}
	} catch (err) {
		uni.showToast({
			title: '提交出错，请稍后再试',
			icon: 'none'
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
}
.video-thumb {
	width: 300rpx; /* 或更大 */
	height: 120rpx; /* 根据比例适配 */
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
