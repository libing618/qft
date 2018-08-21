module.exports = {
  openWxLogin: function () {              //取无登录状态数据
    return new Promise((resolve, reject) => {
      wx.login({
        success: function (wxlogined) {
          if (wxlogined.code) {
            wx.getUserInfo({
              withCredentials: true,
              success: function (wxuserinfo) {
                if (wxuserinfo) {
                  wx.cloud.callFunction({                  // 调用云函数
                    name: 'login',
                    data: { code: wxlogined.code, encryptedData: wxuserinfo.encryptedData, iv: wxuserinfo.iv },
                    success: res => {
                      console.log('[云函数] [login] user openid: ', res.result.openid)
                      app.globalData.openid = res.result.openid
                      if (res.result.oId) { //(errMsg == "request:ok"){
                        wx.setStorage({ key: 'loginInfo', data: res.result })
                        resolve(res.result)
                      } else {
                        reject({ ec: 2, ee: errMsg })
                      }
                      wx.navigateTo({
                        url: '../userConsole/userConsole',
                      })
                    },
                    fail: err => {
                      console.error('[云函数] [login] 调用失败', err)
                      wx.navigateTo({
                        url: '../deployFunctions/deployFunctions',
                      })
                      reject({ ec: 1, ee: error })     //云端登录失败
                    }
                  })
                }
              }
            })
          } else { reject({ ec: 3, ee: '微信用户登录返回code失败！' }) };
        },
        fail: function (err) { reject({ ec: 4, ee: err.errMsg }); }     //微信用户登录失败
      })
    });
  },

  fileUpload: function (cloudPath, filePath) {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => {
        console.log('[上传文件] 成功：', res)

        app.globalData.fileID = res.fileID
        app.globalData.cloudPath = cloudPath
        app.globalData.imagePath = filePath

        wx.navigateTo({
          url: '../storageConsole/storageConsole'
        })
      },
      fail: e => {
        console.error('[上传文件] 失败：', e)
        wx.showToast({
          icon: 'none',
          title: '上传失败',
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  }
}