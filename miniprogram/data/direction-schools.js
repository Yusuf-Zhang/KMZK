// 方向学校列表数据
// 包含各定向单元内的学校列表

// 构建一个包含所有学校名称的数组
const allSchoolNames = ['昆明一中', '昆明三中', '云大附中', '师大附中', '昆明十中', '昆明八中', '昆明六十五中', '昆明二十四中', '云南衡水实验中学', '昆明十九中'];

// 为每个单元分配一些学校（这里使用简单的均匀分配方式）
const totalUnits = 31; // 共31个单元
const schoolsPerUnit = Math.ceil(allSchoolNames.length / totalUnits);

// 构建方向学校列表数据
const directionSchoolsData = {
  units: []
};

// 为每个单元分配学校
for (let i = 0; i < totalUnits; i++) {
  const unitName = `第${numberToChinese(i + 1)}单元`;
  const startIdx = i * schoolsPerUnit;
  const endIdx = Math.min(startIdx + schoolsPerUnit, allSchoolNames.length);
  const unitSchools = allSchoolNames.slice(startIdx, endIdx);
  
  directionSchoolsData.units.push({
    unit: unitName,
    schools: unitSchools
  });
}

// 辅助函数：数字转中文
function numberToChinese(num) {
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) {
    return chineseNumbers[num - 1];
  } else if (num < 20) {
    return '十' + (num - 10 > 0 ? chineseNumbers[num - 11] : '');
  } else if (num < 30) {
    return '二十' + (num - 20 > 0 ? chineseNumbers[num - 21] : '');
  } else {
    return '三十' + (num - 30 > 0 ? chineseNumbers[num - 31] : '');
  }
}

// 定向招生学校默认数据
const directionSchoolData = [
  {
    units: [
      {
        unit: '第一单元',
        schools: [
          { name: '昆明一中', score: 680 },
          { name: '昆明三中', score: 670 },
          { name: '云大附中', score: 660 }
        ]
      },
      {
        unit: '第二单元',
        schools: [
          { name: '师大附中', score: 665 },
          { name: '昆明十中', score: 675 },
          { name: '昆明八中', score: 645 }
        ]
      },
      {
        unit: '第三单元',
        schools: [
          { name: '昆明六十五中', score: 635 },
          { name: '昆明二十四中', score: 630 },
          { name: '昆明十九中', score: 620 }
        ]
      },
      {
        unit: '第四单元',
        schools: [
          { name: '昆明四中', score: 615 },
          { name: '云南师大文理学院附中', score: 605 },
          { name: '寻甸一中', score: 595 }
        ]
      },
      {
        unit: '第五单元',
        schools: [
          { name: '昆明中华中学', score: 585 },
          { name: '昆明市延安中学', score: 575 },
          { name: '云南衡水实验中学', score: 625 }
        ]
      }
    ]
  }
];

// 录取分数数据
const admissionScoreData = [
  {
    schools: [
      {
        学校名称: '昆明一中',
        学校等级: '一级一等',
        各单元录取分数: {
          '第一单元': 680,
          '第二单元': 675,
          '第三单元': 670,
          '第四单元': 665,
          '第五单元': 660
        }
      },
      {
        学校名称: '昆明三中',
        学校等级: '一级一等',
        各单元录取分数: {
          '第一单元': 670,
          '第二单元': 665,
          '第三单元': 660,
          '第四单元': 655,
          '第五单元': 650
        }
      },
      {
        学校名称: '云大附中',
        学校等级: '一级一等',
        各单元录取分数: {
          '第一单元': 660,
          '第二单元': 655,
          '第三单元': 650,
          '第四单元': 645,
          '第五单元': 640
        }
      },
      {
        学校名称: '师大附中',
        学校等级: '一级一等',
        各单元录取分数: {
          '第一单元': 665,
          '第二单元': 660,
          '第三单元': 655,
          '第四单元': 650,
          '第五单元': 645
        }
      },
      {
        学校名称: '昆明十中',
        学校等级: '一级一等',
        各单元录取分数: {
          '第一单元': 675,
          '第二单元': 670,
          '第三单元': 665,
          '第四单元': 660,
          '第五单元': 655
        }
      },
      {
        学校名称: '昆明八中',
        学校等级: '一级二等',
        各单元录取分数: {
          '第一单元': 645,
          '第二单元': 640,
          '第三单元': 635,
          '第四单元': 630,
          '第五单元': 625
        }
      },
      {
        学校名称: '昆明六十五中',
        学校等级: '一级二等',
        各单元录取分数: {
          '第一单元': 635,
          '第二单元': 630,
          '第三单元': 625,
          '第四单元': 620,
          '第五单元': 615
        }
      },
      {
        学校名称: '昆明二十四中',
        学校等级: '一级二等',
        各单元录取分数: {
          '第一单元': 630,
          '第二单元': 625,
          '第三单元': 620,
          '第四单元': 615,
          '第五单元': 610
        }
      },
      {
        学校名称: '云南衡水实验中学',
        学校等级: '一级三等',
        各单元录取分数: {
          '第一单元': 625,
          '第二单元': 620,
          '第三单元': 615,
          '第四单元': 610,
          '第五单元': 605
        }
      },
      {
        学校名称: '昆明十九中',
        学校等级: '一级三等',
        各单元录取分数: {
          '第一单元': 620,
          '第二单元': 615,
          '第三单元': 610,
          '第四单元': 605,
          '第五单元': 600
        }
      }
    ]
  }
];

module.exports = {
  directionSchoolData,
  admissionScoreData
}; 