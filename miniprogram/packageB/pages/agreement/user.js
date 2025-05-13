// 用户协议页面逻辑
Page({
  data: {
    // 用户协议内容
    agreementContent: `
# 会员服务协议

本协议是您与昆明中考助手之间关于使用会员服务所订立的契约。请您仔细阅读本协议，确保充分理解协议中各条款。

## 一、服务内容

1. 昆明中考助手会员服务为用户提供以下服务：
   - 查看完整学校分数线和录取信息
   - 院校匹配推荐功能
   - 各类政策解读的完整功能
   - 移除应用内广告
   - 其他会员专属功能

2. 会员服务期限根据用户所购买的套餐而定，可以是月度、季度或年度等多种选择。

## 二、会员费用与支付

1. 用户需支付相应费用获得会员服务，具体价格以购买页面显示为准。

2. 会员费用可通过微信支付等平台支付方式进行支付。

## 三、优惠活动

1. 平台可能不定期开展促销活动，具体优惠信息以活动页面公示为准。

2. 优惠活动的最终解释权归平台所有。

## 四、会员退订与退款

1. 会员服务一经开通，除法律法规明确规定外，不支持退款。

## 五、用户行为规范

1. 用户不得利用会员身份从事任何违法或违反平台规则的活动。

2. 禁止分享、出租、转售会员账号，违者平台有权终止会员服务且不予退款。

## 六、服务变更与终止

1. 平台有权根据运营需求调整会员服务内容和价格，调整前将通过公告或其他方式通知用户。

2. 如用户违反相关法律法规或本协议约定，平台有权终止提供会员服务。

## 七、其他约定

1. 本协议的解释、效力及纠纷解决均适用中华人民共和国大陆地区法律。

2. 平台有权根据法律法规变化或运营需要修改本协议，修改后将通过公告或其他方式通知用户。

3. 如对本协议内容有任何疑问，可通过客服渠道联系我们。
    `
  },

  onLoad: function() {
    // 格式化协议内容，处理markdown语法
    this.formatAgreementContent();
  },

  // 处理协议文本，将Markdown格式转为小程序可显示的格式
  formatAgreementContent: function() {
    let content = this.data.agreementContent;
    
    // 替换标题
    content = content.replace(/# (.*?)\n/g, '<view class="agreement-title">$1</view>\n');
    content = content.replace(/## (.*?)\n/g, '<view class="agreement-subtitle">$1</view>\n');
    
    // 替换列表
    content = content.replace(/(\d+)\. (.*?)\n/g, '<view class="agreement-list-item">$1. $2</view>\n');
    content = content.replace(/- (.*?)\n/g, '<view class="agreement-list-subitem">• $1</view>\n');
    
    // 替换段落
    content = content.replace(/([^#\d-])(.*?)\n/g, function(match, p1, p2) {
      if (p2.trim() !== '') {
        return p1 + '<view class="agreement-paragraph">' + p2 + '</view>\n';
      }
      return match;
    });
    
    this.setData({
      agreementContent: content
    });
  }
}) 