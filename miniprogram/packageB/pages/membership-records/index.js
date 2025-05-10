// 会员购买记录页面
Page({
  data: {
    // 用户信息
    userInfo: null,
    // 是否登录
    isLogin: false,
    // 购买记录列表
    records: [],
    // 是否加载中
    loading: true,
    // 是否有更多数据
    hasMore: true,
    // 当前页数
    page: 1
  },

  onLoad: function () {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 加载数据
    this.loadRecords();
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo');
    
    this.setData({
      isLogin: !!userInfo,
      userInfo: userInfo
    });
    
    if (!userInfo) {
      // 未登录，跳转到登录页
      wx.navigateTo({
        url: '/pages/login/index',
      });
    }
  },

  // 加载购买记录
  loadRecords: function (isRefresh = false) {
    if (!this.data.isLogin) {
      return;
    }
    
    const page = isRefresh ? 1 : this.data.page;
    
    this.setData({
      loading: true
    });
    
    // 这里模拟从服务器获取数据
    setTimeout(() => {
      // 假数据，实际应用中应该从服务器获取
      const mockRecords = [
        {
          id: '1001',
          planName: '年度会员',
          price: 168,
          purchaseTime: '2024-03-15 14:30:22',
          expireTime: '2025-03-15 14:30:22',
          status: 'active',
          paymentMethod: '微信支付',
          orderNumber: 'M20240315143022'
        },
        {
          id: '1002',
          planName: '季度会员',
          price: 48,
          purchaseTime: '2023-12-10 09:15:37',
          expireTime: '2024-03-10 09:15:37',
          status: 'expired',
          paymentMethod: '微信支付',
          orderNumber: 'M20231210091537'
        },
        {
          id: '1003',
          planName: '月度会员',
          price: 18.8,
          purchaseTime: '2023-09-05 18:22:10',
          expireTime: '2023-10-05 18:22:10',
          status: 'expired',
          paymentMethod: '微信支付',
          orderNumber: 'M20230905182210'
        }
      ];
      
      if (isRefresh) {
        this.setData({
          records: mockRecords,
          loading: false,
          page: 2,
          hasMore: mockRecords.length >= 10 // 一页显示10条
        });
      } else {
        // 模拟没有更多数据
        if (page > 1) {
          this.setData({
            loading: false,
            hasMore: false
          });
          return;
        }
        
        this.setData({
          records: [...this.data.records, ...mockRecords],
          loading: false,
          page: this.data.page + 1,
          hasMore: mockRecords.length >= 10 // 一页显示10条
        });
      }
    }, 1000);
  },

  // 刷新数据
  onPullDownRefresh: function () {
    this.loadRecords(true);
    wx.stopPullDownRefresh();
  },

  // 加载更多
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecords();
    }
  },

  // 查看订单详情
  viewOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.id;
    
    // 找到对应订单
    const order = this.data.records.find(item => item.id === orderId);
    
    // 显示订单详情
    wx.showModal({
      title: '订单详情',
      content: `订单号：${order.orderNumber}\n会员类型：${order.planName}\n支付金额：¥${order.price}\n购买时间：${order.purchaseTime}\n到期时间：${order.expireTime}\n支付方式：${order.paymentMethod}`,
      showCancel: false
    });
  }
}) 