// policy-direction/index.js

// 直接导入指定的本地数据文件
// 不再导入数据库服务，也不再使用direction-schools.js
const directionSchoolList = require('./data/direction school-list.js');
const admissionScoreData = require('./data/admission-score.js');
// 导入政策解读数据
const policyModule = require('./policy.js');

Page({
  data: {
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
    policyData: {},
    // 保存展开的政策部分ID
    openSections: {},
    // 导航栏高度
    navHeight: 90
  },

  onLoad: function (options) {
    
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
    
    // 加载所有定向单元数据
    this.loadAllUnits();
    // 加载所有学校数据
    this.loadAllSchools();
    // 加载政策详情
    this.loadPolicyDetail();
    // 从数据中提取所有学校名称作为模糊匹配数据源
    this.initAllSchoolNames();
    this.loadAllScoreSchools();
    this.initAllScoreSchoolNames();
    // 加载政策解读数据
    this.loadPolicyData();
  },

  onShow: function() {
    const app = getApp();
    const isMember = app.globalData.membershipStatus.isMember;
    this.setData({ isMember });

    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 }); // 定向政策是第三个tab，索引为2
    }
  },
  
  // --- 添加非会员所需的方法 ---
  showVipModal: function() {
    this.setData({ showVipTipModal: true });
  },

  // hideModal 已存在，用于关闭所有模态框

  goToVip: function() {
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
    if (!this.data.isMember) { this.showVipModal(); return; }
    const text = e.detail.value;
    this.setData({
      unitSearchText: text,
      unitSearched: false  // 重置查询状态
    });
    
    // 清空搜索结果
    if (!text) {
      this.setData({
        unitResults: [],
        showSchoolsDropdown: false
      });
      return;
    }
    
    // 实时过滤匹配的学校名称
    this.filterSchools(text);
  },
  
  // 输入框获取焦点
  onUnitSearchFocus: function() {
    if (!this.data.isMember) { this.showVipModal(); return; }
    if (this.data.unitSearchText) {
      this.filterSchools(this.data.unitSearchText);
    }
  },
  
  // 过滤匹配学校名称
  filterSchools: function(keyword) {
    if (!keyword) {
      this.setData({ 
        showSchoolsDropdown: false,
        filteredSchools: []
      });
      return;
    }

    const filtered = this.allSchoolNames.filter(school => 
      school.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 10); // 最多显示10个匹配结果
    
    this.setData({
      filteredSchools: filtered,
      showSchoolsDropdown: filtered.length > 0
    });
  },
  
  // 从下拉框选择学校
  selectSchool: function(e) {
    if (!this.data.isMember) { this.showVipModal(); return; }
    const school = e.currentTarget.dataset.school;
    this.setData({
      unitSearchText: school,
      showSchoolsDropdown: false
    });
    // 移除自动搜索功能，用户需要点击查询按钮才会搜索
    // this.searchUnitBySchool(school);
  },
  
  // 根据学校查询所属单元
  searchUnitBySchool: function(schoolName) {
    let results = [];
    
    this.data.allUnits.forEach(unit => {
      // 检查schools是否是数组
      if (Array.isArray(unit.schools)) {
        // 先尝试精确匹配
        if (unit.schools.some(school => school === schoolName)) {
          results.push({
            name: unit.name,  // 单元名称，例如"第十三单元"
            schools: unit.schools
          });
        } 
        // 如果没有精确匹配，尝试部分匹配
        else if (unit.schools.some(school => school.includes(schoolName) || schoolName.includes(school))) {
          results.push({
            name: unit.name,
            schools: unit.schools,
            isPartialMatch: true  // 标记为部分匹配
          });
        }
      }
    });
    
    // 如果有精确匹配，过滤掉部分匹配的结果
    const exactMatches = results.filter(r => !r.isPartialMatch);
    if (exactMatches.length > 0) {
      results = exactMatches;
    }
    
    console.log('查询结果:', results);
    
    this.setData({
      unitResults: results
    });
  },
  
  // 搜索单位
  searchUnit: function() {
    if (!this.data.isMember) { this.showVipModal(); return; }
    const text = this.data.unitSearchText;
    if (!text) {
      wx.showToast({
        title: '请输入学校名称',
        icon: 'none'
      });
      return;
    }
    
    this.searchUnitBySchool(text);
    this.setData({
      showSchoolsDropdown: false,
      unitSearched: true  // 标记用户已点击查询按钮
    });
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
    if (!this.data.isMember) { this.showVipModal(); return; }
    const text = e.detail.value;
    this.setData({
      scoreSearchText: text
    });
    if (!text) {
      this.setData({
        showScoreSchoolsDropdown: false,
        filteredScoreSchools: []
      });
      return;
    }
    this.filterScoreSchools(text);
  },
  
  // 输入框获取焦点
  onScoreSearchFocus: function() {
    if (!this.data.isMember) { this.showVipModal(); return; }
    if (this.data.scoreSearchText) {
      this.filterScoreSchools(this.data.scoreSearchText);
    }
  },
  
  // 过滤匹配学校名称
  filterScoreSchools: function(keyword) {
    if (!keyword) {
      this.setData({
        showScoreSchoolsDropdown: false,
        filteredScoreSchools: []
      });
      return;
    }
    const filtered = this.allScoreSchoolNames.filter(school =>
      school.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 10);
    this.setData({
      filteredScoreSchools: filtered,
      showScoreSchoolsDropdown: filtered.length > 0
    });
  },
  
  // 从下拉框选择学校
  selectScoreSchool: function(e) {
    if (!this.data.isMember) { this.showVipModal(); return; }
    const school = e.currentTarget.dataset.school;
    this.setData({
      scoreSearchText: school,
      showScoreSchoolsDropdown: false
    });
  },
  
  // 单元选择下拉框事件
  onUnitPickerChange: function(e) {
    if (!this.data.isMember) { this.showVipModal(); return; }
    const idx = e.detail.value;
    if (idx == 0) {
      this.setData({
        selectedScoreUnit: ''
      });
    } else {
      this.setData({
        selectedScoreUnit: this.data.unitOptionsWithReset[idx]
      });
    }
  },
  
  // 显示所有单元
  showAllUnits: function() {
    if (!this.data.isMember) { this.showVipModal(); return; }
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
    if (!this.data.isMember) { this.showVipModal(); return; }
    this.setData({
      showSchoolsModal: true
    });
  },
  
  // 显示政策详情
  showPolicyDetail: function() {
    // 使用policy.js中的内容构建政策详情
    let policyContent = policyModule.policyData.title + '\n\n';
    
    policyModule.policyData.sections.forEach(section => {
      policyContent += section.title + '\n';
      policyContent += section.content + '\n\n';
    });
    
    this.setData({
      policyDetail: policyContent,
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
  
  // 查询分数线
  searchScore: function() {
    if (!this.data.isMember) { this.showVipModal(); return; }
    const schoolName = this.data.scoreSearchText;
    const unit = this.data.selectedScoreUnit;
    if (!schoolName || !unit) {
      wx.showToast({
        title: '请输入学校名称并选择单元',
        icon: 'none'
      });
      return;
    }
    this.setData({
      queriedScoreUnit: unit
    });
    const results = this.getScoreResults(schoolName, unit);
    this.setData({
      scoreResults: results
    });
  },

  // 获取分数线结果（根据学校和单元）
  getScoreResults: function(schoolName, unit) {
    const schools = this.data.allScoreSchools || [];
    const result = [];
    schools.forEach(school => {
      if (
        school.name.includes(schoolName) &&
        school.scores &&
        school.scores[unit] !== undefined // 检查分数是否存在
      ) {
        result.push({
          name: school.name,
          level: school.level,
          score: school.scores[unit]
        });
      }
    });
    return result;
  },
  
  // 加载政策解读数据
  loadPolicyData: function() {
    // 从policy.js获取政策解读数据
    if (policyModule && policyModule.policyData) {
    this.setData({
      policyData: policyModule.policyData
    });
      console.log('已加载政策解读数据');
    } else {
      console.error('未能加载政策解读数据');
    }
  },
  
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
}); 