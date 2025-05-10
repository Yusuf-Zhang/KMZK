// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    console.log('收到反馈提交请求:', JSON.stringify(event))
    
    // 获取前端提交的反馈信息
    const { type, content, nickname, phone, mediaIds, systemInfo } = event
    
    if (!type || !content) {
      return {
        code: 1,
        msg: '反馈类型和内容不能为空',
        openid: openid
      }
    }
    
    // 验证mediaIds是否存在并有效
    let validMediaIds = []
    if (Array.isArray(mediaIds) && mediaIds.length > 0) {
      const db = cloud.database()
      // 根据mediaIds查询已保存的图片信息
      const imagePromises = mediaIds.map(async mediaId => {
        const res = await db.collection('feedback_images').where({
          mediaID: mediaId
        }).get()
        
        if (res.data && res.data.length > 0) {
          return {
            mediaId: mediaId,
            fileID: res.data[0].fileID,
            tempURL: res.data[0].tempURL
          }
        }
        return null
      })
      
      const imageResults = await Promise.all(imagePromises)
      validMediaIds = imageResults.filter(item => item !== null)
    }
    
    // 保存反馈信息到数据库
    const db = cloud.database()
    
    // 构建反馈数据
    const feedbackData = {
      _openid: openid,
      type: type,
      content: content,
      nickname: nickname || '',
      phone: phone || '',
      mediaIds: validMediaIds.map(item => item ? item.mediaId : ''),
      mediaData: validMediaIds,
      systemInfo: systemInfo || '',
      status: 'pending', // 状态：待处理
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
    
    console.log('准备保存反馈数据:', JSON.stringify(feedbackData))
    
    // 判断feedback集合是否存在
    try {
      await db.createCollection('feedback')
      console.log('feedback集合创建成功')
    } catch (err) {
      // 集合可能已存在，忽略错误
      console.log('feedback集合已存在或创建失败:', err.message)
    }
    
    const result = await db.collection('feedback').add({
      data: feedbackData
    })
    
    console.log('保存反馈成功:', JSON.stringify(result))
    
    return {
      code: 0,
      msg: '提交成功',
      _id: result._id
    }
  } catch (err) {
    console.error('提交反馈异常:', err)
    return {
      code: 1,
      msg: '提交失败: ' + err.message,
      openid: openid
    }
  }
} 