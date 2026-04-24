# http://localhost:5174/perception/dashboard

* 


# http://localhost:5174/perception/queries

* 未对查询结果进行分页处理

# http://localhost:5174/evolution/dashboard

* 进化趋势折线图的色块展示和数字对应有点问题
* 品牌和时间的筛选按钮现仅展示为两个下拉按钮的图标，优化一下显示方式，比如配上对应的“品牌”和“时间”文字

# http://localhost:5174/evolution/strategies

* 品牌和策略类型的筛选按钮现仅展示为两个下拉按钮的图标，优化一下显示方式，比如配上对应的“品牌”和“策略类型”文字
* 策略详情的编辑页面，修改策略类型未生效，前端的请求并未包涵对应变更参数。每次修改会导致策略参数中的json字段内累计增加反斜杠字符
* 页面上显示为按10条数据进行分页，实际并没有分页效果，数据为全量展示
* 策略详情页面进行添加时，评估时调用路径http://localhost:5174/evolution/strategies +策略id+/evaluate 的POST接口，提示404，页面提交时也未作必填校验

# http://localhost:5174/generation/dashboard

* 除总生成内容、已发布内容外，其余页面对应内容均未根据从后端获取的字段处理后展示，后端返回的数据中缺少“平均反馈评分”和“每日生成”的值

# http://localhost:5174/generation/contents

* 

# http://localhost:5174/memory/management

* 

# http://localhost:5174/execution/dashboard

* 

# http://localhost:5174/compliance/management

* 选择待检测内容的查看按钮时有调用接口，页面展示内容无任何变化

* 点击合规检测后，查看检测结果为通过，但页面上对应数据的合规状态仍为未检测

  

