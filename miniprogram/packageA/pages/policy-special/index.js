// pages/policy-special/index.js
import ashimaPolicy from './ashimaPolicy.js';
import minorityPolicy from './minorityPolicy.js';

// 获取应用实例
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 添加审核控制变量
    ischeck: true,
    // 会员状态
    isMember: false,
    // 当前选中的标签页索引
    currentTabIndex: 0,
    // 标签数据
    tabs: [
      { id: 0, name: '民族班', key: 'minority' },
      { id: 1, name: '阿诗玛班', key: 'ashima' },
      { id: 2, name: '体育特长生', key: 'sports' }
    ],
    // 政策数据
    minorityPolicy: null,
    ashimaPolicy: null,
    // 数据加载状态
    loading: true,
    // UI相关
    statusBarHeight: 0,
    navBarHeight: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置审核状态
    this.setData({
      ischeck: app.globalData.ischeck
    });
    
    // 加载政策数据
    this.loadPolicyData();
    
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    // 自定义导航栏高度（根据设计稿调整）
    const navBarHeight = 44;
    
    this.setData({
      statusBarHeight,
      navBarHeight,
      totalNavHeight: statusBarHeight + navBarHeight
    });
  },

  /**
   * 加载政策数据
   */
  loadPolicyData() {
    this.setData({
      minorityPolicy: minorityPolicy,
      ashimaPolicy: ashimaPolicy,
      loading: false
    });
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    
    if (index !== this.data.currentTabIndex) {
      this.setData({
        currentTabIndex: index
      });
    }
  },

  /**
   * 返回首页
   */
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 跳转到首页
   */
  navigateToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 查看学校详情
   */
  viewSchoolDetail(e) {
    const { school } = e.currentTarget.dataset;
    
    // 可以在这里跳转到学校详情页
    console.log('查看学校详情:', school);
    
    // 示例：跳转到学校详情页
    wx.navigateTo({
      url: `/pages/school-detail/index?schoolName=${encodeURIComponent(school.name)}`
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '昆明市中考特殊政策详解 - 民族班、阿诗玛班等降分录取政策',
      path: '/pages/policy-special/index'
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '昆明市中考特殊政策详解 - 民族班、阿诗玛班等降分录取政策'
    };
  },

  /**
   * 前往VIP购买页面
   */
  goToVip() {
    wx.navigateTo({
      url: '/pages/vip/index'
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面初次渲染完成
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 获取会员状态，但在审核期间（ischeck为true时），强制显示为会员版本
    const isMember = this.data.ischeck ? true : app.globalData.membershipStatus.isMember;
    this.setData({ isMember });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新
    this.loadPolicyData();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 上拉触底
  }
})