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
    // 初始化云环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-2gkbbvste19738d8',  // 替换为你的云开发环境ID
        traceUser: true,
      });
      
      // 检查数据库集合是否存在
      this.checkCollection();
      
      // 自动获取用户openid并检查是否已经登录
      this.getOpenidAndCheckLogin();
    }
    
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
      // 导航栏高度的默认值
      this.setData({
        navHeight: 90
      });
    }
  },

  onShow: function () {
    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3 // 我的是第四个选项，索引为3
      });
    }
    
    // 获取最新用户信息
    const app = getApp();
    if (app.globalData.isLogin) {
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          isLogin: true,
          userInfo: userInfo
        });
      }
      
      // 从app.js获取会员状态，不进行额外查询
      this.getMembershipStatus();
    } else {
      // 未登录时也更新状态，以防用户退出登录后UI未更新
      this.setData({
        isLogin: false,
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
    }
    
    // 检查用户是否刚登录但未设置个人信息
    this.checkProfileStatus();
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
            userInfo: userInfo,
            isPendingProfileSetup: !userInfo.nickName || !userInfo.avatarUrl
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
      showProfileDialog: false
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
    
    // 调用云函数获取openid（确保有最新的openid）
    wx.cloud.callFunction({
      name: 'login',
      success: loginRes => {
        console.log('云函数登录成功', loginRes);
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
        
        // 将用户信息保存到本地，与openid关联
        wx.setStorageSync('localUserInfo_' + loginRes.result.openid, userInfo);
        console.log('用户信息已保存到本地:', userInfo);
        
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
    
    // 更新本地存储
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('isLogin', true);
    
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
    
    if (!app.globalData.isLogin) {
      // 未登录时直接设置为非会员（仅UI显示，不影响本地存储）
      this.setData({
        membershipStatus: {
          isMember: false,
          expireDate: null
        }
      });
      return;
    }
    
    // 先检查本地存储中是否有会员信息
    const localMembershipStatus = wx.getStorageSync('membershipStatus');
    
    // 然后检查app.globalData中是否有会员信息（可能从服务器更新过）
    if (app.globalData.membershipStatus && app.globalData.membershipStatus.isMember) {
      // 优先使用全局状态（可能是最新从服务器获取的）
      console.log('从app.globalData获取会员状态:', app.globalData.membershipStatus);
      
      // 格式化日期用于显示
      let expireDate = null;
      if (app.globalData.membershipStatus.expireDate) {
        const date = new Date(app.globalData.membershipStatus.expireDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        expireDate = `${year}年${month}月${day}日`;
      }
      
      // 更新UI状态
      this.setData({
        membershipStatus: {
          isMember: app.globalData.membershipStatus.isMember,
          expireDate: expireDate
        }
      });
    } else if (localMembershipStatus && localMembershipStatus.isMember) {
      // 使用本地存储的会员状态作为备份
      console.log('从本地存储获取会员状态:', localMembershipStatus);
      
      // 格式化日期用于显示
      let expireDate = null;
      if (localMembershipStatus.expireDate) {
        const date = new Date(localMembershipStatus.expireDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        expireDate = `${year}年${month}月${day}日`;
      }
      
      // 更新UI状态
      this.setData({
        membershipStatus: {
          isMember: localMembershipStatus.isMember,
          expireDate: expireDate
        }
      });
      
      // 同时更新app.globalData，保持一致性
      app.globalData.membershipStatus = localMembershipStatus;
    } else {
      // 如果全局数据和本地存储中都没有会员状态或不是会员，则显示非会员状态
      this.setData({
        membershipStatus: {
          isMember: false,
          expireDate: null
        }
      });
    }
  },

  // 跳转到功能页面
  navigateToFunction: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  }
}); 