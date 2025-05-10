// pages/userInfo/userInfo.js
Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    wxNumber: '',
    isMember: false,
    memberExpiryDate: null
  },

  onLoad: function (options) {
    // 检查是否可以使用 getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 获取用户信息
    this.getUserInfoFromCloud()
  },

  // 从云数据库获取用户信息
  getUserInfoFromCloud() {
    wx.showLoading({
      title: '加载中',
    })
    
    wx.cloud.callFunction({
      name: 'getUserInfo',
      success: res => {
        wx.hideLoading()
        console.log('获取用户信息成功', res)
        
        if (res.result.success) {
          const userData = res.result.userData
          this.setData({
            userInfo: {
              nickName: userData.nickName,
              avatarUrl: userData.avatarUrl
            },
            hasUserInfo: true,
            wxNumber: userData.wxNumber || '',
            isMember: userData.isMember || false,
            memberExpiryDate: userData.memberExpiryDate || null
          })
        }
      },
      fail: err => {
        wx.hideLoading()
        console.error('获取用户信息失败', err)
        wx.showToast({
          title: '获取信息失败',
          icon: 'error'
        })
      }
    })
  },

  // 使用 getUserProfile 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo
        
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
        
        // 保存用户信息到云数据库
        this.saveUserInfoToCloud(userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败', err)
        wx.showToast({
          title: '获取信息失败',
          icon: 'error'
        })
      }
    })
  },

  // 保存用户信息到云数据库
  saveUserInfoToCloud(userInfo) {
    wx.showLoading({
      title: '保存中',
    })
    
    wx.cloud.callFunction({
      name: 'addUserInfo',
      data: {
        wxNumber: this.data.wxNumber,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        isMember: this.data.isMember,
        memberExpiryDate: this.data.memberExpiryDate
      },
      success: res => {
        wx.hideLoading()
        console.log('保存用户信息成功', res)
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      },
      fail: err => {
        wx.hideLoading()
        console.error('保存用户信息失败', err)
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        })
      }
    })
  },

  // 输入微信号
  inputWxNumber(e) {
    this.setData({
      wxNumber: e.detail.value
    })
  },

  // 保存用户信息
  saveUserInfo() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先获取用户信息',
        icon: 'none'
      })
      return
    }
    
    this.saveUserInfoToCloud(this.data.userInfo)
  },

  // 开通会员
  becomeMember() {
    // 这里可以接入支付功能
    // 示例：假设会员有效期为一年
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    
    this.setData({
      isMember: true,
      memberExpiryDate: expiryDate
    })
    
    if (this.data.hasUserInfo) {
      this.saveUserInfoToCloud(this.data.userInfo)
    }
  }
}) 