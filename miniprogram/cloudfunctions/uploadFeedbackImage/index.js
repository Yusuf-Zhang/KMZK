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
    // 从前端接收的文件ID
    const fileID = event.fileID
    if (!fileID) {
      return {
        code: 1,
        msg: '未收到文件',
        openid: openid
      }
    }
    
    // 获取文件上传的临时链接
    const fileList = [fileID]
    const result = await cloud.getTempFileURL({
      fileList: fileList
    })
    
    // 将文件ID与openid关联存储
    const db = cloud.database()
    const timestamp = new Date().getTime()
    const mediaID = `media_${timestamp}_${openid.substring(0, 8)}`
    
    // 将文件信息存入数据库
    await db.collection('feedback_images').add({
      data: {
        _openid: openid,
        fileID: fileID,
        tempURL: result.fileList[0].tempFileURL,
        mediaID: mediaID,
        createTime: db.serverDate()
      }
    })
    
    return {
      code: 0,
      mediaId: mediaID,
      fileID: fileID,
      tempURL: result.fileList[0].tempFileURL,
      msg: '上传成功'
    }
  } catch (err) {
    console.error(err)
    return {
      code: 1,
      msg: '上传失败: ' + err,
      openid: openid
    }
  }
} 