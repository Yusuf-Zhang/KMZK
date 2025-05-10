Component({
  /**
   * 组件的属性列表
   */
  properties: {
    school: {
      type: Object,
      value: null
    },
    visible: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 关闭弹窗
    closeDialog: function() {
      this.triggerEvent('close');
    },
    
    // 阻止遮罩层点击事件冒泡
    preventTouchMove: function() {
      return false;
    }
  }
}); 