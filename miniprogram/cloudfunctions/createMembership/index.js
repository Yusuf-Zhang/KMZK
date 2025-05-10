// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const userId = event.userId || wxContext.OPENID

  // 从请求中获取会员信息
  const { type, price, startDate, expireDate, isActive = true } = event

  try {
    // 创建会员记录
    const result = await db.collection('membership').add({
      data: {
        userId,
        type,
        price: Number(price),
        startDate: new Date(startDate),
        expireDate: new Date(expireDate),
        isActive,
        createTime: new Date(),
        updateTime: new Date()
      }
    })

    return {
      code: 0,
      msg: '会员创建成功',
      data: {
        membershipId: result._id,
        isActive,
        expireDate
      }
    }
  } catch (error) {
    console.error('创建会员记录失败:', error)
    return {
      code: -1,
      msg: '创建会员记录失败',
      error
    }
  }
} 