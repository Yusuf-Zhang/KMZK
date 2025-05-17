// policy-direction/index.js

// 直接导入指定的本地数据文件
// 不再导入数据库服务，也不再使用direction-schools.js
const directionSchoolList = require('./data/direction school-list.js');
const admissionScoreData = require('./data/admission-score.js');
// 导入政策解读数据
// const policyModule = require('./policy.js');

// 获取应用实例
const app = getApp();

Page({
  data: {
    // 审核控制变量
    ischeck: true,
    // 会员状态
    isMember: false,
    // 轮播相关
    currentSwiperIndex: 0,
    
    // 单位查询相关数据
    unitSearchText: '', // 学校查询关键词
    unitResults: [], // 查询结果
    unitSearched: false, // 用户是否已点击查询按钮
    
    // 分数查询相关数据
    scoreSearchText: '', // 分数查询关键词
    scoreResults: [], // 分数查询结果
    selectedUnit: '', // 用户选定的单元
    
    // 模态框展示控制
    showUnitsModal: false, // 是否显示所有单元模态框
    showSchoolsModal: false, // 是否显示学校目录模态框
    showPolicyModal: false, // 是否显示政策详情模态框
    showUnitDetailModal: false,
    showUnitSearchTip: false,
    showScoreSearchTip: false,
    showSchoolsDropdown: false,
    showVipTipModal: false, // 会员提示模态框 (非会员使用)
    
    // 数据列表
    allUnits: [], // 所有定向单元列表
    allSchools: [], // 所有有定向计划的学校目录
    filteredSchools: [],
    currentUnit: '',
    currentUnitSchools: [],
    
    // 政策详情
    policyDetail: `2024年北京市高中定向招生政策详情：

1. 招生方式：以各区教委划定的"单元划片"方式进行，每个定向单元内包含多所高中学校。

2. 报考原则：学生只能报考户籍所在区的定向生批次，无法跨区报考。

3. 录取规则：按照考生中考成绩从高到低顺序录取，各定向单元设置单独分数线。

4. 志愿填报：考生在本定向单元内填报志愿，最多可填报该单元内全部学校。

5. 录取限制：考生只能获得所在定向单元中一所高中的录取资格。

6. 批次安排：定向生批次在提前批次之后、市级统筹批次之前进行录取。

7. 分配比例：2024年各区定向招生计划比例不低于50%，部分区域可能更高。

8. 跨区转学：一般情况下不接受跨区转学申请，特殊情况需向教委提出申请。

9. 学籍限制：录取为定向生的学生，学籍将锁定在录取学校至少一年。`,
    unitOptions: [
      '第一单元', '第二单元', '第三单元', '第四单元', '第五单元', '第六单元', '第七单元', '第八单元', '第九单元', '第十单元',
      '第十一单元', '第十二单元', '第十三单元', '第十四单元', '第十五单元', '第十六单元', '第十七单元', '第十八单元', '第十九单元', '第二十单元',
      '第二十一单元', '第二十二单元', '第二十三单元', '第二十四单元', '第二十五单元', '第二十六单元', '第二十七单元', '第二十八单元', '第二十九单元', '第三十单元', '第三十一单元'
    ],
    unitOptionsWithReset: ['重置',
      '第一单元', '第二单元', '第三单元', '第四单元', '第五单元', '第六单元', '第七单元', '第八单元', '第九单元', '第十单元',
      '第十一单元', '第十二单元', '第十三单元', '第十四单元', '第十五单元', '第十六单元', '第十七单元', '第十八单元', '第十九单元', '第二十单元',
      '第二十一单元', '第二十二单元', '第二十三单元', '第二十四单元', '第二十五单元', '第二十六单元', '第二十七单元', '第二十八单元', '第二十九单元', '第三十单元', '第三十一单元'
    ],
    selectedScoreUnit: '',
    allScoreSchools: [],
    showScoreSchoolsDropdown: false,
    filteredScoreSchools: [],
    queriedScoreUnit: '',
    // 政策解读数据
    // policyData: {},
    // 保存展开的政策部分ID
    // openSections: {},
    // 导航栏高度
    navHeight: 90
  },

  onLoad: function (options) {
    // 设置审核状态
    this.setData({
      ischeck: app.globalData.ischeck
    });
    
    // 获取导航栏高度
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
    
    // 加载所有定向单元数据
    this.loadAllUnits();
    // 加载所有学校数据
    this.loadAllSchools();
    // 加载政策详情
    // this.loadPolicyDetail();
    // 从数据中提取所有学校名称作为模糊匹配数据源
    this.initAllSchoolNames();
    this.loadAllScoreSchools();
    this.initAllScoreSchoolNames();
    // 加载政策解读数据
    // this.loadPolicyData();
  },

  onShow: function() {
    // 获取会员状态，但在审核期间（ischeck为true时），强制显示为会员版本
    const isMember = this.data.ischeck ? true : app.globalData.membershipStatus.isMember;
    this.setData({ isMember });

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 }); // 定向政策是第三个tab，索引为2
    }
  },
  
  // --- 添加非会员所需的方法 ---
  showVipModal: function() {
    // 在审核状态下不显示VIP提示
    if (this.data.ischeck) return;
    this.setData({ showVipTipModal: true });
  },

  // hideModal 已存在，用于关闭所有模态框

  goToVip: function() {
    // 在审核状态下不进行任何操作
    if (this.data.ischeck) return;
    this.hideModal();
    wx.navigateTo({ url: '/packageB/pages/membership/index' });
  },
  // --- 非会员方法结束 ---
  
  // 加载所有定向单元数据 - 使用本地数据
  loadAllUnits: function() {
    wx.showLoading({ title: '加载中' });
    
    try {
      // 从本地数据获取方向学校列表数据
      if (!directionSchoolList || !directionSchoolList.units) {
        console.error('方向学校列表数据格式不正确:', directionSchoolList);
        wx.hideLoading();
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
        return;
      }
        
      // 转换单元数据结构
      const units = directionSchoolList.units.map(item => ({
        name: item.unit,
        schools: item.schools
      }));
    
      this.setData({
        allUnits: units || []
      });
        
      // 初始化学校名称列表（用于模糊匹配）
      this.initAllSchoolNames();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('处理方向学校列表数据失败:', err);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },
  
  // 加载所有学校数据 - 使用本地数据
  loadAllSchools: function() {
    wx.showLoading({ title: '加载中' });
    
    try {
      // 从本地数据获取录取分数数据
      if (!admissionScoreData || !admissionScoreData.schools) {
        console.error('录取分数数据格式不正确:', admissionScoreData);
        wx.hideLoading();
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
        return;
      }
        
      // 从分数数据中提取所有学校信息
      const schools = admissionScoreData.schools || [];
      const allSchools = schools.map(school => ({
        name: school.学校名称,
        level: school.学校等级
      }));
    
      this.setData({
        allSchools: allSchools
      });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('处理录取分数数据失败:', err);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },
  
  // 加载所有计分学校数据 - 使用本地数据
  loadAllScoreSchools: function() {
    try {
      // 从本地数据获取录取分数数据
      if (!admissionScoreData || !admissionScoreData.schools) {
        console.error('录取分数数据格式不正确:', admissionScoreData);
        return;
      }
      
      // 从分数数据中提取所有学校信息
      const schools = admissionScoreData.schools || [];
      const allScoreSchools = schools.map(school => ({
        name: school.学校名称,
        level: school.学校等级,
        scores: school.定向择优录取分数
      }));
      
      this.setData({
        allScoreSchools: allScoreSchools
      });
    } catch (err) {
      console.error('处理录取分数数据失败:', err);
    }
  },
  
  // 初始化所有学校名称列表（用于模糊匹配）
  initAllSchoolNames: function() {
    // 从allUnits中提取所有学校名称
    let allSchools = [];
    this.data.allUnits.forEach(unit => {
      if (unit.schools) {
        unit.schools.forEach(school => {
          if (!allSchools.includes(school)) {
            allSchools.push(school);
          }
        });
      }
    });
    
    // 修复排序函数，确保处理的是字符串类型
    this.allSchoolNames = allSchools.sort((a, b) => {
      // 确保a和b是字符串
      const strA = String(a);
      const strB = String(b);
      return strA.localeCompare(strB, 'zh');
    });
  },
  
  // 初始化所有分数学校名称列表
  initAllScoreSchoolNames: function() {
    const allScoreSchoolNames = this.data.allScoreSchools.map(school => school.name);
    // 修复排序函数，确保处理的是字符串类型
    this.allScoreSchoolNames = allScoreSchoolNames.sort((a, b) => {
      // 确保a和b是字符串
      const strA = String(a);
      const strB = String(b);
      return strA.localeCompare(strB, 'zh');
    });
  },
  
  // 单位查询输入处理
  inputUnitSearch: function(e) {
    const searchText = e.detail.value;
    this.setData({
      unitSearchText: searchText,
      showSchoolsDropdown: searchText.length > 0
    });
    
    if (searchText.length > 0) {
      // 根据输入匹配学校名称列表
      this.fuzzySearchSchools(searchText);
    } else {
      // 清空搜索结果和重置搜索状态
      this.setData({
        filteredSchools: [],
        unitResults: [],
        unitSearched: false,
        showSchoolsDropdown: false
      });
    }
  },
  
  // 模糊搜索学校名称
  fuzzySearchSchools: function(keyword) {
    if (!keyword) return;
    
    // 在审核状态或会员状态下，允许模糊搜索学校
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    const maxResults = 10; // 限制结果数量，避免过长
    const allSchools = this.allSchoolNames || [];
    
    // 进行模糊匹配
    const filtered = allSchools.filter(name => 
      name.includes(keyword)
    ).slice(0, maxResults);
    
    this.setData({
      filteredSchools: filtered
    });
  },
  
  // 从下拉框选择学校
  selectSchool: function(e) {
    const schoolName = e.currentTarget.dataset.school;
    
    this.setData({
      unitSearchText: schoolName,
      showSchoolsDropdown: false
    });
  },
  
  // 清空搜索
  clearUnitSearch: function() {
    this.setData({
      unitSearchText: '',
      unitResults: [],
      showSchoolsDropdown: false,
      unitSearched: false
    });
  },
  
  // 用户点击搜索按钮，查询单位
  searchUnit: function() {
    // 在审核状态或会员状态下，允许查询单位
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    const searchText = this.data.unitSearchText;
    if (!searchText) {
      wx.showToast({
        title: '请输入学校名称',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '查询中' });
    
    // 在单元数据中查找包含该学校的单元
    const allUnits = this.data.allUnits || [];
    const results = allUnits.filter(unit => {
      const schools = unit.schools || [];
      return schools.some(school => school === searchText);
    });
    
    this.setData({
      unitResults: results,
      showSchoolsDropdown: false,
      unitSearched: true
    });
    
    wx.hideLoading();
    
    if (results.length === 0) {
      wx.showToast({
        title: '未找到相关单元',
        icon: 'none'
      });
    } else {
      // 延迟滚动到结果区域，确保结果先渲染
      setTimeout(() => {
        this.scrollToResult('.search-result');
      }, 300);
    }
  },
  
  // 显示帮助提示
  showUnitSearchHelp: function() {
    this.setData({
      showUnitSearchTip: true
    });
  },
  
  // 隐藏帮助提示
  hideUnitSearchTip: function() {
    this.setData({
      showUnitSearchTip: false
    });
  },
  
  // 分数线查询输入处理
  inputScoreSearch: function(e) {
    const searchText = e.detail.value;
    this.setData({
      scoreSearchText: searchText,
      showScoreSchoolsDropdown: searchText.length > 0
    });
    
    if (searchText.length > 0) {
      // 根据输入匹配学校名称列表
      this.fuzzySearchScoreSchools(searchText);
    } else {
      // 清空搜索结果
      this.setData({
        filteredScoreSchools: [],
        scoreResults: [],
        showScoreSchoolsDropdown: false
      });
    }
  },
  
  // 模糊搜索分数查询学校名称
  fuzzySearchScoreSchools: function(keyword) {
    if (!keyword) return;
    
    // 在审核状态或会员状态下，允许模糊搜索学校
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    const maxResults = 10; // 限制结果数量，避免过长
    const allSchools = this.allScoreSchoolNames || [];
    
    // 进行模糊匹配
    const filtered = allSchools.filter(name => 
      name.includes(keyword)
    ).slice(0, maxResults);
    
    this.setData({
      filteredScoreSchools: filtered
    });
  },
  
  // 从下拉框选择学校
  selectScoreSchool: function(e) {
    // 在审核状态或会员状态下，允许选择学校
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    const schoolName = e.currentTarget.dataset.school;
    
    this.setData({
      scoreSearchText: schoolName,
      showScoreSchoolsDropdown: false
    });
  },
  
  // 清空分数搜索
  clearScoreSearch: function() {
    this.setData({
      scoreSearchText: '',
      scoreResults: [],
      showScoreSchoolsDropdown: false
    });
  },
  
  // 用户点击搜索按钮，查询分数
  searchScore: function() {
    // 在审核状态或会员状态下，允许查询分数
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    const searchText = this.data.scoreSearchText;
    const unit = this.data.selectedScoreUnit;
    
    if (!searchText) {
      wx.showToast({
        title: '请输入学校名称',
        icon: 'none'
      });
      return;
    }
    
    if (!unit) {
      wx.showToast({
        title: '请选择单元',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '查询中' });
    
    // 在分数数据中查找学校数据
    try {
      // 从本地数据获取录取分数数据
      if (!admissionScoreData || !admissionScoreData.schools) {
        wx.hideLoading();
        wx.showToast({
          title: '分数数据加载失败',
          icon: 'none'
        });
        return;
      }
      
      // 从分数数据中查找匹配的学校
      const schools = admissionScoreData.schools || [];
      const results = schools.filter(school => 
        school.学校名称.includes(searchText)
      ).map(school => {
        // 寻找所选单元的分数线数据
        const scoreData = school.定向择优录取分数 && school.定向择优录取分数[unit];
        
        // 处理不同类型的分数数据
        let scoreDisplay;
        if (scoreData === "未达线") {
          scoreDisplay = "未达线";
        } else if (scoreData === "/" || scoreData === undefined || scoreData === null) {
          scoreDisplay = null; // 显示为"暂无分数"
        } else {
          scoreDisplay = scoreData; // 数字或其他分数值
        }
        
        return {
          name: school.学校名称,
          level: school.学校等级 || '--',
          score: scoreDisplay,
          rawScore: scoreData // 保存原始数据用于排序
        };
      });
      
      // 对结果进行排序：有分数的在前，分数高的在前，未达线的次之，无分数的最后
      results.sort((a, b) => {
        // 把无分数的放到最后
        if (a.score === null && b.score !== null) return 1;
        if (a.score !== null && b.score === null) return -1;
        
        // 把"未达线"放在有分数的后面
        if (a.score === "未达线" && typeof b.score === "number") return 1;
        if (typeof a.score === "number" && b.score === "未达线") return -1;
        
        // 分数按从高到低排序
        if (typeof a.score === "number" && typeof b.score === "number") {
          return b.score - a.score;
        }
        
        // 其他情况保持原顺序
        return 0;
      });
      
      this.setData({
        scoreResults: results,
        showScoreSchoolsDropdown: false,
        queriedScoreUnit: unit
      });
      
      wx.hideLoading();
      
      if (results.length === 0) {
        wx.showToast({
          title: '未找到相关学校',
          icon: 'none'
        });
      } else {
        // 延迟滚动到结果区域，确保结果先渲染
        setTimeout(() => {
          this.scrollToResult('.score-results');
        }, 300);
      }
    } catch (err) {
      console.error('查询分数线失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '查询失败，请重试',
        icon: 'none'
      });
    }
  },
  
  // 显示所有单元
  showAllUnits: function() {
    // 在审核状态或会员状态下，允许查看所有单元
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    this.setData({
      showUnitsModal: true
    });
  },
  
  // 显示单位详情
  showUnitDetail: function(e) {
    if (!this.data.isMember) { this.showVipModal(); return; }
    const unit = e.currentTarget.dataset.unit;
    const schools = e.currentTarget.dataset.schools;
    
    this.setData({
      currentUnit: unit,
      currentUnitSchools: schools,
      showUnitsModal: false,
      showUnitDetailModal: true
    });
  },
  
  // 显示学校目录
  showSchoolDirectory: function() {
    // 在审核状态或会员状态下，允许查看学校目录
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    this.setData({
      showSchoolsModal: true
    });
  },
  
  // 显示政策详情
  showPolicyDetail: function() {
    // 在审核状态或会员状态下，允许查看政策详情
    if (!this.data.isMember && !this.data.ischeck) { 
      this.showVipModal(); 
      return; 
    }
    
    this.setData({
      showPolicyModal: true
    });
  },
  
  // 隐藏所有模态框
  hideModal: function() {
    this.setData({
      showUnitsModal: false,
      showSchoolsModal: false,
      showPolicyModal: false,
      showUnitDetailModal: false,
      showVipTipModal: false,
      showSchoolsDropdown: false,
      showScoreSchoolsDropdown: false
    });
  },
  
  // 选择一个定向单元
  selectUnit: function(e) {
    if (!this.data.isMember) { this.showVipModal(); return; }
    const unit = e.currentTarget.dataset.unit;
    this.setData({
      selectedUnit: unit,
      showUnitsModal: false
    });
  },
  
  // 防止穿透
  preventTouchMove: function() {
    return false;
  },
  
  // 阻止事件冒泡
  preventBubble: function(e) {
    // 在微信小程序中，直接返回 false 或不处理，不调用 stopPropagation
    return false; // 这种方式在微信小程序中可以阻止事件冒泡
  },
  
  // 轮播控制 - 上一页
  prevSlide: function() {
    let index = this.data.currentSwiperIndex;
    if (index > 0) {
      index--;
    } else {
      index = 3; // 循环到最后一页（总共4页）
    }
    this.setData({
      currentSwiperIndex: index
    });
  },
  
  // 轮播控制 - 下一页
  nextSlide: function() {
    let index = this.data.currentSwiperIndex;
    if (index < 3) { // 总共4页，索引0-3
      index++;
    } else {
      index = 0; // 循环到第一页
    }
    this.setData({
      currentSwiperIndex: index
    });
  },
  
  onShareAppMessage: function() {
    return {
      title: '2024定向生政策解读与校信查询',
      path: '/pages/policy-direction/index'
    };
  },
  
  onShareTimeline: function() {
    return {
      title: '2024定向生政策解读与校信查询'
    };
  },
  
  // 显示分数查询帮助提示
  showScoreSearchHelp: function() {
    this.setData({
      showScoreSearchTip: true
    });
  },
  
  // 隐藏分数查询帮助提示
  hideScoreSearchTip: function() {
    this.setData({
      showScoreSearchTip: false
    });
  },
  
  // 加载政策解读数据
  /* loadPolicyData: function() {
    // 从policy.js获取政策解读数据
    if (policyModule && policyModule.policyData) {
      this.setData({
        policyData: policyModule.policyData
      });
    }
  }, */
  
  // 点击政策标题展开或折叠内容
  togglePolicySection: function(e) {
    const id = e.currentTarget.dataset.id;
    const openSections = { ...this.data.openSections };
    
    // 切换展开/折叠状态
    openSections[id] = !openSections[id];
    
    this.setData({
      openSections: openSections
    });
  },
  
  // 加载政策详情（添加缺失的方法）
  loadPolicyDetail: function() {
    // 如果政策模块存在，可以从中加载政策详情
    if (policyModule && policyModule.policyData) {
      console.log('政策详情加载成功');
    } else {
      console.log('无法加载政策详情，使用默认内容');
    }
  },
  
  // 添加单位搜索框获取焦点的处理函数
  onUnitSearchFocus: function() {
    if (this.data.unitSearchText && this.data.unitSearchText.length > 0) {
      this.fuzzySearchSchools(this.data.unitSearchText);
      this.setData({
        showSchoolsDropdown: true
      });
    }
  },
  
  // 添加分数搜索框获取焦点的处理函数
  onScoreSearchFocus: function() {
    if (this.data.scoreSearchText && this.data.scoreSearchText.length > 0) {
      this.fuzzySearchScoreSchools(this.data.scoreSearchText);
      this.setData({
        showScoreSchoolsDropdown: true
      });
    }
  },
  
  // 单位选择器变化处理
  onUnitPickerChange: function(e) {
    const index = e.detail.value;
    const unit = this.data.unitOptionsWithReset[index];
    
    // 处理"重置"选项
    if (unit === '重置') {
      this.setData({
        selectedScoreUnit: ''
      });
    } else {
      this.setData({
        selectedScoreUnit: unit
      });
    }
  },
  
  // 滚动到查询结果区域
  scrollToResult: function(selector) {
    const query = wx.createSelectorQuery();
    query.select(selector).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(function(res) {
      if (res && res[0] && res[1]) {
        const resultRect = res[0];
        const scrollTop = res[1].scrollTop;
        
        // 计算结果区域顶部相对于视口顶部的位置
        const offsetTop = resultRect.top + scrollTop;
        
        // 滚动到结果区域，并留出一点顶部空间
        wx.pageScrollTo({
          scrollTop: offsetTop - 100,
          duration: 300
        });
      }
    });
  },
  
  // 添加页面点击事件处理，点击页面其他区域时关闭下拉框
  onPageTap: function() {
    if (this.data.showSchoolsDropdown || this.data.showScoreSchoolsDropdown) {
      this.setData({
        showSchoolsDropdown: false,
        showScoreSchoolsDropdown: false
      });
    }
  },
}); 