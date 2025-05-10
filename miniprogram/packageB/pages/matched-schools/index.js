// matched-schools.js
const highSchoolsData = require('../../../data/high-schools');

Page({
  data: {
    userScore: null,
    targetSchool: null,
    targetSchoolScore: null,
    matchedSchools: [],
    filteredSchools: [],
    activeTab: 'all',
    // 存储高中数据
    schoolsData: null,
    // 会员状态
    isMember: false
  },

  onLoad: function(options) {
    // 获取会员状态
    const app = getApp();
    const isMember = app.globalData.membershipStatus.isMember;
    this.setData({ isMember });
    
    // 从缓存加载用户信息
    this.loadUserSettings();
    
    // 加载高中学校数据
    this.loadHighSchoolData();

    console.log('matched-schools页面载入完成，会员状态:', isMember);
  },
  
  onShow: function() {
    // 每次页面显示时刷新会员状态
    const app = getApp();
    const isMember = app.globalData.membershipStatus.isMember;
    this.setData({ isMember });
    
    // 刷新学校列表
    if (this.data.matchedSchools.length === 0) {
      this.loadAllMatchedSchools();
    }

    console.log('matched-schools页面显示，会员状态:', isMember);
  },
  
  // 加载用户设置
  loadUserSettings: function() {
    const userScore = wx.getStorageSync('userScore');
    const targetSchool = wx.getStorageSync('targetSchool');
    const targetSchoolScore = wx.getStorageSync('targetSchoolScore');
    
    this.setData({ 
      userScore,
      targetSchool,
      targetSchoolScore
    });

    console.log('用户设置加载完成，成绩:', userScore);
  },
  
  // 从本地数据加载高中学校数据
  loadHighSchoolData: function() {
    wx.showLoading({ title: '加载中' });
    
    // 直接使用引入的高中数据
    this.setData({
      schoolsData: highSchoolsData
    }, () => {
      // setData 回调
      console.log('高中学校数据加载成功，数据:', JSON.stringify(highSchoolsData).substring(0, 100) + '...');
      // 加载所有匹配学校
      this.loadAllMatchedSchools();
      wx.hideLoading();
    });
  },
  
  // 加载所有可匹配的学校
  loadAllMatchedSchools: function() {
    try {
      console.log('开始加载匹配学校数据');
      // 先尝试从本地缓存获取完整的匹配学校数据
      const allMatchedSchools = wx.getStorageSync('allMatchedSchools');
      
      if (allMatchedSchools && allMatchedSchools.reachable && allMatchedSchools.unreachable) {
        // 使用缓存中的数据（首页已经计算好的完整匹配学校数据）
        console.log('使用缓存的匹配学校数据', JSON.stringify(allMatchedSchools).substring(0, 100) + '...');
        
        // 合并可达到和不可达到的学校列表
        const matchedSchools = [
          ...allMatchedSchools.reachable,
          ...allMatchedSchools.unreachable
        ].sort((a, b) => a.rank - b.rank); // 按排名排序
        
        // 更新数据
        this.setData({
          userScore: allMatchedSchools.userScore || this.data.userScore,
          matchedSchools: matchedSchools,
          filteredSchools: matchedSchools
        });
        
        console.log('从缓存加载了', matchedSchools.length, '所学校');
        return;
      }
      
      console.log('缓存中没有匹配学校数据，将直接使用high-schools.js数据重新计算');
      
      // 检查用户分数
      if (!this.data.userScore) {
        console.warn('没有用户分数，无法计算匹配学校');
        this.setData({ 
          matchedSchools: [],
          filteredSchools: []
        });
        return;
      }
      
      // 检查并直接使用引入的高中数据
      if (!highSchoolsData || !highSchoolsData["昆明市高中录取信息汇总"]) {
        console.error('数据引入错误，high-schools.js数据格式不正确');
        
        // 尝试打印出高中数据的结构
        console.log('高中数据结构:', JSON.stringify(highSchoolsData).substring(0, 100) + '...');
        
        this.setData({ 
          matchedSchools: [],
          filteredSchools: []
        });
        return;
      }

      const schoolList = highSchoolsData["昆明市高中录取信息汇总"] || [];
      const userScore = Number(this.data.userScore);
      
      console.log('直接使用high-schools.js计算 - 用户分数:', userScore, '学校数量:', schoolList.length);
      
      // 处理所有学校数据
      const matchedSchools = schoolList.map(school => {
        const schoolScore = Number(school.score); // 使用2024年分数
        
        return {
          schoolName: school.schoolName,
          score: school.score,
          rank: school.rank || 0,
          type: school.type || '',
          level: school.level || '',
          address: school.address || '',
          reachable: schoolScore <= userScore,
          difference: schoolScore > userScore ? schoolScore - userScore : 0
        };
      });
      
      // 对学校按照排名排序
      matchedSchools.sort((a, b) => a.rank - b.rank);
      
      console.log('计算得到', matchedSchools.length, '所学校');
      
      this.setData({ 
        matchedSchools: matchedSchools,
        filteredSchools: matchedSchools // 初始显示全部
      });
      
      // 保存计算结果到缓存中
      const reachableSchools = matchedSchools.filter(school => school.reachable);
      const unreachableSchools = matchedSchools.filter(school => !school.reachable);
      
      wx.setStorageSync('allMatchedSchools', {
        reachable: reachableSchools,
        unreachable: unreachableSchools,
        userScore: userScore
      });
      
    } catch (e) {
      console.error('加载学校数据失败', e);
      this.setData({ 
        matchedSchools: [],
        filteredSchools: []
      });
    }
  },
  
  // 切换标签筛选
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    let filteredSchools = [];
    
    if (tab === 'all') {
      filteredSchools = this.data.matchedSchools;
    } else if (tab === 'reachable') {
      filteredSchools = this.data.matchedSchools.filter(school => school.reachable);
    } else if (tab === 'unreachable') {
      filteredSchools = this.data.matchedSchools.filter(school => !school.reachable);
    }
    
    this.setData({
      activeTab: tab,
      filteredSchools: filteredSchools
    });
    
    console.log('切换到', tab, '标签，筛选出', filteredSchools.length, '所学校');
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
}); 