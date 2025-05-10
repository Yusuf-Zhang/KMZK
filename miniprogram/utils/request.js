/**
 * request.js - 网络请求封装
 */
import { getAccessToken } from './auth';

// 超时时间
const timeout = 10000;
// 基础URL，根据需要修改
const baseUrl = 'https://your-api-endpoint.com';

/**
 * 封装请求方法
 * @param {Object} config 
 */
const request = config => {
  // 是否需要设置token
  const isToken = (config.headers || {}).isToken === false;
  config.header = config.header || {};
  if (getAccessToken() && !isToken) {
    config.header['Authorization'] = 'Token ' + getAccessToken();
  }

  // 处理get请求参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params);
    url = url.slice(0, -1);
    config.url = url;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      method: config.method || 'get',
      timeout: config.timeout || timeout,
      url: config.baseUrl || baseUrl + config.url,
      data: config.data,
      header: config.header,
      dataType: 'json',
      success: res => {
        const code = res.data.code || 200;
        // 登录失效
        if (code === 401) {
          showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(result => {
            if (result.confirm) {
              wx.navigateTo({ url: '/pages/login/index' });
            }
          });
          toast('无效的会话，或者会话已过期，请重新登录。');
          reject('401');
        } else if (code === 500) {
          toast(res.data.msg || '服务器错误');
          reject('500');
        } else if (code !== 200) {
          toast(res.data.msg || '请求失败');
          reject(code);
        } else {
          resolve(res.data);
        }
      },
      fail: error => {
        toast(error.errMsg || '网络请求失败');
        reject(error);
      }
    });
  });
};

/**
 * 参数转换
 * @param {Object} params
 */
export function tansParams(params) {
  let result = '';
  for (const key in params) {
    if (params[key] != null && params[key] !== '') {
      result += key + '=' + encodeURIComponent(params[key]) + '&';
    }
  }
  return result;
}

/**
 * 显示提示信息
 * @param {string} message 
 */
export function toast(message) {
  wx.showToast({
    title: message || '操作失败',
    icon: 'none',
    duration: 2000
  });
}

/**
 * 显示确认框
 * @param {string} content 
 */
export function showConfirm(content) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: '提示',
      content: content,
      success: res => {
        resolve(res);
      },
      fail: err => {
        reject(err);
      }
    });
  });
}

export default request; 