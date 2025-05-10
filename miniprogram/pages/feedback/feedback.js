// 反馈页面逻辑
Page({
  data: {
    // 保留一些基本数据
    nickname: '',
    systemInfo: {}
  },

  onLoad() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      systemInfo: systemInfo
    });

    // 尝试获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        nickname: userInfo.nickName || ''
      });
    }
  },

  // 导航返回
  navigateBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      });
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
}); 