// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 *
 * event 参数包含
 * - 小程序端调用传入的 data
 * - 经过微信鉴权直接可信的用户唯一标识 openid
 *
 */
exports.main = (event, context) => {
  console.log(event)

  const appid = 'wx9e3d39be96f96b8f';     //微信小程序appid
  const secret = '22eaa32648dfa9451644954db6c1b4f8';     //微信小程序secret
  var requestWx=require('request');
  var wxurl = 'https://api.weixin.qq.com/sns/jscode2session?appid='+appid+'&secret='+secret+'&js_code='+event.code+'&grant_type=authorization_code';
  return new Promise( (resolve, reject) => {
    requestWx({ url:wxurl, header: {'content-type':'application/json'},},function(err, res, body) {
      if (!err){
        var wxLoginInfo = JSON.parse(body);
        if (wxLoginInfo.unionid){
          resolve({uId:wxLoginInfo.unionid,oId:wxLoginInfo.openid,session:wxLoginInfo.session_key});
        } else {
          var crypto = require('crypto');
          var wxsk=String(wxLoginInfo.session_key);
          var encryptedData = new Buffer(event.encryptedData, 'base64');
          var iv = new Buffer(event.iv, 'base64');
          var wxSession = new Buffer(wxsk, 'base64');
          try {                    // 解密
            var decipher = crypto.createDecipheriv('aes-128-cbc', wxSession, iv);    // 设置自动 padding 为 true，删除填充补位
            decipher.setAutoPadding(true);
            var decoded = decipher.update(encryptedData, 'binary', 'utf8');
            decoded = decoded + decipher.final('utf8');
            decoded = JSON.parse(decoded);
            if (decoded.watermark.appid == appid) {
              resolve({uId:decoded.unionId,oId:wxLoginInfo.openid,ip:request.meta.remoteAddresse,session:wxLoginInfo.session_key});
            } else {
              reject('解密后appid不一致');
            }
         } catch (cerr) {
            reject('解密中出现错误：'+cerr);
          }
        }
      } else {
         reject(err);
      }
    });
  });
  return {
    openid: event.userInfo.openId,
  }
}