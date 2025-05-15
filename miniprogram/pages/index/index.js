const { envList } = require("../../envList");
const { QuickStartPoints, QuickStartSteps } = require("./constants");
// 导入数据库服务
const { timelineService } = require('../../utils/db-service');
// 导入高中学校数据
const highSchoolsData = require('../../data/high-schools');

// 预先声明全局变量存储昆明市高中数据
// let kmSchoolsList = [];

Page({
  data: {
    // 会员状态
    isMember: false,
    // 梦想启航部分
    userScore: null, // 用户成绩
    targetSchool: null, // 目标院校
    scoreDifference: null, // 分数差距 (会员显示)
    matchedSchools: [], // 可匹配院校列表
    
    // 新增学校搜索相关数据
    schoolSearchList: [], // 模糊搜索结果
    showSchoolSearch: false, // 是否显示学校搜索框
    searchKeyword: '', // 搜索关键词
    targetSchoolScore: null, // 目标学校分数线

    // 成绩输入模态框
    showScoreInput: false, // 是否显示成绩输入框
    scoreInput: '', // 成绩输入值
    
    // 中考时间线部分
    timeline: [], // 时间线数据
    upcomingTimeline: [], // 即将到来的事件（未过期的最近3个事件）
    remainingDays: null, // 距离中考的天数
    fullTimelineData: [], // 完整的时间线数据
    showTimelineModal: false, // 是否显示完整时间线模态框

    // 快捷入口部分
    quickLinks: [
      { id: 1, name: '高中信息', icon: '../../images/icons/1.png', url: '/pages/school-list/index', isTab: true },
      { id: 2, name: '定向生咨询', icon: '../../images/icons/2.png', url: '/pages/policy-direction/index', isTab: true },
      { id: 3, name: '特殊招生', icon: '../../images/icons/3.png', url: '/packageA/pages/policy-special/index', isTab: false },
      { id: 4, name: '分数计算器', icon: '../../images/icons/4.png', url: '/packageA/pages/score-calculator/index', isTab: false }
    ],

    // VIP相关 (非会员使用)
    showVipModal: false, // 是否显示VIP模态框

    knowledgePoints: QuickStartPoints,
    steps: QuickStartSteps,

    // 新增导航栏高度数据
    navHeight: 90, // 默认导航栏高度,
    
    // 存储高中数据
    schoolsData: null
  },

  onLoad: function () {
    // 预先读取昆明市高中数据
    // this.loadKmSchoolsFromFile();
    
    this.loadTimelineData();
    this.calculateRemainingDays();
    
    // 从缓存或云端加载用户设置
    this.loadUserSettings();
    
    // 强制清除旧的学校数据缓存，确保使用最新数据
    wx.removeStorageSync('highSchoolsData');
    wx.removeStorageSync('kmSchoolsData');
    
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
    
    // 加载高中学校数据
    this.loadHighSchoolData();
  },
  
  onShow: function() {
    const app = getApp();
    const isMember = app.globalData.membershipStatus.isMember;
    this.setData({ isMember });

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }

    // 每次页面显示时重新计算天数，确保数据最新
    this.calculateRemainingDays();
    // 根据会员状态更新快捷链接 URL
    this.updateQuickLinks(isMember);
    // 重新加载用户设置，因为可能在其他页面登录或购买会员
    this.loadUserSettings();
    // 根据最新的会员状态重新加载学校数据，确保显示正确
    // 注意：loadSchoolsData 内部现在需要根据 isMember 调整逻辑
    if (!this.data.schoolsData) {
      // If schoolsData is not loaded at all (e.g., initial onShow or error in onLoad's loadHighSchoolData),
      // call loadHighSchoolData. It will then call loadSchoolsData in its callback if userScore is present.
      console.log('onShow: schoolsData not present, calling loadHighSchoolData()');
      this.loadHighSchoolData();
    } else {
      // schoolsData is already loaded.
      // Call loadSchoolsData if userScore is present, as userScore might have changed in loadUserSettings.
      console.log('onShow: schoolsData IS present. Checking userScore to call loadSchoolsData()');
      if (this.data.userScore) {
        this.loadSchoolsData();
      } else {
        // No user score, ensure matchedSchools is empty
        this.setData({ matchedSchools: [] });
        wx.removeStorageSync('matchedSchools');
      }
    }
  },
  
  // 从本地数据加载高中学校数据
  loadHighSchoolData: function() {
    wx.showLoading({ title: '加载中' });
    
    // 直接使用本地数据（确保从high-schools.js引用）
    const localHighSchoolsData = require('../../data/high-schools');
    
    this.setData({
      schoolsData: localHighSchoolsData
    }, () => {
      // setData 回调
      console.log('高中学校数据加载成功 (setData callback)');
      // 如果已经有用户分数，重新计算匹配学校
      if (this.data.userScore) {
        this.loadSchoolsData();
      }
      wx.hideLoading();
    });
  },

  // 根据会员状态更新快捷链接
  updateQuickLinks: function(isMember) {
    const links = this.data.quickLinks.map(link => {
      switch(link.id) {
        case 1: // 高中信息
          link.url = isMember ? '/pages/school-list/index' : '/pages/school-list/index'; // 都指向合并后的页面
          link.isTab = true; // 都是Tab页
          break;
        case 2: // 定向生咨询
          link.url = isMember ? '/pages/policy-direction/index' : '/pages/policy-direction/index'; // 都指向合并后的页面
          link.isTab = true; // 都是Tab页
          break;
        case 3: // 特殊招生
          link.url = '/packageA/pages/policy-special/index';
          link.isTab = false;
          break;
        case 4: // 分数计算器
          link.url = '/packageA/pages/score-calculator/index'; // 始终指向统一的分数计算器页面
          link.isTab = false;
          break;
      }
      return link;
    });
    this.setData({ quickLinks: links });
  },

  // 加载用户设置
  loadUserSettings: function() {
    const userScore = wx.getStorageSync('userScore');
    const targetSchool = wx.getStorageSync('targetSchool');
    const targetSchoolScore = wx.getStorageSync('targetSchoolScore');
    const savedMatchedSchools = wx.getStorageSync('matchedSchools');
    
    this.setData({
      userScore: userScore || null,
      targetSchool: targetSchool || null,
      targetSchoolScore: targetSchoolScore || null,
    });

    // 如果有用户成绩，计算分数差距 (会员才计算和显示)
    if (this.data.isMember && userScore && targetSchool) {
      this.calculateScoreDifference(userScore, targetSchool);
    } else {
      this.setData({ scoreDifference: null }); // 非会员或无数据则不显示
    }
    
    // 加载匹配学校数据，交给 loadSchoolsData 处理
    // if (savedMatchedSchools && savedMatchedSchools.length > 0) {
    //   this.setData({ matchedSchools: savedMatchedSchools });
    // } else if (userScore) {
    //   this.loadSchoolsData();
    // }
    // 在 onShow 中统一调用 loadSchoolsData
  },

  // 加载学校数据 (根据会员状态调整显示逻辑)
  loadSchoolsData: function () {
    console.log('loadSchoolsData: entered function. userScore:', this.data.userScore);
    console.log('loadSchoolsData: this.data.schoolsData is:', this.data.schoolsData);
    try {
      const schoolsDataValid = this.data.schoolsData && this.data.schoolsData["昆明市高中录取信息汇总"];
      
      if (!this.data.userScore || !schoolsDataValid) {
        let reason = [];
        if (!this.data.userScore) reason.push("no userScore");
        if (!this.data.schoolsData) reason.push("schoolsData is null/undefined");
        else if (!this.data.schoolsData["昆明市高中录取信息汇总"]) reason.push("schoolsData['昆明市高中录取信息汇总'] is missing");
        
        console.warn(`loadSchoolsData: Condition not met. Reasons: ${reason.join('; ')}. Setting matchedSchools to empty.`);
        
        this.setData({ matchedSchools: [] });
        wx.removeStorageSync('matchedSchools');
        wx.removeStorageSync('allMatchedSchools');
        wx.removeStorageSync('allReachableSchools');
        wx.removeStorageSync('allUnreachableSchools');
        return;
      }

      console.log('loadSchoolsData: Data and userScore are valid, proceeding to calculate matched schools.');
      const schoolList = this.data.schoolsData["昆明市高中录取信息汇总"] || [];
      const userScore = Number(this.data.userScore);
      
      const reachableSchools = [];
      const unreachableSchools = [];
      
      schoolList.forEach(school => {
        const schoolScore = Number(school.score); 
        const schoolData = {
          schoolName: school.schoolName,
          score: school.score,
          rank: school.rank || 0,
          type: school.type || '',
          level: school.level || '',
          address: school.address || '',
          reachable: schoolScore <= userScore
        };
        if (schoolScore <= userScore) reachableSchools.push(schoolData);
        else unreachableSchools.push(schoolData);
      });

      // 按分数排序（可达到学校按分数从高到低，不可达到学校按分数从低到高）
      const sortedReachable = reachableSchools.sort((a, b) => b.score - a.score);
      const sortedUnreachable = unreachableSchools.sort((a, b) => a.score - b.score);

      // 保存完整的可匹配和不可匹配学校数据到本地缓存
      wx.setStorageSync('allReachableSchools', sortedReachable);
      wx.setStorageSync('allUnreachableSchools', sortedUnreachable);
      wx.setStorageSync('allMatchedSchools', {
        reachable: sortedReachable,
        unreachable: sortedUnreachable,
        userScore: userScore
      });

      // 为首页显示选择有限数量的学校
      let finalMatchedSchools = [];
      if (this.data.isMember) {
        finalMatchedSchools = [
          ...sortedReachable.slice(0, Math.min(reachableSchools.length, 2)),
          ...sortedUnreachable.slice(0, Math.min(unreachableSchools.length, 2))
        ];
      } else {
        const limitedReachable = sortedReachable.slice(0, Math.min(reachableSchools.length, 1));
        const limitedUnreachable = sortedUnreachable.slice(0, Math.min(unreachableSchools.length, 1));
        finalMatchedSchools = [...limitedReachable, ...limitedUnreachable];
      }

      this.setData({ matchedSchools: finalMatchedSchools });
      wx.setStorageSync('matchedSchools', finalMatchedSchools);
      
    } catch (e) {
      console.error('加载学校数据失败 (exception in loadSchoolsData):', e);
      this.setData({ matchedSchools: [] });
      wx.removeStorageSync('matchedSchools');
      wx.removeStorageSync('allMatchedSchools');
      wx.removeStorageSync('allReachableSchools');
      wx.removeStorageSync('allUnreachableSchools');
    }
  },

  // 计算分数差距 (仅会员显示)
  calculateScoreDifference: function(userScore, targetSchool) {
    if (!this.data.isMember) { // 增加会员判断
      this.setData({ scoreDifference: null });
      return;
    }
    try {
      const targetSchoolData = this.getSchoolByName(targetSchool);
      if (targetSchoolData) {
        const targetScore = Number(targetSchoolData.score);
        const currentScore = Number(userScore);
        const difference = targetScore - currentScore;
        this.setData({ scoreDifference: difference > 0 ? difference : 0 });
      } else {
        const storedScore = wx.getStorageSync('targetSchoolScore');
        if (storedScore) {
          const targetScore = Number(storedScore);
          const currentScore = Number(userScore);
          const difference = targetScore - currentScore;
          this.setData({ scoreDifference: difference > 0 ? difference : 0 });
        } else {
          console.warn('未找到目标学校数据，无法计算分数差距');
          this.setData({ scoreDifference: null }); // 找不到也设为 null
        }
      }
    } catch (e) {
      console.error('计算分数差距失败:', e);
      this.setData({ scoreDifference: null });
    }
  },

  // 修改加载时间线数据的方法，从云数据库获取
  loadTimelineData: function () {
    wx.showLoading({
      title: '加载中...',
    });
    
    // 使用timelineService从云数据库获取数据
    timelineService.getTimelineList().then(timelineData => {
    try {
        // timelineData 从云数据库获取的数组，进行处理
      const timelineArray = timelineData.map(item => {
        // 解析 YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS 格式的日期
        const eventDateStr = item.time.split(' ')[0]; // 只取日期部分进行比较
        const eventDate = new Date(eventDateStr.replace(/-/g, '/')); // 兼容 iOS
        
        const now = new Date();
        // 将当前时间设为当天的开始，以便正确比较
        now.setHours(0, 0, 0, 0);

        let countdownText = "已过期";
        let dayDiff = null;
        let isPast = true;

        if (eventDate >= now) {
          const timeDiff = eventDate.getTime() - now.getTime();
          dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          countdownText = dayDiff === 0 ? "今天" : `还有${dayDiff}天`;
          isPast = false;
        }
        
        return {
          // 使用 YYYY-MM-DD 格式显示日期
          date: eventDateStr, 
          // 使用 eventTheme 作为标题
          title: item.eventTheme || "未知事件", 
          event: item.event || "", // 详细事件描述
          countdown: countdownText,
          originalTime: item.time, // 保留原始时间用于排序
          isPast: isPast, // 标记是否已过期
          dayDiff: dayDiff, // 保存天数差异用于排序
          isActive: false // 默认不激活
        };
      }).sort((a, b) => {
        // 按原始日期和时间排序
        const dateA = new Date(a.originalTime.replace(/-/g, '/'));
        const dateB = new Date(b.originalTime.replace(/-/g, '/'));
        return dateA - dateB;
      });
      
      // 寻找距离今天最近的未来事件索引
      let activeIndex = -1;
      const today = new Date();
      today.setHours(0,0,0,0);

      for(let i = 0; i < timelineArray.length; i++) {
        const eventDate = new Date(timelineArray[i].date.replace(/-/g, '/'));
        if (eventDate >= today) {
          activeIndex = i;
          break;
        }
      }
      
      // 如果所有事件都已过期，则将最后一个事件设为 active
      if (activeIndex === -1 && timelineArray.length > 0) {
          activeIndex = timelineArray.length - 1;
      }

      // 处理完整时间线数据，设置活跃项
      const fullTimelineData = timelineArray.map((item, index) => ({
        ...item,
        isActive: index === activeIndex
      }));

      // 筛选出未过期的事件，并按日期正序排序
      const futureEvents = timelineArray
        .filter(item => !item.isPast)
        .sort((a, b) => {
          // 按距今天数排序（升序）
          return a.dayDiff - b.dayDiff;
        });
      
      // 获取最近的3个未来事件
      const upcomingEvents = futureEvents.slice(0, 3).map((item, index) => ({
        ...item,
        isActive: index === 0 // 将最近的事件标记为active
      }));

      this.setData({
        timeline: timelineArray,
        upcomingTimeline: upcomingEvents,
        fullTimelineData: fullTimelineData
      });
    } catch (e) {
        console.error('处理时间线数据失败', e);
        this.setData({
          timeline: [],
          upcomingTimeline: [],
          fullTimelineData: []
        });
      }
      wx.hideLoading();
    }).catch(err => {
      console.error('从云数据库获取时间线数据失败', err);
      this.setData({
        timeline: [],
        upcomingTimeline: [],
        fullTimelineData: []
      });
      wx.hideLoading();
    });
  },

  // 计算距离中考还有多少天
  calculateRemainingDays: function () {
    const now = new Date();
    const examDate = new Date('2025-06-16');
    const timeDiff = examDate.getTime() - now.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    this.setData({
      remainingDays: dayDiff > 0 ? dayDiff : 0
    });
  },

  // 设置目标（包括成绩和学校）
  setTarget: function() {
    // 直接调用clearTargetData函数清零数据
    this.clearTargetData();
  },

  // 清除目标数据
  clearTargetData: function() {
    // 清除内存中的数据
    this.setData({ 
      userScore: null,
      targetSchool: null,
      targetSchoolScore: null,
      scoreDifference: null,
      matchedSchools: []
    });
    
    // 清除本地存储
    wx.removeStorageSync('userScore');
    wx.removeStorageSync('targetSchool');
    wx.removeStorageSync('targetSchoolScore');
    wx.removeStorageSync('matchedSchools');
    
    wx.showToast({
      title: '数据已清除',
      icon: 'success'
    });
  },

  // 跳转到快捷入口对应页面
  gotoQuickLink: function (e) {
    const link = e.currentTarget.dataset.link;
    const url = link.url;
    
    if (link.isTab) {
      // 如果是底部导航栏页面，使用switchTab
      wx.switchTab({
        url: url,
      });
    } else {
      // 否则使用普通页面跳转
      wx.navigateTo({
        url: url,
      });
    }
  },
  
  // 显示更多时间线
  showMoreTimeline: function() {
    wx.showToast({
      title: '完整时间线功能开发中',
      icon: 'none'
    });
  },
  
  // 跳转到个人资料页
  goToProfile: function() {
    wx.navigateTo({
      url: '/pages/profile/index',
    });
  },
  
  // 跳转到通知页面
  goToNotifications: function() {
    wx.showToast({
      title: '通知功能开发中',
      icon: 'none'
    });
  },
  
  // 设置目标院校
  setTargetSchool: function () {
    this.setData({
      showSchoolSearch: true,
      searchKeyword: '',
      schoolSearchList: []
    });
    
    console.log("打开搜索框，可进行学校搜索");
  },

  // 实时搜索输入处理
  onSchoolSearchInput: function(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    
    if (keyword) {
      // 直接从high-schools.js搜索匹配结果
      const matchedSchools = this.searchKmSchools(keyword);
      this.setData({ schoolSearchList: matchedSchools });
      console.log('搜索关键词:', keyword, '匹配结果数量:', matchedSchools.length);
    } else {
      this.setData({ schoolSearchList: [] });
    }
  },
  
  // 清空学校搜索输入框
  clearSchoolSearch: function() {
    this.setData({ 
      searchKeyword: '',
      schoolSearchList: []
    });
  },
  
  // 从搜索结果中选择学校
  selectSchoolFromSearch: function(e) {
    const index = e.currentTarget.dataset.index;
    const school = this.data.schoolSearchList[index];
    
    if(school) {
      this.selectKmSchool(school);
      this.closeSchoolSearch();
    }
  },
  
  // 关闭学校搜索模态框
  closeSchoolSearch: function() {
    this.setData({
      showSchoolSearch: false,
      searchKeyword: '',
      schoolSearchList: []
    });
  },
  
  // 防止模态框内的滚动穿透
  preventTouchMove: function() {
    return false;
  },
  
  // 获取所有学校数据
  getSchoolsList: function() {
    return this.data.schoolsData["昆明市高中录取信息汇总"] || [];
  },
  
  // 根据学校名称获取学校数据
  getSchoolByName: function(schoolName) {
    const schools = this.getSchoolsList();
    return schools.find(school => school.schoolName === schoolName);
  },
  
  // 在昆明市高中数据中搜索学校
  searchKmSchools: function(keyword) {
    const schools = this.getSchoolsList();
    
    if (!keyword || schools.length === 0) {
      return [];
    }
    
    // 去除关键词中可能的空格
    const cleanKeyword = keyword.trim();
    console.log('开始搜索关键词:', cleanKeyword, '学校数量:', schools.length);
    
    // 使用正则表达式进行不区分大小写的搜索
    const pattern = new RegExp(cleanKeyword, 'i');
    
    // 搜索包含关键词的学校
    let results = schools.filter(school => {
      const schoolName = school.schoolName || '';
      const matched = pattern.test(schoolName);
      if (matched) console.log('匹配学校:', schoolName);
      return matched;
    });
    
    console.log('正则匹配结果数量:', results.length);
    
    // 如果正则表达式匹配失败，尝试直接字符串包含匹配
    if (results.length === 0) {
      results = schools.filter(school => {
        const schoolName = school.schoolName || '';
        const matched = schoolName.includes(cleanKeyword);
        if (matched) console.log('字符串包含匹配学校:', schoolName);
        return matched;
      });
      console.log('字符串包含匹配结果数量:', results.length);
    }
    
    // 如果结果过多（超过20个），可以尝试更精确的匹配
    if (results.length > 20) {
      const exactResults = schools.filter(school => {
        const schoolName = school.schoolName || '';
        // 使用更严格的匹配条件，如学校名称以关键词开头
        return schoolName.indexOf(cleanKeyword) === 0;
      });
      
      if (exactResults.length > 0) {
        console.log('使用更精确匹配，结果数量:', exactResults.length);
        results = exactResults;
      }
    }
    
    // 如果结果为空，尝试降低匹配要求
    if (results.length === 0 && cleanKeyword.length > 1) {
      // 拆分关键词进行部分匹配
      const keywords = cleanKeyword.split('');
      
      for (let i = 0; i < keywords.length; i++) {
        const char = keywords[i];
        if (char.trim()) {
          const partialResults = schools.filter(school => {
            const schoolName = school.schoolName || '';
            return schoolName.includes(char);
          });
          
          if (partialResults.length > 0) {
            console.log('使用单字符"' + char + '"匹配，结果数量:', partialResults.length);
            return partialResults;
          }
        }
      }
      
      // 如果单字符匹配也没有结果，尝试匹配前缀
      if (cleanKeyword.length >= 2) {
        const prefix = cleanKeyword.substring(0, 2); // 取前两个字符
        const prefixResults = schools.filter(school => {
          const schoolName = school.schoolName || '';
          return schoolName.includes(prefix);
        });
        
        if (prefixResults.length > 0) {
          console.log('使用前缀"' + prefix + '"匹配，结果数量:', prefixResults.length);
          return prefixResults;
        }
      }
    }
    
    // 对搜索结果进行排序，将完全匹配放在前面
    if (results.length > 0) {
      results.sort((a, b) => {
        const nameA = a.schoolName || '';
        const nameB = b.schoolName || '';
        
        // 如果一个名称包含关键词作为开头，优先显示
        const aStartsWithKeyword = nameA.indexOf(cleanKeyword) === 0;
        const bStartsWithKeyword = nameB.indexOf(cleanKeyword) === 0;
        
        if (aStartsWithKeyword && !bStartsWithKeyword) return -1;
        if (!aStartsWithKeyword && bStartsWithKeyword) return 1;
        
        // 否则按学校名称字母顺序排序
        return nameA.localeCompare(nameB);
      });
    }

    // 如果最终结果为空，返回全部学校（最多10所）避免空结果
    if (results.length === 0) {
      console.log('无匹配结果，返回全部学校（最多10所）');
      return schools.slice(0, 10);
    }
    
    return results;
  },
  
  // 专门加载昆明市高中数据，确保只从这一数据源加载
  loadKmSchoolsOnly: function() {
    return this.getSchoolsList();
  },
  
  // 选择昆明市高中
  selectKmSchool: function(school) {
    // 从昆明市高中数据中获取信息
    const schoolName = school.schoolName || '';
    const schoolScore = school.score || 0;
    
    if (!schoolName) {
      console.error('选择的学校数据无效');
      return;
    }
    
    // 更新目标学校和分数信息
    this.setData({
      targetSchool: schoolName,
      targetSchoolScore: schoolScore
    });
    
    // 保存到本地存储
    wx.setStorageSync('targetSchool', schoolName);
    wx.setStorageSync('targetSchoolScore', schoolScore);
    
    // 计算分数差距
    if (this.data.userScore) {
      this.calculateScoreDifference(this.data.userScore, schoolName);
    }
    
    // 重新加载匹配学校
    this.loadSchoolsData();
    
    wx.showToast({
      title: '目标院校已设置',
      icon: 'success'
    });
    
    console.log('已选择学校:', schoolName, '分数线:', schoolScore);
    
    // 关闭学校搜索窗口
    this.closeSchoolSearch();
  },

  // 点击"输入成绩"按钮
  setUserScoreButton: function() {
    this.setData({ 
      showScoreInput: true,
      scoreInput: this.data.userScore || '' // 如果已有成绩则显示
    });
  },

  // 点击"输入目标学校"按钮
  setTargetSchoolButton: function() {
    this.setData({ showSchoolSearch: true });
  },
  
  // 成绩输入模态框相关处理
  onScoreInput: function(e) {
    this.setData({ scoreInput: e.detail.value });
  },

  // 清空成绩输入
  clearScoreInput: function() {
    this.setData({ scoreInput: '' });
  },

  // 关闭成绩输入模态框
  closeScoreInput: function() {
    this.setData({ 
      showScoreInput: false,
      scoreInput: ''
    });
  },

  // 确认成绩输入
  confirmScoreInput: function() {
    const score = this.data.scoreInput;
    
    // 验证输入是否为有效数字
    if (score && /^\d+(\.\d+)?$/.test(score)) {
      this.setData({ 
        userScore: score,
        showScoreInput: false 
      });
      
      wx.setStorageSync('userScore', score);
      
      // 如果已设置目标学校，重新计算分数差距
      if (this.data.targetSchool) {
        this.calculateScoreDifference(score, this.data.targetSchool);
      }
      
      // 重新加载学校数据并存储到本地
      this.loadSchoolsData();
      
      wx.showToast({
        title: '成绩已设置',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '请输入有效的分数',
        icon: 'none'
      });
    }
  },

  copyCode(e) {
    const code = e.target?.dataset?.code || '';
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '已复制',
        })
      },
      fail: (err) => {
        console.error('复制失败-----', err);
      }
    })
  },

  discoverCloud() {
    wx.switchTab({
      url: '/pages/examples/index',
    })
  },

  gotoGoodsListPage() {
    wx.navigateTo({
      url: '/pages/goods-list/index',
    })
  },

  // 页面初始化时预加载学校数据
  onReady: function() {
    // 页面准备就绪，可以进行操作
  },

  // 跳转到可匹配院校详情页
  gotoMatchedSchools: function() {
    if (!this.data.userScore) {
      wx.showToast({
        title: '请先输入成绩',
        icon: 'none'
      });
      return;
    }
    
    // 检查是否有完整的匹配学校数据
    const allMatchedSchools = wx.getStorageSync('allMatchedSchools');
    if (!allMatchedSchools || !allMatchedSchools.reachable) {
      // 如果没有缓存的完整匹配数据，先确保加载了学校数据
      if (!this.data.schoolsData) {
        wx.showLoading({ title: '加载学校数据' });
        this.loadHighSchoolData();
      }
      
      // 重新计算匹配学校
      this.loadSchoolsData();
    }
    
    // 跳转到匹配学校详情页
    wx.navigateTo({
      url: '/packageB/pages/matched-schools/index',
    });
  },

  // 显示完整时间线模态框
  showFullTimelineModal: function() {
    if (!this.data.isMember) { // 非会员限制
      this.showVipModal();
      return;
    }
    
    // 修改为跳转到时间线详情页
    wx.navigateTo({
      url: '/pages/timeline-detail/index'
    });
  },
  
  // 关闭完整时间线模态框
  closeFullTimelineModal: function() {
    this.setData({
      showTimelineModal: false
    });
  },
  
  // 自动滚动到活跃的时间线项
  scrollToActiveTimelineItem: function() {
    const query = wx.createSelectorQuery();
    query.selectAll('.timeline-modal-item.active').boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec((res) => {
      if (res[0] && res[0].length > 0) {
        const activeItem = res[0][0];
        const scrollTop = activeItem.top - res[1].scrollTop - 100; // 减去一些距离以确保活跃项在视口中间
        
        wx.createSelectorQuery()
          .select('.full-timeline-results')
          .node()
          .exec((nodeRes) => {
            if (nodeRes[0] && nodeRes[0].node) {
              nodeRes[0].node.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
              });
            }
          });
      }
    });
  },
  
  // 显示会员提示模态框 (用于非会员点击限制功能)
  showVipModal: function() {
    this.setData({ showVipModal: true });
  },

  // 关闭会员提示模态框
  closeVipModal: function() {
    this.setData({ showVipModal: false });
  },
  
  // 跳转到会员购买页
  goToVip: function() {
    this.closeVipModal(); // 先关闭模态框
    wx.navigateTo({ url: '/packageB/pages/membership/index' });
  },
});
