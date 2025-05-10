// membership/index.js
// 导入YunGouOS支付SDK
import wxPayUtil from '../../../wxpay/wxPayUtil';

// 会员套餐配置
const membershipPlans = [
  {
    id: 'monthly',
    name: '月会员',
    price: 0.01,
    originalPrice: 29.9,
    duration: '1个月',
    desc: '享受全部会员权益，为中考助你一臂之力！'
  },
  {
    id: 'quarter',
    name: '季度会员',
    price: 0.01,
    originalPrice: 69.9,
    duration: '3个月',
    desc: '享受全部会员权益，更划算的选择！'
  },
  {
    id: 'yearly',
    name: '年度会员',
    price: 0.01,
    originalPrice: 258,
    duration: '12个月',
    desc: '整年备考无忧，专注提升，无限制使用全部功能！',
    recommended: true
  }
];

// 会员权益配置
const memberBenefits = [
  {
    id: 'data',
    icon: '../../images/data.png',
    title: '完整历年数据',
    desc: '查看各高中近三年完整录取分数线和指标到校情况'
  },
  {
    id: 'match',
    icon: '../../images/match.png',
    title: '院校精准匹配',
    desc: '输入成绩自动匹配合适学校，合理填报志愿'
  },
  {
    id: 'policy',
    icon: '../../images/policy.png',
    title: '政策深度解读',
    desc: '独家定向生、民族班、特殊招生政策详解'
  },
  {
    id: 'score',
    icon: '../../images/score.png',
    title: '成绩分析与预测',
    desc: '根据模拟成绩分析优劣势，预测最终录取学校'
  }
];

