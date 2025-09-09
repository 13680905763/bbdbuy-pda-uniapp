import { request } from '@/services/request';

/** 获取拣货单号信息 */
export const getPickScan = (code: string) =>
	request({
		url: `/outbound-picking/scan?code=${code}`,
		method: 'GET'
	});

/** 完成拣货下架 */

export const submitPick = (data) =>
	request({
		url: '/outbound-picking/off',
		method: 'POST',
		data
	});

/** 获取拣货单号附加服务信息 */
export const getPackScan = (code: string) =>
	request({
		url: `/outbound-service/scan?code=${code}`,
		method: 'GET'
	});
/** 获取商品（包裹）附加服务照片 */
export const getPackScanPhoto = (id: string) =>
	request({
		url: `/outbound-service/oss?id=${id}`,
		method: 'GET'
	});

/** 删除商品（包裹）附加服务照片 */
export const detPackScanPhoto = (id:string) =>
  request({
    url: '/outbound-service/delete',
    method: 'POST',
    data: {
      ids: [id],
    },
})
/** 完成拍照信息 */

export const submitPackConfirm = (data:number[]) =>
  request({
    url: '/outbound-service/finish',
    method: 'POST',
    data
})


/** 获取上架包裹信息 */
export const getPutawayScan = (code) =>
  request({
    url: `/outbound-putaway/scan?code=${code}`,
    method: 'GET',
  })
  
  /** 提交上架 */
  export const submitPutawayConfirm = (data:any) =>
    request({
      url: '/outbound-putaway/on',
      method: 'POST',
      data
  })
  
  /** 获取发货单号信息 */
  export const getSendScan = (code: string) =>
  	request({
  		url: `/outbound-send/scan?code=${code}`,
  		method: 'GET'
  	});
	/** 完成发货下架 */
	
	export const submitSend = (data) =>
		request({
			url: '/outbound-send/send',
			method: 'POST',
			data
		});