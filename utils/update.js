/**
 * WGT 热更新模块
 *
 * 流程:
 *   1. 获取本地 App 当前 versionCode
 *   2. 请求后端接口，获取最新版本信息 (versionCode, downloadUrl, forceUpdate 等)
 *   3. 比较版本号，若有新版则下载 .wgt 文件
 *   4. 静默安装 wgt 并重启应用
 *
 * 后端接口约定 (GET /app-version/check):
 *   请求参数: ?versionCode=100&platform=android
 *   返回格式:
 *   {
 *     "success": true,
 *     "data": {
 *       "hasUpdate": true,
 *       "versionCode": 101,
 *       "versionName": "1.0.1",
 *       "downloadUrl": "https://xxx.com/update/app.wgt",
 *       "forceUpdate": false,       // 是否强制更新
 *       "updateType": "wgt",        // "wgt" 静默热更新 | "apk" 整包更新
 *       "updateLog": "修复了一些bug"  // 更新说明（可选）
 *     }
 *   }
 */

import { baseURL } from '@/services/request'

/**
 * 检查并执行 WGT 静默更新
 * @param {Object} options
 * @param {boolean} options.silent - 是否完全静默（不弹任何提示），默认 true
 * @param {boolean} options.showProgress - 是否显示下载进度，默认 false
 */
export function checkUpdate(options = {}) {
  const { silent = true, showProgress = false } = options

  // #ifdef APP-PLUS
  // 1. 获取当前版本信息
  const systemInfo = uni.getSystemInfoSync()
  plus.runtime.getProperty(plus.runtime.appid, (widgetInfo) => {
    const currentVersionCode = Number(widgetInfo.versionCode)
    const platform = systemInfo.platform // "android" | "ios"

    console.log('[热更新] 当前版本:', widgetInfo.version, '(versionCode:', currentVersionCode, '), 平台:', platform)

    // 2. 请求后端检查更新
    const cookie = uni.getStorageSync('cookie') || ''
    uni.request({
      url: baseURL + '/app-version/check',
      method: 'GET',
      data: {
        versionCode: currentVersionCode,
        platform: platform,
      },
      header: {
        'Cookie': cookie,
        'X-Language': 'zh',
        'X-Currency': 'CNY',
        'X-Timezone': 'Asia/Shanghai',
      },
      success: (res) => {
        if (res.statusCode !== 200 || !res.data?.success) {
          console.log('[热更新] 检查更新接口异常:', res)
          return
        }

        const updateInfo = res.data.data
        if (!updateInfo || !updateInfo.hasUpdate) {
          console.log('[热更新] 当前已是最新版本')
          if (!silent) {
            uni.showToast({ title: '当前已是最新版本', icon: 'none' })
          }
          return
        }

        console.log('[热更新] 发现新版本:', updateInfo.versionName, '(versionCode:', updateInfo.versionCode, ')')

        // 3. 判断更新类型
        if (updateInfo.updateType === 'wgt') {
          // WGT 热更新
          if (updateInfo.forceUpdate) {
            // 强制更新: 直接下载安装，用户无法跳过
            downloadAndInstallWgt(updateInfo.downloadUrl, {
              showProgress: true,
              force: true,
              updateLog: updateInfo.updateLog,
              versionName: updateInfo.versionName,
            })
          } else if (silent) {
            // 静默更新: 后台下载安装，用户无感知
            downloadAndInstallWgt(updateInfo.downloadUrl, {
              showProgress,
              force: false,
              updateLog: updateInfo.updateLog,
              versionName: updateInfo.versionName,
            })
          } else {
            // 非静默: 弹窗提示用户是否更新
            uni.showModal({
              title: `发现新版本 ${updateInfo.versionName}`,
              content: updateInfo.updateLog || '有新的更新内容，是否立即更新？',
              confirmText: '立即更新',
              cancelText: '稍后再说',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  downloadAndInstallWgt(updateInfo.downloadUrl, {
                    showProgress: true,
                    force: false,
                    updateLog: updateInfo.updateLog,
                    versionName: updateInfo.versionName,
                  })
                }
              },
            })
          }
        } else if (updateInfo.updateType === 'apk') {
          // 整包更新: 提示用户前往下载
          uni.showModal({
            title: `发现新版本 ${updateInfo.versionName}`,
            content: updateInfo.updateLog || '有重大更新，需要下载新版本安装包。',
            confirmText: '立即下载',
            cancelText: updateInfo.forceUpdate ? undefined : '稍后再说',
            showCancel: !updateInfo.forceUpdate,
            success: (modalRes) => {
              if (modalRes.confirm) {
                plus.runtime.openURL(updateInfo.downloadUrl)
              } else if (updateInfo.forceUpdate) {
                // 强制整包更新但用户拒绝，退出应用
                plus.runtime.quit()
              }
            },
          })
        }
      },
      fail: (err) => {
        console.error('[热更新] 检查更新请求失败:', err)
      },
    })
  })
  // #endif
}

