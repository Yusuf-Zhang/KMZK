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
  return new Promise((resolve) => {
    console.log('时间线数据使用本地数据，无需初始化云数据库');
    resolve();
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
          const highSchoolsData = require('../data/high-schools');
          
          // 添加到数据库
          db.collection('admission-score')
            .add({
              data: highSchoolsData
            })
            .then(() => {
              console.log('录取分数数据初始化完成');
              resolve();
            })
            .catch(error => {
              console.error('初始化录取分数数据失败:', error);
              resolve(); // 失败时也继续执行，因为可以使用本地数据
            });
        })
        .catch(err => {
          console.error('查询录取分数数据失败:', err);
          resolve(); // 出错时也继续执行，因为可以使用本地数据
        });
    } catch (error) {
      console.error('初始化录取分数数据出错:', error);
      resolve(); // 出错时也继续执行，因为可以使用本地数据
    }
  });
};

/**
 * 初始化激活码数据（仅作为示例，实际使用时请通过管理后台添加激活码）
 */
const initInviteCodeData = () => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDatabase();
      // 首先检查是否已有数据
      db.collection('inviteCode')
        .count()
        .then(res => {
          if (res.total > 0) {
            console.log('激活码数据已存在，跳过初始化');
            resolve();
            return;
          }

          console.log('开始初始化激活码示例数据...');
          
          // 示例激活码数据
          const inviteCodeData = [
            {
              code: 'MONTH123456789012',
              type: '月度',
              used: 0,
              createTime: new Date()
            },
            {
              code: 'QUARTER12345678901',
              type: '季度',
              used: 0,
              createTime: new Date()
            },
            {
              code: 'YEAR1234567890123',
              type: '年度',
              used: 0,
              createTime: new Date()
            }
          ];
          
          // 批量添加到数据库
          const promises = inviteCodeData.map(codeItem => {
            return db.collection('inviteCode').add({
              data: codeItem
            });
          });
          
          Promise.all(promises)
            .then(() => {
              console.log('激活码示例数据初始化完成');
              resolve();
            })
            .catch(error => {
              console.error('初始化激活码示例数据失败:', error);
              resolve(); // 失败时也继续执行
            });
        })
        .catch(err => {
          console.error('查询激活码数据失败:', err);
          resolve(); // 出错时也继续执行
        });
    } catch (error) {
      console.error('初始化激活码数据出错:', error);
      resolve(); // 出错时也继续执行
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
      initAdmissionScoreData(),
      initInviteCodeData() // 添加激活码初始化
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
  initInviteCodeData, // 导出激活码初始化函数
  initAllCollections
}; 