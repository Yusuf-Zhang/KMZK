Page({
  data: {
    // 用户信息
    userInfo: {
      avatarUrl: '',
      nickName: '',
      memberType: '普通用户'
    },
    // 是否登录
    isLogin: false,
    // 是否已登录但未设置头像和昵称
    isPendingProfileSetup: false,
    // 会员状态
    membershipStatus: {
      isMember: false,
      expireDate: null
    },
    // 功能列表
    functionList: [
      {
        id: 'membership',
        name: '会员开通',
        icon: '../../images/membership.png',
        url: '/packageB/pages/membership/index'
      },
      {
        id: 'service',
        name: '联系客服',
        icon: '../../images/service.png',
        url: '/packageB/pages/customer-service/index'
      }
    ],
    // 个人信息完善弹窗
    showProfileDialog: false,
    tempUserInfo: {
      avatarUrl: '',
      nickName: ''
    },
    // 是否刚登录成功
    justLoggedIn: false,
    // 用户OpenID
    openid: '',
    // 导航栏高度
    navHeight: 90
  },

  onLoad: function (options) {
    // 检查是否有登录成功的参数
    if (options.showProfile === 'true') {
      this.setData({
        justLoggedIn: true
      });
    }

    // 获取导航栏高度
    const app = getApp();
    if (app.globalData && app.globalData.navBarHeight) {
      this.setData({
        navHeight: app.globalData.navBarHeight
      });
    } else {
      this.setData({
        navHeight: 90
      });
    }
    
    // 从app.js获取登录状态和用户信息
    this.updateLoginState();
  },

  onShow: function () {
    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      });
    }
    
    // 从app.js获取最新的登录状态和用户信息
    this.updateLoginState();
  },
  
  // 更新登录状态和用户信息
  updateLoginState: function() {
    const app = getApp();
    
    if (!app.globalData.isLogin || !app.globalData.userInfo) {
      // 未登录状态或用户信息为空
      this.setData({
        isLogin: false,
        isPendingProfileSetup: false,
        userInfo: {
          avatarUrl: '',
          nickName: '',
          memberType: '普通用户'
        },
        membershipStatus: {
          isMember: false,
          expireDate: null
        }
      });
      return;
    }
    
    // 确保userInfo和openid存在
    const openid = app.globalData.userInfo.openid;
    if (!openid) {
      console.error('用户信息中没有openid');
      this.setData({
        isLogin: false,
        isPendingProfileSetup: false,
        userInfo: {
          avatarUrl: '',
          nickName: '',
          memberType: '普通用户'
        }
      });
      return;
    }
    
    // 已登录，从数据库获取最新用户信息
    const db = wx.cloud.database();
    db.collection('users').where({
      openid: openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        const userInfo = res.data[0];
        // 检查是否设置了昵称和头像
        const hasSetProfile = userInfo.nickName && userInfo.avatarUrl;
        
        this.setData({
          isLogin: true,
          isPendingProfileSetup: !hasSetProfile,
          userInfo: {
            ...userInfo,
            nickName: hasSetProfile ? userInfo.nickName : '', // 如果未设置，则清空昵称
            avatarUrl: hasSetProfile ? userInfo.avatarUrl : '' // 如果未设置，则清空头像
          }
        });
        
        // 更新全局状态
        app.globalData.userInfo = userInfo;
        
        // 检查会员状态
        this.getMembershipStatus();
      } else {
        // 数据库中找不到用户，可能是数据不一致
        console.error('数据库中未找到用户信息');
        this.setData({
          isLogin: false,
          isPendingProfileSetup: false,
          userInfo: {
            avatarUrl: '',
            nickName: '',
            memberType: '普通用户'
          }
        });
      }
    }).catch(err => {
      console.error('获取用户信息失败', err);
      // 发生错误时也设置为未登录状态
      this.setData({
        isLogin: false,
        isPendingProfileSetup: false,
        userInfo: {
          avatarUrl: '',
          nickName: '',
          memberType: '普通用户'
        }
      });
    });
  },
  
  // 检查并确保users集合存在
  checkCollection: function() {
    const db = wx.cloud.database();
    
    // 尝试查询users集合中的一条记录
    db.collection('users').limit(1).get({
      success: function(res) {
        console.log('users集合已存在');
      },
      fail: function(err) {
        console.error('查询users集合失败，可能不存在', err);
        console.log('请在云开发控制台创建users集合，并设置合理的权限');
        
        // 提示用户
        wx.showToast({
          title: '初始化数据库失败，请联系管理员',
          icon: 'none',
          duration: 3000
        });
      }
    });
  },
  
  // 获取用户openid并检查登录状态
  getOpenidAndCheckLogin: function() {
    wx.showLoading({
      title: '加载中...',
    });
    
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('云函数获取到的openid:', res.result.openid);
        const openid = res.result.openid;
        
        this.setData({
          openid: openid
        });
        
        // 本地存储openid
        wx.setStorageSync('openid', openid);
        
        // 先检查本地是否有该用户的头像和昵称信息
        const localUserInfo = wx.getStorageSync('localUserInfo_' + openid);
        
        if (localUserInfo && localUserInfo.nickName && localUserInfo.avatarUrl) {
          console.log('从本地获取到用户信息:', localUserInfo);
          // 使用本地信息更新UI
          this.setData({
            isLogin: true,
            userInfo: localUserInfo,
            isPendingProfileSetup: false
          });
          
          // 保存到全局用户信息
          wx.setStorageSync('userInfo', localUserInfo);
          wx.setStorageSync('isLogin', true);
          
          // 关闭加载提示
          wx.hideLoading();
          
          // 更新数据库中的用户信息，确保数据一致性
          this.updateUserInfoToDB(openid, localUserInfo);
        } else {
          // 本地没有信息，查询数据库
          this.checkUserInDB(openid);
        }
      },
      fail: err => {
        console.error('获取openid失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 更新用户信息到数据库
  updateUserInfoToDB: function(openid, userInfo) {
    const db = wx.cloud.database();
    
    // 检查用户是否已存在
    db.collection('users').where({
      openid: openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        // 用户已存在，更新信息
        db.collection('users').doc(res.data[0]._id).update({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            updateTime: db.serverDate()
          }
        }).then(() => {
          console.log('数据库用户信息已更新');
        }).catch(err => {
          console.error('更新数据库用户信息失败', err);
        });
      } else {
        // 用户不存在，添加新用户
        db.collection('users').add({
          data: {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            openid: openid,
            memberType: userInfo.memberType || '普通用户',
            createTime: db.serverDate()
          }
        }).then(() => {
          console.log('新用户已添加到数据库');
        }).catch(err => {
          console.error('添加新用户失败', err);
        });
      }
    }).catch(err => {
      console.error('查询用户失败', err);
    });
  },
  
  // 查询用户是否已在数据库中
  checkUserInDB: function(openid) {
    const db = wx.cloud.database();
    
    db.collection('users').where({
      openid: openid
    }).get({
      success: res => {
        wx.hideLoading();
        
        if (res.data && res.data.length > 0) {
          // 用户已存在，更新登录状态和用户信息
          const dbUserInfo = res.data[0];
          const userInfo = {
            nickName: dbUserInfo.nickName || '',
            avatarUrl: dbUserInfo.avatarUrl || '',
            memberType: dbUserInfo.memberType || '普通用户'
          };
          
          // 如果数据库中有用户信息，保存到本地作为备份
          if (userInfo.nickName && userInfo.avatarUrl) {
            wx.setStorageSync('localUserInfo_' + openid, userInfo);
            console.log('用户信息已保存到本地:', userInfo);
          }
          
          this.setData({
            isLogin: true,
            isPendingProfileSetup: !userInfo.nickName || !userInfo.avatarUrl,
            userInfo: userInfo
          });
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', userInfo);
          wx.setStorageSync('isLogin', true);
          
          console.log('用户已登录，用户信息:', userInfo);
        } else {
          // 用户不存在，设置为未登录状态
          console.log('用户未注册');
          this.setData({
            isLogin: false,
            isPendingProfileSetup: false
          });
          
          wx.removeStorageSync('userInfo');
          wx.setStorageSync('isLogin', false);
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('查询用户失败', err);
        
        // 查询失败也设置为未登录状态
        this.setData({
          isLogin: false,
          isPendingProfileSetup: false
        });
        
        wx.removeStorageSync('userInfo');
        wx.setStorageSync('isLogin', false);
      }
    });
  },
  
  // 检查用户资料状态
  checkProfileStatus: function() {
    const isLogin = this.data.isLogin;
    const userInfo = this.data.userInfo;
    
    if (isLogin && (!userInfo.nickName || !userInfo.avatarUrl)) {
      // 已登录但缺少头像或昵称，需要完善资料
      this.setData({
        isPendingProfileSetup: true
      });
      
      // 如果是刚登录成功，显示个人信息弹窗
      if (this.data.justLoggedIn) {
        this.setData({
          justLoggedIn: false
        });
        
        setTimeout(() => {
          this.showProfileDialog();
        }, 300);
      }
    } else {
      this.setData({
        isPendingProfileSetup: false
      });
    }
  },

  // 处理头像选择
  onChooseAvatar: function(e) {
    const { avatarUrl } = e.detail;
    console.log('用户选择了头像', avatarUrl);
    
    // 更新临时数据
    this.setData({
      'tempUserInfo.avatarUrl': avatarUrl
    });
  },
  
  // 处理昵称输入
  onNicknameInput: function(e) {
    this.setData({
      'tempUserInfo.nickName': e.detail.value
    });
  },
  
  // 昵称审核回调
  onNickNameReview: function(e) {
    console.log('昵称审核结果', e.detail);
  },

  // 显示个人信息弹窗
  showProfileDialog: function() {
    console.log('显示个人信息弹窗');
    
    // 初始化临时用户信息数据
    const userInfo = this.data.userInfo;
    this.setData({
      showProfileDialog: true,
      tempUserInfo: {
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName || ''
      }
    });
  },

  // 隐藏个人信息弹窗
  hideProfileDialog: function() {
    this.setData({
      showProfileDialog: false,
      isPendingProfileSetup: true,
      'userInfo.nickName': '', // 清空昵称，这样模板会显示"点击设置昵称及头像"
      'userInfo.avatarUrl': '' // 清空头像
    });
  },

  // 阻止事件冒泡，防止点击弹窗内容区域关闭弹窗
  stopPropagation: function() {
    return;
  },

  // 确认个人信息设置
  confirmProfile: function() {
    const { nickName, avatarUrl } = this.data.tempUserInfo;
    
    // 校验数据
    if (!nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    if (!avatarUrl) {
      wx.showToast({
        title: '请选择头像',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...'
    });
    
    // 调用云函数获取openid
    wx.cloud.callFunction({
      name: 'login',
      success: loginRes => {
        if (loginRes.result.error) {
          console.error('云函数返回错误:', loginRes.result.error);
          this.loginFail(new Error(loginRes.result.error));
          return;
        }
        
        const db = wx.cloud.database();
        const userInfo = {
          nickName: nickName,
          avatarUrl: avatarUrl,
          openid: loginRes.result.openid,
          memberType: this.data.userInfo.memberType || '普通用户'
        };
        
        // 检查用户是否已存在
        db.collection('users').where({
          openid: loginRes.result.openid
        }).get().then(checkRes => {
          if (checkRes.data.length > 0) {
            // 更新已存在的用户信息
            db.collection('users').doc(checkRes.data[0]._id).update({
              data: {
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl,
                updateTime: db.serverDate()
              }
            }).then(() => {
              this.loginSuccess(userInfo);
            }).catch(err => {
              console.error('更新用户信息失败', err);
              this.loginFail(err);
            });
          } else {
            // 添加新用户
            db.collection('users').add({
              data: {
                ...userInfo,
                createTime: db.serverDate()
              }
            }).then(() => {
              this.loginSuccess(userInfo);
            }).catch(err => {
              console.error('添加新用户失败', err);
              this.loginFail(err);
            });
          }
        }).catch(err => {
          console.error('查询用户失败', err);
          this.loginFail(err);
        });
      },
      fail: err => {
        console.error('调用云函数失败', err);
        this.loginFail(err);
      }
    });
  },
  
  // 登录成功处理
  loginSuccess: function(userInfo) {
    wx.hideLoading();
    
    // 更新页面数据
    this.setData({
      userInfo: userInfo,
      isLogin: true,
      isPendingProfileSetup: false,
      showProfileDialog: false,
      tempUserInfo: {
        avatarUrl: '',
        nickName: ''
      }
    });
    
    // 更新全局状态
    const app = getApp();
    app.globalData.userInfo = userInfo;
    app.globalData.isLogin = true;
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },
  
  // 登录失败处理
  loginFail: function(err) {
    console.error('登录失败', err);
    wx.hideLoading();
    wx.showToast({
      title: err.message || '保存失败',
      icon: 'error'
    });
  },

  // 跳转到登录页面
  goToLogin: function() {
    // 检查是否已经登录但只是需要设置个人信息
    if (this.data.isPendingProfileSetup) {
      // 如果是已登录但未设置个人信息，显示个人信息弹窗
      this.showProfileDialog();
      return;
    }
    
    // 跳转到登录页面
    wx.navigateTo({
      url: '/pages/login/index?from=profile'
    });
  },

  // 跳转到设置页面
  goToSettings: function() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  // 跳转到会员页面
  goToMembership: function(e) {
    // 获取事件来源，区分整个卡片点击和按钮点击
    const from = e && e.currentTarget ? e.currentTarget.dataset.from : '';
    console.log('跳转到会员页面，来源:', from);
    
    // 如果是按钮点击，则阻止事件冒泡到卡片
    if (from === 'button') {
      // 使用catchtap已经阻止了冒泡，这里只需要跳转即可
      wx.navigateTo({
        url: '/packageB/pages/membership/index'
      });
      return;
    }
    
    // 如果是卡片点击，直接跳转
    if (from === 'card') {
      wx.navigateTo({
        url: '/packageB/pages/membership/index'
      });
    }
  },
  
  // 处理会员续费
  goToRenew: function(e) {
    console.log('跳转到会员续费页面');
    
    // 跳转到会员页面并传递续费参数
    wx.navigateTo({
      url: '/packageB/pages/membership/index?action=renew'
    });
  },

  // 跳转到客服页面
  goToCustomerService: function() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 获取会员状态
  getMembershipStatus: function () {
    const app = getApp();
    
    // 先检查全局状态
    if (app.globalData.membershipStatus) {
      this.setData({
        membershipStatus: {
          isMember: app.globalData.membershipStatus.isMember,
          expireDate: app.globalData.membershipStatus.membershipDate ? this.formatDate(app.globalData.membershipStatus.membershipDate) : null
        }
      });
    }
    
    if (!app.globalData.isLogin || !app.globalData.userInfo || !app.globalData.userInfo.openid) {
      // 未登录或无用户信息时直接设置为非会员
      this.setData({
        membershipStatus: {
          isMember: false,
          expireDate: null
        }
      });
      return;
    }
    
    // 从数据库获取最新会员状态
    const db = wx.cloud.database();
    db.collection('users').where({
      openid: app.globalData.userInfo.openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        const userInfo = res.data[0];
        const now = new Date();
        
        // 优先使用 membershipDate，如果不存在则尝试使用 memberExpireDate（向后兼容）
        let membershipDate = null;
        if (userInfo.membershipDate) {
          membershipDate = new Date(userInfo.membershipDate);
        } else if (userInfo.memberExpireDate) {
          membershipDate = new Date(userInfo.memberExpireDate);
          // 如果存在旧字段，更新为新字段
          db.collection('users').doc(userInfo._id).update({
            data: {
              membershipDate: userInfo.memberExpireDate,
              memberExpireDate: null // 清除旧字段
            }
          }).then(() => {
            console.log('已将 memberExpireDate 迁移到 membershipDate');
          }).catch(err => {
            console.error('迁移会员日期字段失败:', err);
          });
        }
        
        // 检查会员是否有效
        const isMember = membershipDate && membershipDate > now;
        
        // 更新UI状态
        this.setData({
          membershipStatus: {
            isMember: isMember,
            expireDate: membershipDate ? this.formatDate(membershipDate) : null
          }
        });
        
        // 同时更新app.globalData
        app.globalData.membershipStatus = {
          isMember: isMember,
          membershipDate: membershipDate
        };
      } else {
        // 用户不存在，显示非会员状态
        this.setData({
          membershipStatus: {
            isMember: false,
            expireDate: null
          }
        });
      }
    }).catch(err => {
      console.error('获取会员状态失败:', err);
      // 发生错误时显示非会员状态
      this.setData({
        membershipStatus: {
          isMember: false,
          expireDate: null
        }
      });
    });
  },

  // 格式化日期为 YYYY年MM月DD日
  formatDate: function(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  },

  // 跳转到功能页面
  navigateToFunction: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  }
}); 