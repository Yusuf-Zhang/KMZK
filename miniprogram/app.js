// app.js
import { getAccessToken, setToken, removeToken } from './utils/auth';
// 导入数据库初始化工具
const dbInit = require('./utils/db-init');

App({
  onLaunch: function () {
    // 全局变量初始化
    this.globalData.cloudInitialized = false;
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      try {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-2gkbbvste19738d8', // 替换为您的云环境ID
        traceUser: true,
          success: () => {
            console.log('云开发初始化成功');
            this.globalData.cloudInitialized = true;
      
            // 初始化云数据库数据(不包括高中学校数据)
            this.initCloudDBExceptHighSchools();
          },
          fail: (err) => {
            console.error('云开发初始化失败:', err);
          }
        });
      } catch (e) {
        console.error('云开发初始化出错:', e);
      }
    }

    // 获取设备信息，用于适配样式
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 获取胶囊按钮位置信息，增加错误处理
    let menuButtonInfo = {}; // 提供一个默认空对象
    try {
      menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      if (!menuButtonInfo || !menuButtonInfo.top) { // 进一步检查返回值是否有效
        console.error('getMenuButtonBoundingClientRect 返回无效:', menuButtonInfo);
        menuButtonInfo = { top: systemInfo.statusBarHeight + 4, height: 32, left: systemInfo.windowWidth - 95, right: systemInfo.windowWidth - 10, bottom: systemInfo.statusBarHeight + 36, width: 85 }; // 提供合理的默认值
        console.log('使用默认 menuButtonInfo');
      }
      this.globalData.menuButtonInfo = menuButtonInfo;
      
      // 计算导航栏高度
      this.globalData.navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    } catch (e) {
      console.error('获取胶囊按钮信息或计算导航栏高度失败:', e);
      // 出错时也提供默认导航栏高度
      const defaultNavBarHeight = systemInfo.statusBarHeight + 44; // 状态栏 + 44px
      this.globalData.menuButtonInfo = { top: systemInfo.statusBarHeight + 4, height: 32, left: systemInfo.windowWidth - 95, right: systemInfo.windowWidth - 10, bottom: systemInfo.statusBarHeight + 36, width: 85 }; // 使用默认值
      this.globalData.navBarHeight = defaultNavBarHeight;
      console.warn(`导航栏高度计算失败，使用默认值: ${defaultNavBarHeight}px`);
    }
    
    // 检查登录状态
    this.checkLoginStatus(() => {
      console.log('登录状态检查完成：', this.globalData.isLogin);
      
      // 如果用户已登录，立即主动检查会员状态（从云端获取最新数据）
      if (this.globalData.isLogin && this.globalData.userInfo) {
        console.log('用户已登录，立即检查会员状态');
        // 使用一个标志防止重复调用
        this.globalData.isFetchingMemberStatus = true;
        
        wx.showLoading({
          title: '加载会员信息'
        });
        
        this.checkMembershipStatus((result) => {
          wx.hideLoading();
          console.log('启动时会员状态检查完成:', result);
          this.globalData.isFetchingMemberStatus = false;
        });
      }
    });

    // 初始化页面已加载完成标志
    this.globalData.isAppReady = true;
    
    console.log('小程序启动：登录状态=', this.globalData.isLogin, '会员状态=', this.globalData.membershipStatus ? this.globalData.membershipStatus.isMember : false);
  },
  
  // 处理支付回调
  onShow: function(options) {
    // 根据支付SDK的指导处理支付回调
    if (options == null || options.referrerInfo == null) { 
      // 如果用户已登录，检查会员状态（每次打开小程序都检查）
      if (this.globalData.isLogin && !this.globalData.isFetchingMemberStatus) {
        this.checkMembershipStatus();
      }
      return;
    }

    let extraData = options.referrerInfo.extraData;
    if (extraData) {
      // 不管成功失败 先把支付结果赋值
      this.globalData.payStatus = extraData.code == 0 ? true : false;
      if (extraData.code != 0) {
        wx.showToast({
          title: extraData.msg,
          icon: 'none',
          duration: 3000
        });
        return;
      }
      
      // 获取支付中的套餐信息
      const payingPlan = this.globalData.payingPlan || {};
      
      // 支付成功，准备订单信息
      const orderInfo = {
        orderNo: extraData.data.orderNo,
        amount: extraData.data.total_fee || payingPlan.price || 0,
        body: extraData.data.body || `会员套餐-${payingPlan.name || ''}`,
        payTime: new Date().getTime(),
        attach: JSON.stringify({
          type: 'membership',
          planId: payingPlan.id || 1,
          duration: payingPlan.duration || '1个月'
        })
      };
      
      console.log('准备保存的订单信息:', orderInfo);
      
      // 调用云函数保存订单
      wx.cloud.callFunction({
        name: 'savePaymentOrder',
        data: orderInfo,
        success: (res) => {
          console.log('保存订单结果:', res);
          
          if (res.result && res.result.success) {
            console.log('订单保存成功:', res.result);
            
            // 支付成功后，立即检查会员状态并刷新所有页面
            if (this.globalData.isLogin) {
              wx.showLoading({
                title: '正在更新会员状态',
              });
              
              this.checkMembershipStatus(() => {
                wx.hideLoading();
                
                // 刷新所有页面
                const pages = getCurrentPages();
                if (pages && pages.length > 0) {
                  const currentPage = pages[pages.length - 1];
                  if (currentPage && typeof currentPage.onShow === 'function') {
                    currentPage.onShow();
                  }
                }
                
                wx.showToast({
                  title: '支付成功',
                  icon: 'success',
                  duration: 2000
                });
              });
            }
          } else {
            console.error('保存订单失败:', res);
            wx.showToast({
              title: res.result && res.result.error ? res.result.error : '订单保存失败',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          console.error('调用保存订单云函数失败:', err);
          wx.showToast({
            title: '订单保存失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }
  },
  
  // 初始化云数据库数据(不包括高中学校数据)
  initCloudDBExceptHighSchools: function() {
    // 初始化云数据库数据，除了高中学校数据
    Promise.all([
      dbInit.initTimelineData(),
      // 不再初始化高中学校数据，所以不调用: dbInit.initHighSchoolData(),
      dbInit.initDirectionSchoolData(),
      dbInit.initAdmissionScoreData()
    ])
    .then(() => {
      console.log('云数据库集合初始化完成（不包括高中学校数据）');
    })
    .catch(err => {
      console.error('部分数据库初始化失败:', err);
    });
  },
  
  // 检查登录状态
  checkLoginStatus: function(callback) {
    // 检查token是否存在
    const token = getAccessToken();
    if (token) {
      this.globalData.isLogin = true;
      // 从数据库获取用户信息
      const db = wx.cloud.database();
      wx.cloud.callFunction({
        name: 'login',
        success: res => {
          if (res.result && res.result.openid) {
            db.collection('users').where({
              openid: res.result.openid
            }).get().then(userRes => {
              if (userRes.data && userRes.data.length > 0) {
                this.globalData.userInfo = userRes.data[0];
              } else {
                this.globalData.isLogin = false;
                this.globalData.userInfo = null;
                removeToken(); // 移除无效的token
              }
              if (callback && typeof callback === 'function') {
                callback();
              }
            }).catch(err => {
              console.error('获取用户信息失败:', err);
              this.globalData.isLogin = false;
              this.globalData.userInfo = null;
              if (callback && typeof callback === 'function') {
                callback();
              }
            });
          } else {
            this.globalData.isLogin = false;
            this.globalData.userInfo = null;
            if (callback && typeof callback === 'function') {
              callback();
            }
          }
        },
        fail: err => {
          console.error('调用login云函数失败:', err);
          this.globalData.isLogin = false;
          this.globalData.userInfo = null;
          if (callback && typeof callback === 'function') {
            callback();
          }
        }
      });
    } else {
      this.globalData.isLogin = false;
      this.globalData.userInfo = null;
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  },
  
  // 用户登录成功后调用此方法
  updateLoginStatus: function(userInfo, token, callback) {
    // 存储登录凭证
    setToken(token);
    
    // 更新用户信息到数据库
    const db = wx.cloud.database();
    db.collection('users').where({
      openid: userInfo.openid
    }).get().then(res => {
      if (res.data.length > 0) {
        // 更新已存在的用户信息
        return db.collection('users').doc(res.data[0]._id).update({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            updateTime: db.serverDate()
          }
        });
      } else {
        // 添加新用户
        return db.collection('users').add({
          data: {
            ...userInfo,
            createTime: db.serverDate()
          }
        });
      }
    }).then(() => {
      // 更新全局状态
      this.globalData.userInfo = userInfo;
      this.globalData.isLogin = true;
      
      // 检查会员状态
      this.checkMembershipStatus(() => {
        // 更新界面
        this.refreshCurrentTabPage();
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      });
    }).catch(err => {
      console.error('更新用户信息失败:', err);
      if (callback && typeof callback === 'function') {
        callback();
      }
    });
  },
  
  // 检查会员状态
  checkMembershipStatus: function(callback) {
    const that = this;
    wx.cloud.callFunction({
      name: 'checkMembership',
      success: res => {
        if (res.result && res.result.data) {
          const membershipDate = res.result.data.membershipDate;
          const now = new Date();
          const expireDate = membershipDate ? new Date(membershipDate) : null;
          const isMember = expireDate && expireDate > now;
          
          that.globalData.membershipStatus = {
            isMember,
            membershipDate: expireDate
          };
          
          if (callback) callback(that.globalData.membershipStatus);
        } else {
          that.globalData.membershipStatus = { isMember: false, membershipDate: null };
          if (callback) callback(that.globalData.membershipStatus);
        }
      },
      fail: err => {
        console.error('检查会员状态失败:', err);
        that.globalData.membershipStatus = { isMember: false, membershipDate: null };
        if (callback) callback(that.globalData.membershipStatus);
      }
    });
  },
  
  // 更新全局会员状态
  updateGlobalMemberStatus: function(newStatus, callback) {
    // 更新全局状态
    this.globalData.membershipStatus = newStatus;
    
    // 保存到本地存储
    wx.setStorageSync('membershipStatus', newStatus);
    
    console.log('更新全局会员状态为:', this.globalData.membershipStatus);
    
    if (callback && typeof callback === 'function') callback(true);
  },
  
  // 刷新当前页面，用于登录状态变化时更新界面
  refreshCurrentTabPage: function() {
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      if (currentPage && typeof currentPage.onShow === 'function') {
        console.log(`刷新当前页面 ${currentPage.route} 的状态`);
        currentPage.onShow();
      }
    }
  },
  
  // 自动登录，用于应用启动时调用
  autoLogin: function(callback) {
    if (this.globalData.isLogin) {
      console.log('用户已登录，无需自动登录');
      if (callback && typeof callback === 'function') {
        callback(true);
      }
      return;
    }
    
    console.log('尝试自动登录');
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端接口获取token
          wx.cloud.callFunction({
            name: 'login',
            data: {
              code: res.code
            },
            success: (result) => {
              console.log('自动登录成功', result);
              if (result.result && result.result.token) {
                // 更新登录状态
                const userInfo = result.result.userInfo || {
                  nickName: '微信用户',
                  avatarUrl: '/images/avatar-default.png'
                };
                this.updateLoginStatus(userInfo, result.result.token, () => {
                  if (callback && typeof callback === 'function') {
                    callback(true);
                  }
                });
              } else {
                console.log('自动登录失败：无法获取token');
                if (callback && typeof callback === 'function') {
                  callback(false);
                }
              }
            },
            fail: (err) => {
              console.error('自动登录失败', err);
              if (callback && typeof callback === 'function') {
                callback(false);
              }
            }
          });
        } else {
          console.error('获取code失败', res);
          if (callback && typeof callback === 'function') {
            callback(false);
          }
        }
      },
      fail: (err) => {
        console.error('wx.login调用失败', err);
        if (callback && typeof callback === 'function') {
          callback(false);
        }
      }
    });
  },
  
  // 清除用户登录状态（仅清除全局登录状态，不影响本地存储的用户个人资料和会员记录）
  clearUserStatus: function(callback) {
    // 清除token和全局用户信息
    removeToken();
    wx.removeStorageSync('userInfo');
    
    // 只清除登录状态，但不删除会员记录和用户个人资料
    this.globalData.isLogin = false;
    this.globalData.userInfo = null;
    
    // 不清除会员状态和用户个人资料，这样重新登录时可以恢复
    // 原代码：this.globalData.membershipStatus = { isMember: false, expireDate: null };
    // 原代码：wx.removeStorageSync('membershipStatus');
    
    console.log('用户登录状态已清除（会员记录和个人资料保持不变，以便重新登录时恢复）');
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  },
  
  globalData: {
    userInfo: null,
    systemInfo: null,
    menuButtonInfo: null,
    navBarHeight: 0,
    isLogin: false,
    membershipStatus: { isMember: false, expireDate: null },
    isAppReady: false,
    cloudInitialized: false,
    payStatus: null, // 支付状态
    orderNo: null, // 订单号
    payingPlan: null // 支付中的套餐信息
  },
  
  // 根据会员状态重定向到适当的页面
  redirectToProperPage: function() {
    console.log('执行重定向页面');
    
    // 统一跳转到首页
    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        console.log('重定向到首页成功');
      },
      fail: (err) => {
        console.error('重定向失败:', err);
        // 失败时尝试使用reLaunch
        wx.reLaunch({ url: '/pages/index/index' });
      }
    });
  },
  
  // 直接查询用户表获取会员状态（备份方法）
  checkMemberStatusDirectly: function(userId, callback) {
    if (!userId) {
      if (callback) callback(null);
      return;
    }
    
    console.log('直接从用户表查询会员状态');
    const db = wx.cloud.database();
    db.collection('users').doc(userId).get().then(res => {
      console.log('直接查询用户表结果:', res.data);
      if (res.data && res.data.membershipDate) {
        const expireDate = new Date(res.data.membershipDate);
        const now = new Date();
        const isMember = expireDate > now;
        
        const result = {
          isMember: isMember,
          expireDate: isMember ? expireDate : null
        };
        
        console.log('直接查询用户表的会员状态:', result);
        if (callback) callback(result);
      } else {
        console.log('用户表中没有会员信息');
        if (callback) callback({ isMember: false, expireDate: null });
      }
    }).catch(err => {
      console.error('直接查询用户表失败:', err);
      if (callback) callback(null);
    });
  }
});
