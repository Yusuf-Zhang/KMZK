/**
 * login.js - 登录相关API
 */
import request from '../utils/request';

/**
 * 微信登录，发送code到后端获取token
 * @param {Object} data 包含code的对象
 */
export function wxlogin(data) {
  return request({
    url: '/api/wxlogin', // 后台处理微信登录接口
    headers: {
      isToken: false
    },
    method: 'POST',
    data: data
  });
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'GET'
  });
}

/**
 * 退出登录
 */
export function logout() {
  return request({
    url: '/api/logout',
    method: 'POST'
  });
} 