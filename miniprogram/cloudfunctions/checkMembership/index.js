// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const userId = event.userId || wxContext.OPENID

  try {
    // 查询会员记录
    const membershipRecord = await db.collection('membership').where({
      userId: userId,
      isActive: true,
      expireDate: _.gt(new Date()) // 过期时间大于当前时间
    }).limit(1).get()
    
    // 返回会员状态
    if (membershipRecord && membershipRecord.data && membershipRecord.data.length > 0) {
      // 找到有效会员记录
      return {
        code: 0,
        msg: '查询成功',
        data: {
          isActive: true,
          expireDate: membershipRecord.data[0].expireDate,
          membershipType: membershipRecord.data[0].type || 'standard'
        }
      }
    } else {
      // 没有找到有效会员记录
      return {
        code: 0,
        msg: '查询成功',
        data: {
          isActive: false,
          expireDate: null,
          membershipType: null
        }
      }
    }
  } catch (error) {
    console.error('查询会员状态失败:', error)
    return {
      code: -1,
      msg: '查询会员状态失败',
      error
    }
  }
} 