/**
 * auth.js - Token管理工具
 */

const AccessTokenKey = 'ACCESS_TOKEN';
const duration = 1000 * 60 * 60 * 24; // token有效期1天

/**
 * 获取token
 */
export function getAccessToken() {
  const tokenstr = wx.getStorageSync(AccessTokenKey);
  if (!tokenstr || tokenstr.indexOf('expireTime') < 0) {
    return null;
  }
  const token = JSON.parse(tokenstr);
  // 判断token是否在有效期内
  if (token && token.expireTime && token.expireTime > Date.now()) {
    return token.value;
  } else { // 已过期则清理storage信息
    removeToken();
    return null;
  }
}

/**
 * 设置token
 * @param {string} token 
 */
export function setToken(token) {
  // 前端存储token，包含过期时间
  wx.setStorageSync(AccessTokenKey, JSON.stringify({
    expireTime: Date.now() + duration,
    value: token
  }));
}

/**
 * 清理token
 */
export function removeToken() {
  wx.removeStorageSync(AccessTokenKey);
}

/**
 * 检查是否已登录
 */
export function checkLogin() {
  return !!getAccessToken();
} 