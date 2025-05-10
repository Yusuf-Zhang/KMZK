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
  const openid = wxContext.OPENID
  
  // 获取传入的用户信息
  const { nickName, avatarUrl, updateTime } = event
  
  try {
    // 查询用户是否存在
    const userCollection = db.collection('users')
    const userResult = await userCollection.where({
      openid: openid
    }).get()
    
    // 构建用户数据
    const userData = {
      nickName: nickName || '微信用户',
      avatarUrl: avatarUrl || '',
      openid: openid,
      updateTime: updateTime || new Date()
    }
    
    let result
    
    // 如果用户已存在，则更新用户数据
    if (userResult.data && userResult.data.length > 0) {
      result = await userCollection.where({
        openid: openid
      }).update({
        data: userData
      })
    } else {
      // 不存在则新增用户数据
      userData.createTime = new Date() // 新用户添加创建时间
      result = await userCollection.add({
        data: userData
      })
    }
    
    return {
      success: true,
      result,
      openid
    }
  } catch (error) {
    console.error('保存用户数据失败', error)
    return {
      success: false,
      error,
      openid
    }
  }
} 