// 激活码输入校验规则
const codeRule = /^[A-Za-z0-9]{16}$/;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: null,
    isLogin: false,
    
    // 会员状态
    isMember: false,
    memberExpireDate: '',
    
    // 会员权益列表
    benefits: [
      {
        id: 1,
        icon: '/images/membership/benefit_1.png',
        title: '专属内容',
        desc: '解锁所有会员专属内容和服务'
      },
      {
        id: 2,
        icon: '/images/membership/benefit_2.png',
        title: '优先更新',
        desc: '会员内容优先更新，抢先体验'
      },
      {
        id: 3,
        icon: '/images/membership/benefit_3.png',
        title: '专属客服',
        desc: '享受专属客服一对一服务'
      },
      {
        id: 4,
        icon: '/images/membership/benefit_4.png',
        title: '无广告体验',
        desc: '去除所有广告，干净清爽的浏览体验'
      }
    ],
    
    // 会员套餐
    plans: [
      {
        id: 1, // 方案一：月度会员
        name: '月度会员',
        duration: '1个月',
        price: 0.01,
        originalPrice: null,
        recommended: false,
        desc: '畅享所有会员权益' // 可以自定义描述
      },
      {
        id: 2, // 方案二：季度会员
        name: '季度会员',
        duration: '3个月',
        price: 0.01,
        originalPrice: 39.9,
        recommended: true, // 推荐季度会员
        desc: '限时优惠，更划算' // 可以自定义描述
      },
      {
        id: 3, // 方案三：年度会员
        name: '年度会员',
        duration: '1年',
        price: 0.01,
        originalPrice: 169.9,
        recommended: false,
        desc: '长期畅享，性价比之选' // 可以自定义描述
      }
    ],
    selectedPlanId: 2, // 默认选中季度会员（因为它是推荐的）
    
    // 协议勾选状态
    agreementChecked: false,
    
    // 激活码面板
    activationPanelVisible: false,
    activationCode: '',
    
    // 续费状态
    isRenewal: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.checkLoginStatus();
    this.checkMemberStatus();
    
    // 检查是否是续费操作
    if (options && options.action === 'renew') {
      this.setData({
        isRenewal: true
      });
      console.log('会员续费操作');
    } else {
      this.setData({
        isRenewal: false
      });
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    const app = getApp();
    // 只读取状态，不修改用户信息
    this.setData({
      isLogin: app.globalData.isLogin,
      userInfo: app.globalData.userInfo || {}
    });
    console.log('会员页面读取登录状态:', this.data.isLogin);
  },

  /**
   * 检查会员状态
   */
  checkMemberStatus: function () {
    const app = getApp();
    const membershipStatus = app.globalData.membershipStatus;
    
    // 先使用全局状态
    if (membershipStatus) {
      this.setData({
        isMember: membershipStatus.isMember,
        memberExpireDate: membershipStatus.expireDate ? this.formatDate(membershipStatus.expireDate) : ''
      });
      console.log('会员页面使用全局会员状态:', this.data.isMember, this.data.memberExpireDate);
    }
    
    // 以下情况需要从云端获取最新状态:
    // 1. 用户已登录但全局无会员状态
    // 2. 来源于支付完成后的页面跳转
    const needRefreshFromCloud = 
      (app.globalData.isLogin && (!membershipStatus || membershipStatus.isMember === undefined)) ||
      (app.globalData.payStatus !== null && app.globalData.payStatus !== undefined);
    
    // 只在必要时查询云端会员状态
    if (needRefreshFromCloud) {
      // 如果未登录或未设置用户ID，则不查询
      if (!app.globalData.isLogin || !app.globalData.userInfo) {
        console.log('未登录或无用户信息，跳过云端会员状态查询');
        return;
      }
      
      const userId = app.globalData.userInfo._id || app.globalData.userInfo.openid;
      if (!userId) {
        console.log('无法获取用户ID，跳过云端会员状态查询');
        return;
      }
      
      console.log('从云端获取最新会员状态');
      wx.showLoading({
        title: '加载会员信息'
      });
      
      // 查询最新会员状态
      wx.cloud.callFunction({
        name: 'checkMembership',
        data: {
          userId: userId
        },
        success: (res) => {
          wx.hideLoading();
          console.log('获取最新会员状态:', res);
          
          // 解析云函数返回的会员信息
          let isMember = false;
          let expireDate = null;
          
          if (res.result && res.result.success && res.result.data) {
            isMember = res.result.data.isActive;
            expireDate = res.result.data.expireDate;
          } else if (res.result && res.result.code === 0 && res.result.data) {
            // 兼容旧格式
            isMember = res.result.data.isActive;
            expireDate = res.result.data.expireDate;
          }
          
          // 更新全局会员状态
          app.globalData.membershipStatus = {
            isMember: isMember,
            expireDate: expireDate
          };
          
          // 保存到本地存储
          wx.setStorageSync('membershipStatus', app.globalData.membershipStatus);
          
          // 更新页面状态
          this.setData({
            isMember: isMember,
            memberExpireDate: expireDate ? this.formatDate(expireDate) : ''
          });
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('获取会员状态失败:', err);
        }
      });
    }
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate: function(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date.replace(/-/g, '/'));
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  /**
   * 选择会员套餐
   */
  selectPlan: function (e) {
    const planId = e.currentTarget.dataset.id;
    this.setData({
      selectedPlanId: planId
    });
  },

  /**
   * 切换协议选中状态
   */
  toggleAgreement: function () {
    this.setData({
      agreementChecked: !this.data.agreementChecked
    });
  },

  /**
   * 购买会员
   */
  purchaseMembership: function () {
    if (!this.data.isLogin) {
      this.goToLogin();
      return;
    }
    
    if (!this.data.agreementChecked) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      });
      return;
    }
    
    const selectedPlan = this.data.plans.find(p => p.id === this.data.selectedPlanId);
    if (!selectedPlan) {
      wx.showToast({
        title: '请选择会员套餐',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '正在处理',
    });

    // 生成订单号
    const app = getApp();
    const userId = app.globalData.userInfo._id || app.globalData.userInfo.openid;
    const orderNo = wxPayUtil.getOrderNo("MP_"); // 生成订单号，MP_前缀

    // 计算支付金额，单位为元，需要确保是有效的金额
    const totalFee = selectedPlan.price;
    
    // 设置商品描述
    const body = `会员套餐-${selectedPlan.name}`;
    
    // 设置支付成功后的回调通知地址（实际项目中应该是您自己的服务器地址）
    const notifyUrl = 'https://api.example.com/payment/notify';
    
    // 附加数据，用于在支付结果中识别订单类型和会员套餐
    const attach = JSON.stringify({
      type: 'membership',
      planId: selectedPlan.id,
      userId: userId,
      duration: selectedPlan.duration
    });
    
    // 支付页面标题
    const title = '会员购买';
    
    // 保存支付的套餐信息到全局数据，以便支付成功后使用
    app.globalData.payingPlan = {
      id: selectedPlan.id,
      name: selectedPlan.name,
      price: selectedPlan.price,
      duration: selectedPlan.duration
    };
    
    // 发起支付
    wxPayUtil.toPay(orderNo, totalFee, body, notifyUrl, attach, title, (response) => {
      wx.hideLoading();
      console.log('支付结果：', response);
      
      // 支付结果由小程序的app.js的onShow方法接收并处理
      // 本页面的onShow方法会在支付完成返回时被调用，可以在那里处理支付成功后的逻辑
    });
  },
  
  /**
   * 监听页面显示，处理支付结果
   */
  onShow: function () {
    // 检查是否有支付结果返回
    const app = getApp();
    
    // 如果存在支付状态，说明刚刚进行了支付操作
    if (app.globalData.payStatus !== null && app.globalData.payStatus !== undefined) {
      // 获取订单号
      const orderNo = app.globalData.orderNo;
      
      console.log('接收到支付结果', app.globalData.payStatus);
      console.log('订单号', orderNo);
      
      if (app.globalData.payStatus === true) {
        // 支付成功处理
        this.handlePaymentSuccess(orderNo);
      } else {
        // 支付失败处理
        wx.showToast({
          title: '支付未完成',
          icon: 'none'
        });
      }
      
      // 清除支付状态，避免重复处理
      app.globalData.payStatus = null;
      app.globalData.orderNo = null;
    }
    
    // 正常的页面显示逻辑 - 只读取状态，不修改用户信息
    this.checkLoginStatus();
    this.checkMemberStatus();
  },
  
  /**
   * 处理支付成功逻辑
   */
  handlePaymentSuccess: function (orderNo) {
    const app = getApp();
    const selectedPlan = app.globalData.payingPlan || this.data.plans.find(p => p.id === this.data.selectedPlanId);
    
    if (!selectedPlan) {
      console.error('找不到套餐信息');
      return;
    }
    
    wx.showLoading({
      title: '正在处理',
    });
    
    // 计算会员到期时间
    let expireDate;
    
    // 如果是续费操作，需要基于原到期时间计算
    if (this.data.isRenewal && app.globalData.membershipStatus && app.globalData.membershipStatus.expireDate) {
      // 从原到期时间开始延长
      const currentExpireDate = new Date(app.globalData.membershipStatus.expireDate);
      
      // 检查当前会员是否已经过期，如果已过期，则从当前时间开始计算
      const now = new Date();
      if (currentExpireDate < now) {
        expireDate = new Date(); // 从当前时间开始计算
      } else {
        expireDate = currentExpireDate; // 从原到期时间开始延长
      }
    } else {
      // 新开通会员，从当前时间开始计算
      expireDate = new Date();
    }
    
    // 根据套餐类型延长会员时间
    if (selectedPlan.id === 1) { // 月度会员
      expireDate.setMonth(expireDate.getMonth() + 1);
    } else if (selectedPlan.id === 2) { // 季度会员
      expireDate.setMonth(expireDate.getMonth() + 3);
    } else if (selectedPlan.id === 3) { // 年度会员
      expireDate.setFullYear(expireDate.getFullYear() + 1);
    }
    
    console.log('计算的会员到期时间:', expireDate);
    
    // 更新用户的会员信息到数据库
    wx.cloud.callFunction({
      name: 'updateMembership',
      data: {
        userId: app.globalData.userInfo._id || app.globalData.userInfo.openid,
        expireDate: expireDate,
        orderNo: orderNo,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        isRenewal: this.data.isRenewal // 添加续费标志
      },
      success: (res) => {
        console.log('更新会员状态成功:', res.result);
        wx.hideLoading();
        
        // 格式化日期为显示格式
        const year = expireDate.getFullYear();
        const month = expireDate.getMonth() + 1;
        const day = expireDate.getDate();
        const expireDateFormatted = `${year}年${month}月${day}日`;
        
        // 更新全局会员状态
        app.globalData.membershipStatus = {
          isMember: true,
          expireDate: expireDate
        };
        
        // 保存到本地存储
        wx.setStorageSync('membershipStatus', app.globalData.membershipStatus);
        
        // 更新页面会员状态
        this.setData({
          isMember: true,
          memberExpireDate: this.formatDate(expireDate)
        });
        
        // 提示用户支付成功
        wx.showToast({
          title: this.data.isRenewal ? '会员续费成功' : '会员开通成功',
          icon: 'success',
          duration: 2000
        });
        
        // 清除支付中的套餐信息
        app.globalData.payingPlan = null;
        
        // 延迟导航，等待Toast显示
        setTimeout(() => {
          // 返回上一页，触发profile页面的onShow刷新
          wx.navigateBack();
        }, 2000);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('更新会员状态失败:', err);
        
        wx.showToast({
          title: '会员状态更新失败，请联系客服',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  /**
   * 跳转到登录页
   */
  goToLogin: function () {
    wx.navigateTo({
      url: '/pages/login/index'
    });
  },

  /**
   * 显示激活码面板
   */
  showActivationPanel: function () {
    this.setData({
      activationPanelVisible: true,
      activationCode: ''
    });
  },

  /**
   * 隐藏激活码面板
   */
  hideActivationPanel: function () {
    this.setData({
      activationPanelVisible: false
    });
  },

  /**
   * 激活码输入
   */
  inputActivationCode: function (e) {
    this.setData({
      activationCode: e.detail.value
    });
  },

  /**
   * 使用激活码
   */
  activateWithCode: function () {
    const code = this.data.activationCode.trim();
    
    if (!code) {
      wx.showToast({
        title: '请输入激活码',
        icon: 'none'
      });
      return;
    }
    
    if (!codeRule.test(code)) {
      wx.showToast({
        title: '激活码格式不正确',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '正在验证',
    });
    
    // 模拟验证过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 随机模拟成功或失败
      const success = Math.random() > 0.5;
      
      if (success) {
        // 如果激活成功，跟支付成功处理一样
        const plan = this.data.plans.find(p => p.id === 2); // 默认永久会员
        this.handlePaymentSuccess(plan);
        
        this.setData({
          activationPanelVisible: false
        });
      } else {
        wx.showToast({
          title: '激活码无效或已使用',
          icon: 'none'
        });
      }
    }, 1500);
  },

  /**
   * 查看会员协议
   */
  goToAgreement: function () {
    wx.navigateTo({
      url: '/packageB/pages/agreement/user'
    });
  },

  /**
   * 查看隐私政策
   */
  goToPrivacy: function () {
    wx.navigateTo({
      url: '/packageB/pages/agreement/privacy'
    });
  }
}); 