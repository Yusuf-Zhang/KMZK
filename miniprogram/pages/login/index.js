import { setToken } from '../../utils/auth';

Page({
  data: {
    // 临时存储用户信息
    tempUserInfo: {
      nickName: '',
      avatarUrl: ''
    },
    // 是否显示用户信息弹窗
    showUserInfoModal: false,
    // 来源页面
    fromPage: ''
  },

  onLoad: function(options) {
    // 检查是否有错误的登录状态 (比如登录了但userInfo为空)
    const userInfo = wx.getStorageSync('userInfo');
    const isLogin = wx.getStorageSync('isLogin');
    
    if (isLogin && !userInfo) {
      console.log('检测到异常登录状态，重置登录状态');
      // 清除错误的登录状态
      wx.removeStorageSync('isLogin');
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('membershipStatus');
    }
    
    // 保存来源页面信息
    if (options.from) {
      this.setData({
        fromPage: options.from
      });
    }
  },

  // 微信快速登录
  handleWechatLogin: function() {
    // 首先直接获取用户信息(必须先调用此API，而且必须在点击事件中)
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (userResult) => {
        console.log('获取用户信息成功', userResult);
        
        // 创建用户信息对象
        const userInfo = {
          nickName: userResult.userInfo.nickName || '微信用户',
          avatarUrl: userResult.userInfo.avatarUrl || '/images/icons/avatar.png',
          gender: userResult.userInfo.gender,
          createTime: new Date()
        };
        
        // 显示加载提示
        wx.showLoading({
          title: '正在登录中',
        });
        
        // 在获取用户信息成功后再调用wx.login
        wx.login({
          success: (res) => {
            if (res.code) {
              console.log('登录成功，获取到code:', res.code);
              
              // 使用云函数代替API调用
              wx.cloud.callFunction({
                name: 'login',
                data: {
                  code: res.code,
                  userInfo: userInfo
                },
                success: (result) => {
                  // 添加详细日志，查看完整返回结果
                  console.log('登录云函数调用成功，完整返回结果:', result);
                  console.log('返回的result.result:', result.result);
                  
                  wx.hideLoading();
                  
                  // 检查返回格式是否正确，如果不正确也尝试处理
                  if (result.result) {
                    // 直接使用返回的数据，不再进行code检查
                    // 提取token，可能在不同的位置
                    const token = result.result.data || result.result.token || result.result;
                    
                    // 合并云函数返回的用户信息
                    if (result.result.userInfo) {
                      userInfo._id = result.result.userInfo._id;
                      userInfo.openid = result.result.userInfo.openid || result.result.openid;
                    } else if (result.result.openid) {
                      userInfo.openid = result.result.openid;
                    }
                    
                    console.log('处理后的用户信息:', userInfo);
                    console.log('提取的token:', token);
                    
                    // 使用App实例更新登录状态
                    const app = getApp();
                    app.updateLoginStatus(userInfo, token, () => {
                      console.log('登录状态更新完成');
                      
                      // 清除登出标志
                      wx.removeStorageSync('hasLogout');
                      
                      wx.showToast({
                        title: '登录成功',
                        icon: 'success',
                        duration: 1500,
                        success: () => {
                          // 登录成功后返回上一页或跳转到首页
                          setTimeout(() => {
                            // 如果来源是个人中心页面，则返回并带上参数
                            if (this.data.fromPage === 'profile') {
                              wx.navigateBack({
                                success: () => {
                                  // 延迟一下，等待页面真正返回
                                  setTimeout(() => {
                                    // 获取当前页面栈
                                    const pages = getCurrentPages();
                                    if (pages.length > 0) {
                                      // 获取上一个页面对象
                                      const profilePage = pages[pages.length - 1];
                                      // 调用上一个页面的方法
                                      if (profilePage && profilePage.showProfileDialog) {
                                        profilePage.showProfileDialog();
                                      }
                                    }
                                  }, 500);
                                },
                                fail: () => {
                                  // 如果无法返回，则直接跳转到个人中心页
                                  wx.reLaunch({
                                    url: '/pages/profile/index?showProfile=true'
                                  });
                                }
                              });
                            } else {
                              wx.navigateBack({
                                fail: () => {
                                  // 如果无法返回上一页，则跳转到首页
                                  wx.switchTab({
                                    url: '/pages/index/index'
                                  });
                                }
                              });
                            }
                          }, 1500);
                        }
                      });
                    });
                  } else {
                    console.error('云函数返回格式异常:', result);
                    wx.showToast({
                      title: '登录失败：服务器响应异常',
                      icon: 'none'
                    });
                  }
                },
                fail: (err) => {
                  wx.hideLoading();
                  console.error('调用登录云函数失败', err);
                  wx.showToast({
                    title: '登录失败，请重试',
                    icon: 'none'
                  });
                }
              });
            } else {
              wx.hideLoading();
              console.error('登录失败', res);
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('微信登录失败', err);
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '获取用户信息失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 暂不登录
  handleSkipLogin: function() {
    console.log('用户选择暂不登录');
    // 返回上一页或跳转到首页
    wx.navigateBack({
      fail: () => {
        // 如果无法返回上一页（例如通过分享直接打开登录页），则跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  },
  
  // 关闭用户信息弹窗
  closeUserInfoModal: function() {
    this.setData({
      showUserInfoModal: false
    });
  },
  
  // 昵称输入
  onNicknameInput: function(e) {
    this.setData({
      'tempUserInfo.nickName': e.detail.value
    });
  },
  
  // 确认用户信息
  confirmUserInfo: function() {
    const { nickName } = this.data.tempUserInfo; // 只获取昵称
    
    if (!nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    // 隐藏弹窗
    this.setData({
      showUserInfoModal: false
    });
    
    // 更新用户信息
    const userInfo = {
      nickName: nickName,
      avatarUrl: '/images/icons/avatar.png', // 使用默认头像
      createTime: new Date()
    };
    
    // 将用户信息保存到全局
    const app = getApp();
    if (app.globalData.isLogin) {
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);
      
      wx.showToast({
        title: '用户信息已更新',
        icon: 'success'
      });
    }
  }
}); 