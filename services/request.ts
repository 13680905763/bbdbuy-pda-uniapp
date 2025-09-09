export const baseURL = 'http://192.168.1.191:8080'
// export const baseURL = 'https://demo.bbdbuy.com/admin-api'

export function request<T>(options: UniApp.RequestOptions): Promise<T> {
	 const cookie = uni.getStorageSync('cookie') || '';
	 uni.showLoading({ title: '加载中...', mask: true });
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
	  url: baseURL + options.url, // 拼接 baseURL
	  timeout:10000,
	  header:{
	      ...(options.header || {}),
	      "X-Language": "en",
	      "X-Currency": "USD",
	      "X-Timezone": "Asia/Shanghai",
		  'Cookie': cookie, // 👉 手动携带 cookie
		},
      success: (res) => {
		  uni.hideLoading();
        if (res.statusCode === 200) {
          resolve(res.data as T)
        } else if (res.statusCode === 500) {
			uni.showToast({
			title: '服务器错误，请联系管理员',
			icon: 'none',
		})
		} else if (res.statusCode === 401) {
			uni.showToast({
			title: '请先登录',
			icon: 'none',
		}
		)
		  uni.reLaunch({ url: '/pages/login/login' });
		} else {
          reject(res)
        }
      },
	  
       fail: (err) => {
		   console.log('url',baseURL + options.url);
		   uni.hideLoading();
              // ✅ 判断是否为超时
              if (err.errMsg?.includes('timeout')) {
                uni.showToast({
                  title: '请求超时，请检查网络或稍后重试',
                  icon: 'none',
                });
              } else if (err.errMsg?.includes('request:fail')) {
                uni.showToast({
                  title: '网络异常，请检查网络连接',
                  icon: 'none',
                });
              } else {
                uni.showToast({
                  title: '请求失败',
                  icon: 'none',
                });
              }
              reject(err);
            }
    })
  })
}
