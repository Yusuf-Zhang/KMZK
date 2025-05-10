Component({
  properties: {
    // 是否显示返回按钮
    showBack: {
      type: Boolean,
      value: false
    },
    // 自定义标题
    title: {
      type: String,
      value: "昆明中考助手"
    }
  },
  
  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
    menuButton: wx.getMenuButtonBoundingClientRect()
  },
  
  lifetimes: {
    attached() {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      // 设置状态栏高度
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight
      });
      
      // 获取全局导航栏高度
      const app = getApp();
      if (app.globalData && app.globalData.navBarHeight) {
        this.setData({
          navBarHeight: app.globalData.navBarHeight - systemInfo.statusBarHeight
        });
      }
    }
  },
  
  methods: {
    // 返回上一页
    navBack() {
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
  }
}) 