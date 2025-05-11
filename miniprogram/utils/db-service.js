// 数据库操作服务
const db = wx.cloud.database();

// 导入本地数据（用于云数据库失败时的回退）
const timelineData = require('../data/timeline');
const { highSchoolsData } = require('../data/high-schools');
const { directionSchoolData, admissionScoreData } = require('../data/direction-schools');

/**
 * Timeline数据库服务
 */
const timelineService = {
  /**
   * 获取所有时间线数据
   * @returns {Promise} 返回时间线数据的Promise
   */
  getTimelineList() {
    return new Promise((resolve) => {
      // 直接返回本地数据，按时间排序
      const sortedData = [...timelineData].sort((a, b) => {
        return new Date(a.time) - new Date(b.time);
      });
      resolve(sortedData);
    });
  },

  /**
   * 按月份获取时间线数据
   * @param {string} month 月份，格式如：2025-06
   * @returns {Promise} 返回筛选后的时间线数据
   */
  getTimelineByMonth(month) {
    return new Promise((resolve) => {
      // 从本地数据筛选指定月份的数据
      const filteredData = timelineData.filter(item => {
        return item.time.startsWith(month);
      }).sort((a, b) => {
        return new Date(a.time) - new Date(b.time);
      });
      resolve(filteredData);
    });
  },

  /**
   * 按关键字搜索时间线数据
   * @param {string} keyword 关键字
   * @returns {Promise} 返回包含关键字的时间线数据
   */
  searchTimeline(keyword) {
    return new Promise((resolve) => {
      // 从本地数据搜索包含关键字的数据
      const searchResult = timelineData.filter(item => {
        const reg = new RegExp(keyword, 'i');
        return reg.test(item.eventTheme) || reg.test(item.event);
      }).sort((a, b) => {
        return new Date(a.time) - new Date(b.time);
      });
      resolve(searchResult);
    });
  }
};

/**
 * 高中学校数据库服务
 */
const highSchoolService = {
  /**
   * 获取所有高中学校数据
   * @returns {Promise} 返回高中学校数据的Promise
   */
  getHighSchoolList() {
    return new Promise((resolve) => {
      // 直接使用本地数据
      resolve([highSchoolsData]);
    });
  }
};

/**
 * 高中学校方向数据库服务
 */
const directionSchoolService = {
  /**
   * 获取所有方向学校列表数据
   * @returns {Promise} 返回方向学校列表数据的Promise
   */
  getDirectionSchoolList() {
    return new Promise((resolve, reject) => {
      // 尝试从云数据库获取
      db.collection('directionSchool-list')
        .get()
        .then(res => {
          // 检查结果是否有效
          if (res.data && res.data.length > 0) {
          resolve(res.data);
          } else {
            console.log('云数据库方向学校列表为空，使用本地数据');
            resolve(directionSchoolData);
          }
        })
        .catch(err => {
          console.error('获取方向学校列表数据失败:', err);
          console.log('云数据库获取失败，使用本地数据');
          resolve(directionSchoolData); // 失败时使用本地数据
        });
    });
  }
};

/**
 * 录取分数数据库服务
 */
const admissionScoreService = {
  /**
   * 获取所有录取分数数据
   * @returns {Promise} 返回录取分数数据的Promise
   */
  getAdmissionScoreList() {
    return new Promise((resolve) => {
      // 直接使用本地数据
      resolve(highSchoolsData);
    });
  }
};

module.exports = {
  timelineService,
  directionSchoolService,
  admissionScoreService,
  highSchoolService
}; 