// 导入timeline数据库服务
const { timelineService } = require('../../utils/db-service');

Page({
  data: {
    timelineData: [], // 时间线数据
    loading: true, // 加载状态
    months: [], // 可筛选的月份列表
    selectedMonth: '', // 当前选中的月份
    isMember: false // 会员状态
  },

  onLoad: function() {
    // 获取app实例
    const app = getApp();
    this.setData({
      isMember: app.globalData.membershipStatus.isMember
    });
    
    // 加载全部时间线数据
    this.loadAllTimelineData();
  },
  
  onShow: function() {
    // 更新会员状态
    const app = getApp();
    this.setData({
      isMember: app.globalData.membershipStatus.isMember
    });
  },
  
  // 加载全部时间线数据
  loadAllTimelineData: function() {
    this.setData({ loading: true });
    
    timelineService.getTimelineList().then(data => {
      // 处理时间线数据
      const timelineArray = this.processTimelineData(data);
      
      // 提取月份列表用于筛选
      const months = this.extractMonths(data);
      
      this.setData({
        timelineData: timelineArray,
        months: months,
        loading: false
      });
    }).catch(err => {
      console.error('获取时间线数据失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    });
  },
  
  // 处理时间线数据，添加展示所需的属性
  processTimelineData: function(data) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return data.map(item => {
      // 解析日期
      const eventDateStr = item.time.split(' ')[0];
      const eventDate = new Date(eventDateStr.replace(/-/g, '/'));
      
      // 计算是否已过期和剩余天数
      let isPast = eventDate < now;
      let dayDiff = null;
      let countdownText = "已过期";
      
      if (!isPast) {
        const timeDiff = eventDate.getTime() - now.getTime();
        dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        countdownText = dayDiff === 0 ? "今天" : `还有${dayDiff}天`;
      }
      
      // 提取年月用于分组
      const [year, month] = eventDateStr.split('-');
      const monthKey = `${year}-${month}`;
      
      return {
        ...item,
        date: eventDateStr,
        monthKey: monthKey,
        isPast: isPast,
        countdown: countdownText,
        dayDiff: dayDiff
      };
    }).sort((a, b) => {
      // 按日期排序
      return new Date(a.time.replace(/-/g, '/')) - new Date(b.time.replace(/-/g, '/'));
    });
  },
  
  // 提取月份列表用于筛选
  extractMonths: function(data) {
    const monthSet = new Set();
    
    data.forEach(item => {
      if (item.time) {
        const parts = item.time.split(' ')[0].split('-');
        if (parts.length >= 2) {
          const monthKey = `${parts[0]}-${parts[1]}`;
          monthSet.add(monthKey);
        }
      }
    });
    
    return Array.from(monthSet).sort();
  },
  
  // 按月筛选
  filterByMonth: function(e) {
    const month = e.currentTarget.dataset.month;
    
    if (month === this.data.selectedMonth) {
      // 取消选中
      this.setData({ selectedMonth: '' });
      // 显示全部数据
      this.loadAllTimelineData();
    } else {
      this.setData({ 
        selectedMonth: month,
        loading: true 
      });
      
      // 调用服务按月查询
      timelineService.getTimelineByMonth(month).then(data => {
        const timelineArray = this.processTimelineData(data);
        this.setData({
          timelineData: timelineArray,
          loading: false
        });
      }).catch(err => {
        console.error('按月筛选数据失败', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '筛选失败',
          icon: 'none'
        });
      });
    }
  }
});