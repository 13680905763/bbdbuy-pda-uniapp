import { request } from '@/services/request'

export const login = (data) =>
  request({
    url: '/users/login',
    method: 'POST',
    data,
    header: {
      'Content-Type': 'application/json',
    },
  })
export const getUserInfo = () =>
  request({
    url: '/users/detail',
    method: 'GET',
    
  })
