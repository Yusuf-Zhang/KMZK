// 初始化timeline数据到云数据库
// 不再从本地导入数据
// const timelineData = require('../data/timeline.js');

// 云数据库初始化工具

// 引入所需的本地数据
// 注意：本地数据应该先存放在对应的js文件中

// 获取数据库实例
const getDatabase = () => {
  try {
    return wx.cloud.database();
  } catch (error) {
    console.error('获取数据库实例失败，可能是云开发未初始化:', error);
    throw new Error('云开发未初始化，无法获取数据库实例');
  }
};

/**
 * 初始化时间线数据
 */
const initTimelineData = () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
    // 首先检查是否已有数据
    db.collection('timeline')
      .count()
      .then(res => {
        if (res.total > 0) {
          console.log('时间线数据已存在，跳过初始化');
          resolve();
          return;
        }

        console.log('开始初始化时间线数据...');
        
        // 导入时间线数据
        const timelineData = require('../data/timeline');
        
        // 构建批量添加的Promise数组
        const addPromises = timelineData.map(item => {
          return db.collection('timeline').add({
            data: item
          });
        });
        
        Promise.all(addPromises)
          .then(() => {
            console.log('时间线数据初始化完成');
            resolve();
          })
          .catch(error => {
            console.error('初始化时间线数据失败:', error);
            reject(error);
          });
      })
      .catch(err => {
        console.error('查询时间线数据失败:', err);
        reject(err);
      });
    } catch (error) {
      console.error('初始化时间线数据出错:', error);
      reject(error);
    }
  });
};

/**
 * 初始化高中学校数据
 */
const initHighSchoolData = () => {
  return new Promise((resolve, reject) => {
    console.log('高中学校数据不再通过此函数初始化到云数据库。');
    resolve(); // 直接成功，不做任何事
  });
};

/**
 * 初始化方向学校列表数据
 */
const initDirectionSchoolData = () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
    // 首先检查是否已有数据
    db.collection('directionSchool-list')
      .count()
      .then(res => {
        if (res.total > 0) {
          console.log('方向学校列表数据已存在，跳过初始化');
          resolve();
          return;
        }

        console.log('开始初始化方向学校列表数据...');
        
        // 导入方向学校数据
        const directionSchoolData = require('../data/direction-schools');
        
        // 添加到数据库
        db.collection('directionSchool-list')
          .add({
            data: directionSchoolData
          })
          .then(() => {
            console.log('方向学校列表数据初始化完成');
            resolve();
          })
          .catch(error => {
            console.error('初始化方向学校列表数据失败:', error);
            reject(error);
          });
      })
      .catch(err => {
        console.error('查询方向学校列表数据失败:', err);
        reject(err);
      });
    } catch (error) {
      console.error('初始化方向学校列表数据出错:', error);
      reject(error);
    }
  });
};

/**
 * 初始化录取分数数据
 */
const initAdmissionScoreData = () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
    // 首先检查是否已有数据
    db.collection('admission-score')
      .count()
      .then(res => {
        if (res.total > 0) {
          console.log('录取分数数据已存在，跳过初始化');
          resolve();
          return;
        }

        console.log('开始初始化录取分数数据...');
        
        // 导入录取分数数据
        const admissionScoreData = require('../data/admission-scores');
        
        // 添加到数据库
        db.collection('admission-score')
          .add({
            data: admissionScoreData
          })
          .then(() => {
            console.log('录取分数数据初始化完成');
            resolve();
          })
          .catch(error => {
            console.error('初始化录取分数数据失败:', error);
            reject(error);
          });
      })
      .catch(err => {
        console.error('查询录取分数数据失败:', err);
        reject(err);
      });
    } catch (error) {
      console.error('初始化录取分数数据出错:', error);
      reject(error);
    }
  });
};

/**
 * 初始化所有数据库集合
 */
const initAllCollections = () => {
  return new Promise((resolve, reject) => {
    console.log('开始初始化所有数据库集合...');
    
    // 依次初始化各个集合
    Promise.all([
      initTimelineData(),
      initHighSchoolData(),
      initDirectionSchoolData(),
      initAdmissionScoreData()
    ])
      .then(() => {
        console.log('所有数据库集合初始化完成');
        resolve();
      })
      .catch(error => {
        console.error('初始化数据库集合失败:', error);
        reject(error);
      });
  });
};

// 导出初始化函数
module.exports = {
  initTimelineData,
  initHighSchoolData,
  initDirectionSchoolData,
  initAdmissionScoreData,
  initAllCollections
}; 