/**
 * 下载并安装 WGT 文件
 * @param {string} wgtUrl - WGT 文件下载地址
 * @param {Object} options
 * @param {boolean} options.showProgress - 是否显示下载进度弹窗
 * @param {boolean} options.force - 是否强制安装（安装后自动重启）
 * @param {string} options.updateLog - 更新日志
 * @param {string} options.versionName - 新版本名
 */
function downloadAndInstallWgt(wgtUrl, options = {}) {
  const { showProgress = false, force = false, versionName = '' } = options

  console.log('[热更新] 开始下载 WGT:', wgtUrl)

  // 创建下载任务
  const downloadTask = uni.downloadFile({
    url: wgtUrl,
    success: (downloadRes) => {
      if (downloadRes.statusCode !== 200) {
        console.error('[热更新] WGT 下载失败, statusCode:', downloadRes.statusCode)
        if (showProgress) {
          uni.showToast({ title: '下载更新包失败', icon: 'none' })
        }
        return
      }

      console.log('[热更新] WGT 下载完成, 临时路径:', downloadRes.tempFilePath)

      // 安装 WGT
      installWgt(downloadRes.tempFilePath, force, versionName)
    },
    fail: (err) => {
      console.error('[热更新] WGT 下载失败:', err)
      if (showProgress) {
        uni.showToast({ title: '下载更新包失败，请检查网络', icon: 'none' })
      }
    },
  })

  // 监听下载进度
  if (showProgress && downloadTask) {
    uni.showLoading({ title: '正在下载更新...', mask: force })

    downloadTask.onProgressUpdate((progressRes) => {
      console.log('[热更新] 下载进度:', progressRes.progress + '%')
      // 可以在此处更新自定义进度条 UI
    })

    // 下载完成后隐藏 loading (在 success/fail 中 hideLoading 更精确)
  }
}

/**
 * 安装 WGT 更新包
 * @param {string} tempFilePath - WGT 文件的本地临时路径
 * @param {boolean} force - 是否强制安装后重启
 * @param {string} versionName - 新版本号名称
 */
function installWgt(tempFilePath, force = false, versionName = '') {
  // #ifdef APP-PLUS
  plus.runtime.install(
    tempFilePath,
    { force: true }, // force: true 表示强制覆盖安装
    () => {
      uni.hideLoading()
      console.log('[热更新] WGT 安装成功!')

      if (force) {
        // 强制更新: 直接重启
        uni.showModal({
          title: '更新完成',
          content: `已更新到 ${versionName || '最新版本'}，应用即将重启。`,
          showCancel: false,
          confirmText: '确定',
          success: () => {
            plus.runtime.restart()
          },
        })
      } else {
        // 静默更新: 下次启动生效，或者提示用户可以重启
        console.log('[热更新] 静默安装完成，下次冷启动生效')
        // 如果希望安装后提示用户重启，可以取消下面的注释：
        // uni.showModal({
        //   title: '更新提示',
        //   content: `新版本 ${versionName} 已准备就绪，是否立即重启？`,
        //   confirmText: '立即重启',
        //   cancelText: '稍后',
        //   success: (res) => {
        //     if (res.confirm) {
        //       plus.runtime.restart()
        //     }
        //   },
        // })
      }
    },
    (err) => {
      uni.hideLoading()
      console.error('[热更新] WGT 安装失败:', err)
      uni.showToast({ title: '安装更新失败', icon: 'none' })
    }
  )
  // #endif
}

export default {
  checkUpdate,
}
