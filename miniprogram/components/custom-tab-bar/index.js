Component({
  data: {
    selected: 0,
    color: "#999",
    selectedColor: "#8E54E9",
    backgroundColor: "#fff",
    // 保留会员版TabBar作为唯一的列表
    tabList: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/images/tabbar/home.png",
        selectedIconPath: "/images/tabbar/home-active.png"
      },
      {
        pagePath: "/pages/school-list/index",
        text: "高中信息",
        iconPath: "/images/tabbar/school.png",
        selectedIconPath: "/images/tabbar/school-active.png"
      },
      {
        pagePath: "/pages/policy-direction/index",
        text: "定向生咨询",
        iconPath: "/images/tabbar/policy.png",
        selectedIconPath: "/images/tabbar/policy-avctive.png"
      },
      {
        pagePath: "/pages/profile/index",
        text: "我的",
        iconPath: "/images/tabbar/user.png",
        selectedIconPath: "/images/tabbar/user-active.png"
      }
    ]
    // 移除 nonVipTabList
    // 移除 data.tabList，因为它现在固定为 vipTabList
  },

  lifetimes: {
    attached: function() {
      this.setInitialSelected();
      // checkMemberStatus 可能仍需用于视觉更新（如果图标等不同），但不再切换列表
      // this.checkMemberStatus(); 
    }
  },

  pageLifetimes: {
    show: function() {
      this.setInitialSelected();
      // this.checkMemberStatus();
    }
  },

  methods: {
    // 更新当前选中的TabBar项
    setInitialSelected: function() {
      const pages = getCurrentPages();
      if (pages.length === 0) return; // 增加保护
      const currentPage = pages[pages.length - 1];
      const currentRoute = '/' + currentPage.route;

      // 使用固定的 tabList
      const tabList = this.data.tabList; 
      
      let selected = 0;
      for (let i = 0; i < tabList.length; i++) {
        if (tabList[i].pagePath === currentRoute) {
          selected = i;
          break;
        }
      }

      // 只更新 selected
      this.setData({
        selected: selected
      });
    },

    // 检查会员状态并更新tabBar（现在可选，仅用于视觉更新）
    checkMemberStatus: function() {
      const app = getApp();
      const isMember = app.globalData.membershipStatus.isMember;
      
      console.log('tabBar组件 - 会员状态检查:', isMember);
      
      // 示例：如果会员/非会员图标不同，可以在这里setData更新图标路径
      // 但当前设计图标一致，此方法可以暂时不调用或保持为空
      // this.setData({
      //   tabList: isMember ? this.data.vipTabList : this.data.nonVipTabList // 不再需要切换列表
      // });
    },

    // 切换TabBar项
    switchTab: function(e) {
      const index = e.currentTarget.dataset.index;
      const pagePath = this.data.tabList[index].pagePath;
      
      // 改回使用 wx.switchTab
      wx.switchTab({
        url: pagePath,
        fail: (err) => {
          console.error('wx.switchTab 跳转失败:', pagePath, err);
          // 如果 switchTab 失败（理论上不应发生，因为路径在app.json中）
          // 可以考虑备用方案，例如 reLaunch，但优先排查配置问题
          wx.reLaunch({ url: pagePath }); 
        }
      });
      
      // wx.switchTab 会自动处理选中状态，无需手动 setData
      // this.setData({
      //   selected: index
      // });
    }
  }
}) 