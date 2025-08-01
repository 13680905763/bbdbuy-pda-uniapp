import { request } from '@/services/request'


/** 获取快递单号（包裹）信息 */
export const getReceiveScan = (logisticsCode: string) =>
  request({
    url: `/inbound-receive/scan?logisticsCode=${logisticsCode}`,
    method: 'GET',
    
  })
  /** 提交收货信息 */
export const receiveSubmit = (data:{
      logisticsCodeList: string[],
    }) =>
  request({
    url: '/receive-package/submit',
    method: 'POST',
    data,
})
/** 获取快递单号（包裹）信息 */
export const getInspectScan = (packageCode: string) =>
  request({
    url: `/inbound-service/scan?packageCode=${packageCode}`,
    method: 'GET',
  })
/** 获取商品（包裹）附加服务照片 */
export const getInspectScanPhoto = (id: string) =>
  request({
    url: `/inbound-service/oss?id=${id}`,
    method: 'GET',
    
  })
  /** 上传商品（包裹）照片 */
  export const uploadImage = (formData: FormData) =>
    request({
      url: '/inbound-service/upload',
      method: 'POST',
      data:formData,
  })

/** 删除商品（包裹）附加服务照片 */
export const detInspectScanPhoto = (id:string) =>
  request({
    url: '/inbound-service/delete',
    method: 'POST',
    data: {
      ids: [id],
    },
})
/** 完成拍照信息 */

export const submitInspectConfirm = (data:number[]) =>
  request({
    url: '/inbound-service/finish',
    method: 'POST',
    data
})


/** 获取上架商品信息 */
export const getShelveScan = (packageCode) =>
{console.log('参数',packageCode);
 return request({
    url: `/inbound-putaway/scan?packageCode=${packageCode}`,
    method: 'GET',
    
  })}

/** 提交上架 */
export const submitShelveConfirm = (data:any) =>
  request({
    url: '/inbound-putaway/on',
    method: 'POST',
    data
})
