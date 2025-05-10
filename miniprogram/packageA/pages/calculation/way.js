function calculateChineseScore(score) {
    return score; // 语文按原始分计算
}

function calculatePhysicalScore(score, experimentalScore) {
    return (score + experimentalScore) * 0.5; // 物理卷面90分，实验10分，按50%计算
}

function calculateHistoryScore(score) {
    return score * 0.4; // 历史按40%计算
}

function calculateMathScore(score) {
    return score; // 数学按原始分计算
}

function calculateChemistryScore(score, experimentalScore) {
    return (score + experimentalScore) * 0.3; // 化学卷面90分，实验10分，按30%计算
}

function calculateMoralityScore(score) {
    return score * 0.4; // 道德与法治按40%计算
}

function calculateEnglishScore(writtenScore, listeningScore) {
    return (writtenScore  + listeningScore)  ; // 英语卷面70分，听力30分，按100%计算
}

function calculateGeographyScore(score) {
    return score * 0.3; // 地理按30%计算
}

function calculateBiologyScore(score, experimentalScore) {
    return (score + experimentalScore) * 0.4 ; // 生物卷面90分，实验10分，按40%计算
}

function calculateITScore(score) {
    return score == 10 ? 10 : 1; // 信息技术合格计10分，不合格按10%
}

function calculateArtScore(score) {
    if (score == 20) return 20; // 优秀
    if (score == 15) return 15; // 良好
    return score == 10 ? 10 : 0; // 合格计10分
}

function calculateMusicScore(score) {
    if (score == 20) return 20; // 优秀
    if (score == 15) return 15; // 良好
    return score == 10 ? 10 : 0; // 合格计10分
}

function calculateLabourScore(score) {
    if (score == 20) return 20; // 优秀
    if (score == 15) return 15; // 良好
    return score == 10 ? 10 : 0; // 合格计10分
}

function calculatePhysicalEducationScore(scores) {
    return scores; // 直接返回用户输入的分数
}
function calculateTotalScore(scores) {
  // 解构所有科目分数
  const {
    chinese = 0,
    physical = 0,
    history = 0,
    math = 0,
    chemistry = 0,
    morality = 0,
    english = 0,
    geography = 0,
    biology = 0,
    it = 0,
    art = 0,
    music = 0,
    labour = 0,
    physicalEducation = 0
  } = scores;

  // 计算总分
  const totalScore = chinese + physical + history + math + chemistry + 
                     morality + english + geography + biology + it + 
                     art + music + labour + physicalEducation;
                     
  return totalScore;
}

// 示例调用
const chineseScore = calculateChineseScore(95);
const physicalScore = calculatePhysicalScore(80, 8);
const historyScore = calculateHistoryScore(70);
const mathScore = calculateMathScore(90);
const chemistryScore = calculateChemistryScore(85, 9);
const moralityScore = calculateMoralityScore(60);
const englishScore = calculateEnglishScore(70, 25);
const geographyScore = calculateGeographyScore(80);
const biologyScore = calculateBiologyScore(88, 9);
const itScore = calculateITScore(75);
const artScore = calculateArtScore(88);
const musicScore = calculateMusicScore(77);
const labourScore = calculateLabourScore(66);
const physicalEducationScore = calculatePhysicalEducationScore([70, 75, 80]);

console.log(`语文: ${chineseScore}`);
console.log(`物理: ${physicalScore}`);
console.log(`历史: ${historyScore}`);
console.log(`数学: ${mathScore}`);
console.log(`化学: ${chemistryScore}`);
console.log(`道德与法治: ${moralityScore}`);
console.log(`英语: ${englishScore}`);
console.log(`地理: ${geographyScore}`);
console.log(`生物: ${biologyScore}`);
console.log(`信息技术: ${itScore}`);
console.log(`美术: ${artScore}`);
console.log(`音乐: ${musicScore}`);
console.log(`劳动技术: ${labourScore}`);
console.log(`体育: ${physicalEducationScore}`);

// 导出所有计算函数
module.exports = {
  calculateChineseScore,
  calculatePhysicalScore,
  calculateHistoryScore,
  calculateMathScore,
  calculateChemistryScore,
  calculateMoralityScore,
  calculateEnglishScore,
  calculateGeographyScore,
  calculateBiologyScore,
  calculateITScore,
  calculateArtScore,
  calculateMusicScore,
  calculateLabourScore,
  calculatePhysicalEducationScore,
  calculateTotalScore
};