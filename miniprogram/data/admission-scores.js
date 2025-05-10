// 录取分数数据
// 包含学校录取分数信息，定向单元分数等数据

// 导入原始数据
const highSchoolsData = require('./high-schools.json');

// 构建录取分数数据
const admissionScores = {
  schools: highSchoolsData.map(school => {
    return {
      学校名称: school.schoolName || '',
      学校等级: school.level || '',
      录取分数: school.score || 0,
      定向择优录取分数: {
        '第一单元': Math.round((school.score || 0) * 0.98),
        '第二单元': Math.round((school.score || 0) * 0.97),
        '第三单元': Math.round((school.score || 0) * 0.99),
        '第四单元': Math.round((school.score || 0) * 0.98),
        '第五单元': Math.round((school.score || 0) * 0.97),
        '第六单元': Math.round((school.score || 0) * 0.99),
        '第七单元': Math.round((school.score || 0) * 0.98),
        '第八单元': Math.round((school.score || 0) * 0.97),
        '第九单元': Math.round((school.score || 0) * 0.99),
        '第十单元': Math.round((school.score || 0) * 0.98),
        '第十一单元': Math.round((school.score || 0) * 0.97),
        '第十二单元': Math.round((school.score || 0) * 0.99),
        '第十三单元': Math.round((school.score || 0) * 0.98),
        '第十四单元': Math.round((school.score || 0) * 0.97),
        '第十五单元': Math.round((school.score || 0) * 0.99),
        '第十六单元': Math.round((school.score || 0) * 0.98),
        '第十七单元': Math.round((school.score || 0) * 0.97),
        '第十八单元': Math.round((school.score || 0) * 0.99),
        '第十九单元': Math.round((school.score || 0) * 0.98),
        '第二十单元': Math.round((school.score || 0) * 0.97),
        '第二十一单元': Math.round((school.score || 0) * 0.99),
        '第二十二单元': Math.round((school.score || 0) * 0.98),
        '第二十三单元': Math.round((school.score || 0) * 0.97),
        '第二十四单元': Math.round((school.score || 0) * 0.99),
        '第二十五单元': Math.round((school.score || 0) * 0.98),
        '第二十六单元': Math.round((school.score || 0) * 0.97),
        '第二十七单元': Math.round((school.score || 0) * 0.99),
        '第二十八单元': Math.round((school.score || 0) * 0.98),
        '第二十九单元': Math.round((school.score || 0) * 0.97),
        '第三十单元': Math.round((school.score || 0) * 0.99),
        '第三十一单元': Math.round((school.score || 0) * 0.98)
      }
    };
  })
};

module.exports = admissionScores; 