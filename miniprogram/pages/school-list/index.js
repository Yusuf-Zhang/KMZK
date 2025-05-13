// 引入本地数据而不是数据库服务
const highSchoolsData = require('../../data/high-schools');

Page({
  data: {
    // 会员状态
    isMember: false,
    // 原始数据
    originalSchools: [],
    // 展示数据（经过筛选后的数据）
    schools: [],
    // 搜索关键词
    searchKeyword: '',
    // 筛选条件
    filters: {
      type: ['全部', '公办', '民办'],
      level: ['全部', '一级一等', '一级二等', '一级三等', '二级完中', '无等级']
    },
    // 当前选中的筛选条件
    selectedFilters: {
      type: '全部',
      level: '全部'
    },
    // 临时筛选条件（用于存储还未确认的选择）
    tempFilters: {
      type: '全部',
      level: '全部'
    },
    // 筛选面板是否显示
    showFilterPanel: false,
    // 学校详情相关
    selectedSchool: null,
    showSchoolDetail: false,
    // 会员提示模态框 (非会员使用)
    showVipTip: false,
    // 导航栏高度
    navHeight: 90,
    // 是否显示温馨提醒卡片
    showReminderCard: true
  },

  onLoad: function (options) {
    this.loadSchoolsData();
    
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
  },

  onShow: function() {
    const app = getApp();
    const isMember = app.globalData.membershipStatus.isMember;
    this.setData({ isMember });

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 }); // 高中信息是第二个tab，索引为1
    }
    
    // 根据最新的会员状态重新筛选或加载数据（如果需要不同的展示）
    // this.filterSchools(); // 如果筛选逻辑依赖 isMember
  },

  // --- 添加非会员所需的方法 ---
  showVipModal: function() {
    this.setData({ showVipTip: true });
  },

  closeVipModal: function() {
    this.setData({ showVipTip: false });
  },

  goToVip: function() {
    this.closeVipModal();
    wx.navigateTo({ url: '/packageB/pages/membership/index' });
  },
  // --- 非会员方法结束 ---

  // 加载学校数据 - 使用本地数据
  loadSchoolsData: function () {
    wx.showLoading({ title: '加载中' });
    
    try {
      console.log('加载学校数据 - 直接使用本地high-schools.js');
      console.log('highSchoolsData类型:', typeof highSchoolsData);

      if (typeof highSchoolsData === 'object') {
        console.log('highSchoolsData键:', Object.keys(highSchoolsData));
      }
      
      // 从本地导入的数据获取高中学校数据
      let schoolList = [];
      
      // 检查数据格式
      if (highSchoolsData && highSchoolsData["昆明市高中录取信息汇总"] && 
          Array.isArray(highSchoolsData["昆明市高中录取信息汇总"])) {
        schoolList = highSchoolsData["昆明市高中录取信息汇总"];
        console.log('成功加载本地数据：对象数组，包含', schoolList.length, '所学校');
      } else {
        // 数据格式不符合预期，使用默认数据
        console.warn('本地数据格式不符合预期，使用默认值。highSchoolsData:', highSchoolsData);
        schoolList = [{
          rank: 1,
          schoolName: "暂无学校数据",
          type: "无",
          level: "无",
          score: 0,
          position: 0,
          address: "请稍后重试或联系管理员"
        }];
      }
        
      this.setData({
        originalSchools: schoolList,
        schools: schoolList // 初始显示所有学校
      }, () => {
        console.log('setData完成，schools数据条数:', this.data.schools.length);
      });
      
      console.log('学校数据加载成功，共加载', schoolList.length, '所学校');
      wx.hideLoading();
    } catch (error) {
      console.error('处理高中学校数据出错:', error);
      // 发生错误时显示默认数据
      const defaultList = [{
        rank: 1,
        schoolName: "加载失败",
        type: "无",
        level: "无",
        score: 0,
        position: 0,
        address: "请稍后重试或联系管理员"
      }];
      
      this.setData({
        originalSchools: defaultList,
        schools: defaultList
      });
      wx.hideLoading();
      wx.showToast({ title: '处理数据失败', icon: 'none' });
    }
  },

  // 处理搜索
  handleSearchInput: function (e) {
    if (!this.data.isMember) {
      this.showVipModal();
      return;
    }
    const keyword = e.detail.value;
    // 当有搜索关键词时，隐藏提醒卡片
    const showReminderCard = keyword === '';
    this.setData({ 
      searchKeyword: keyword,
      showReminderCard: showReminderCard && this.isDefaultFilters()
    });
    this.filterSchools();
  },

  // 清除搜索
  clearSearch: function () {
    if (!this.data.isMember) {
      this.showVipModal();
      return;
    }
    // 清除搜索后，如果筛选条件也是默认的，则显示提醒卡片
    this.setData({ 
      searchKeyword: '',
      showReminderCard: this.isDefaultFilters()
    });
    this.filterSchools();
  },

  // 切换筛选面板
  toggleFilterPanel: function () {
    if (!this.data.isMember) {
      this.showVipModal();
      return;
    }
    if (!this.data.showFilterPanel) {
      this.setData({ tempFilters: {...this.data.selectedFilters} });
    }
    this.setData({ showFilterPanel: !this.data.showFilterPanel });
  },

  // 选择筛选条件
  selectFilter: function (e) {
    const { type, value } = e.currentTarget.dataset;
    const tempFilters = { ...this.data.tempFilters };
    tempFilters[type] = value;
    this.setData({ tempFilters });
  },

  // 确认筛选条件
  confirmFilters: function () {
    const newFilters = {...this.data.tempFilters};
    this.setData({
      selectedFilters: newFilters,
      showFilterPanel: false,
      // 如果筛选条件是默认的且没有搜索词，则显示提醒卡片
      showReminderCard: this.isDefaultFilters(newFilters) && !this.data.searchKeyword
    });
    this.filterSchools();
  },

  // 重置筛选条件
  resetFilters: function () {
    const defaultFilters = { type: '全部', level: '全部' };
    this.setData({
      tempFilters: defaultFilters
    });
  },

  // 检查是否为默认筛选条件
  isDefaultFilters: function(filters) {
    const filtersToCheck = filters || this.data.selectedFilters;
    return filtersToCheck.type === '全部' && filtersToCheck.level === '全部';
  },

  // 筛选学校数据 (会员/非会员显示逻辑不同，但筛选本身可能一致)
  filterSchools: function () {
    const { originalSchools, searchKeyword, selectedFilters } = this.data;
    let filteredSchools = [...originalSchools];

    if (searchKeyword) {
      filteredSchools = filteredSchools.filter(school => 
        school.schoolName.includes(searchKeyword)
      );
    }
    if (selectedFilters.type !== '全部') {
      filteredSchools = filteredSchools.filter(school => 
        school.type === selectedFilters.type
      );
    }
    if (selectedFilters.level !== '全部') {
      filteredSchools = filteredSchools.filter(school => 
        school.level === selectedFilters.level
      );
    }
    
    // 注意：非会员的列表截断或模糊效果在 WXML 中处理
    this.setData({ schools: filteredSchools });
    console.log('筛选结果：', filteredSchools.length, '所学校');
    
    // 检查是否为原始状态（无搜索词且筛选条件为默认）
    const isOriginalState = !searchKeyword && this.isDefaultFilters();
    if (this.data.showReminderCard !== isOriginalState) {
      this.setData({ showReminderCard: isOriginalState });
    }
  },

  // 跳转到学校详情页
  gotoSchoolDetail: function (e) {
    const { schoolid } = e.currentTarget.dataset;
    // 需要找到学校在当前列表中的索引，以判断是否为第一项
    const schoolIndex = this.data.schools.findIndex(s => s.rank === schoolid);
    const school = schoolIndex !== -1 ? this.data.schools[schoolIndex] : null;
    
    if (!school) {
      wx.showToast({ title: '学校信息不存在', icon: 'none' });
      return;
    }
    
    // 非会员点击非第一项时提示
    if (schoolIndex > 0 && !this.data.isMember) {
      this.showVipModal();
      return;
    }
    
    // 使用自定义模态框显示学校详情
    this.setData({
      selectedSchool: school,
      showSchoolDetail: true
    });
  },
  
  // 关闭学校详情模态框
  closeSchoolDetail: function() {
    this.setData({ showSchoolDetail: false });
  }
}); 