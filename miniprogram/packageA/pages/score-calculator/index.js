// 引入way.js的计算函数
const {
  calculateChineseScore,
  calculateMathScore,
  calculateEnglishScore,
  calculatePhysicalScore,
  calculateChemistryScore,
  calculateBiologyScore,
  calculateHistoryScore,
  calculateMoralityScore,
  calculateITScore,
  calculateArtScore,
  calculateMusicScore,
  calculateLabourScore,
  calculatePhysicalEducationScore,
  calculateTotalScore
} = require('../calculation/way');

// 获取app实例
const app = getApp();

Page({
  data: {
    // 各科目分数
    originalScores: {
      chinese: '', // 语文
      math: '', // 数学
      english: '', // 英语
      englishListening: '', // 英语听力
      physical: '', // 物理
      physicalExperimental: '', // 物理实验
      chemistry: '', // 化学
      chemistryExperimental: '', // 化学实验
      biology: '', // 生物
      biologyExperimental: '', // 生物实验
      history: '', // 历史
      morality: '', // 道德与法治
      it: '', // 信息技术
      art: '', // 美术
      music: '', // 音乐
      labour: '', // 劳动技术
      physicalEducation: '' // 体育
    },
    calculatedScores: {}, // 计算后的分数
    totalScore: 0, // 总分
    showResult: false, // 是否显示结果
    // 控制每个科目的展示状态
    showEnglishListening: false,
    showPhysicalExperimental: false,
    showChemistryExperimental: false,
    showBiologyExperimental: false,
    isVip: false, // 会员状态，默认为非会员
    showVipModal: false // 控制会员提示模态框
  },

  onLoad: function () {
    console.log('score-calculator onLoad triggered'); // 添加日志：页面onLoad触发
    // 记录全局会员状态
    console.log('全局会员状态:', app.globalData.membershipStatus);
    // 页面加载
    this.checkVipStatus();
  },

  // 检查会员状态
  checkVipStatus: function() {
    // 从全局数据中获取会员状态
    const isMember = app.globalData.membershipStatus && app.globalData.membershipStatus.isMember || false;
    console.log('分数计算器：会员状态检查结果 =', isMember);
    this.setData({ isVip: isMember });
  },

  // 处理输入变化
  handleInputChange: function (e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    // 更新对应字段的值
    this.setData({
      [`originalScores.${field}`]: value
    });
    
    // 特殊字段输入后展示相关字段
    switch (field) {
      case 'english':
        this.setData({ showEnglishListening: !!value });
        break;
      case 'physical':
        this.setData({ showPhysicalExperimental: !!value });
        break;
      case 'chemistry':
        this.setData({ showChemistryExperimental: !!value });
        break;
      case 'biology':
        this.setData({ showBiologyExperimental: !!value });
        break;
    }
  },

  // 清除所有输入
  clearInputs: function () {
    this.setData({
      originalScores: {
        chinese: '',
        math: '',
        english: '',
        englishListening: '',
        physical: '',
        physicalExperimental: '',
        chemistry: '',
        chemistryExperimental: '',
        biology: '',
        biologyExperimental: '',
        history: '',
        morality: '',
        it: '',
        art: '',
        music: '',
        labour: '',
        physicalEducation: ''
      },
      calculatedScores: {},
      totalScore: 0,
      showResult: false,
      showEnglishListening: false,
      showPhysicalExperimental: false,
      showChemistryExperimental: false,
      showBiologyExperimental: false,
      showVipModal: false // 清空时也隐藏模态框
    });
  },

  // 计算分数
  calculateScores: function () {
    const { originalScores, isVip } = this.data;
    
    // 数据验证
    if (!this.validateInputs()) {
      return;
    }
    
    if (isVip) {
      // -------- 会员逻辑 --------
    // 将输入值转为数字
    const scores = {};
    for (let key in originalScores) {
      if (originalScores[key]) {
        scores[key] = parseFloat(originalScores[key]);
      } else {
        scores[key] = 0;
      }
    }
    
    // 计算各科目折算分数
    const calculatedScores = {
      chinese: calculateChineseScore(scores.chinese),
      math: calculateMathScore(scores.math),
      english: calculateEnglishScore(scores.english, scores.englishListening),
      physical: calculatePhysicalScore(scores.physical, scores.physicalExperimental),
      chemistry: calculateChemistryScore(scores.chemistry, scores.chemistryExperimental),
      biology: calculateBiologyScore(scores.biology, scores.biologyExperimental),
      history: calculateHistoryScore(scores.history),
      morality: calculateMoralityScore(scores.morality),
      it: calculateITScore(scores.it),
      art: calculateArtScore(scores.art),
      music: calculateMusicScore(scores.music),
      labour: calculateLabourScore(scores.labour),
      physicalEducation: calculatePhysicalEducationScore(scores.physicalEducation)
    };
    
    // 计算总分
    const totalScore = calculateTotalScore(calculatedScores);
    
    this.setData({
      calculatedScores,
      totalScore,
      showResult: true
    });
    } else {
      // -------- 非会员逻辑 --------
      // 显示会员提示模态框
      this.setData({
        showVipModal: true
      });
    }
  },
  
  // 验证输入是否有效
  validateInputs: function() {
    const { originalScores } = this.data;
    const requiredFields = ['chinese', 'math', 'english'];
    
    // 检查必填字段
    for (let field of requiredFields) {
      if (!originalScores[field]) {
        wx.showToast({
          title: `请输入${this.getFieldName(field)}`,
          icon: 'none'
        });
        return false;
      }
    }
    
    // 验证英语听力
    if (originalScores.english && !originalScores.englishListening) {
      wx.showToast({
        title: '请输入英语听力成绩',
        icon: 'none'
      });
      return false;
    }
    
    // 验证物理实验
    if (originalScores.physical && !originalScores.physicalExperimental) {
      wx.showToast({
        title: '请输入物理实验成绩',
        icon: 'none'
      });
      return false;
    }
    
    // 验证化学实验
    if (originalScores.chemistry && !originalScores.chemistryExperimental) {
      wx.showToast({
        title: '请输入化学实验成绩',
        icon: 'none'
      });
      return false;
    }
    
    // 验证生物实验
    if (originalScores.biology && !originalScores.biologyExperimental) {
      wx.showToast({
        title: '请输入生物实验成绩',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },
  
  // 获取字段中文名称
  getFieldName: function(field) {
    const fieldNames = {
      chinese: '语文',
      math: '数学',
      english: '英语',
      englishListening: '英语听力',
      physical: '物理',
      physicalExperimental: '物理实验',
      chemistry: '化学',
      chemistryExperimental: '化学实验',
      biology: '生物',
      biologyExperimental: '生物实验',
      history: '历史',
      morality: '道德与法治',
      it: '信息技术',
      art: '美术',
      music: '音乐',
      labour: '劳动技术',
      physicalEducation: '体育'
    };
    
    return fieldNames[field] || field;
  },
  
  // -------- 新增非会员相关函数 --------
  // 关闭会员提示模态框
  closeVipModal: function() {
    this.setData({
      showVipModal: false
    });
  },
  
  // 跳转到购买会员页面
  goToVipPage: function() {
    // 关闭模态框
    this.closeVipModal(); 
    // 跳转到会员购买页
    wx.navigateTo({
      url: '/packageB/pages/membership/index'
    });
  },
  // -------- 结束新增 --------
  
  // 返回上一页
  navigateBack: function() {
    console.log('分数计算器：触发返回按钮');
    // 尝试正常返回
    wx.navigateBack({
      fail: (err) => { 
        console.error('返回失败，尝试跳转到首页:', err);
        // 如果返回失败，直接跳转到主页
        wx.switchTab({
          url: '/pages/index/index',
          fail: (switchErr) => console.error('所有返回方式均失败:', switchErr)
        });
      }
    });
  }
}); 