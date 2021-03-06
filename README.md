# 小说阅读插件介绍

## 你需要卸载旧版本,安装新版本

新旧版本名称相同,但是 id 不同,因为作者从 js 迁移到 ts,顺便重新建了个项目

本插件更倾向于高性能和方便易用,沉浸阅(mo)读(yu)

自定义阅读页面可以修改小说目录/static 下的文件

## ps: 如果有bug,可以通过git issue或者邮箱联系我,有人联系我的我会优先修改


## 项目地址

https://github.com/ytx222/novel-look-ts

欢迎点☆star☆

## 功能

-   左侧工具栏查看书
-   Alt+s 显示
-   Alt+d 隐藏
-   左右箭头,鼠标前进,后退,滚轮键,翻页(后退是下一章)
-   上下箭头滚动一屏(height - 60px)
-   双击自动滚屏,自动下一章
-   ctrl+滚轮 放大缩小
-   编码自动识别(GBK,UTF-8) 目前是都识别,后期可能只识别部分(更高的性能)
-   历史记录,隐藏已读章节
-   页内进度记录
-   拓展设置

## 设置项说明

-   滚屏速度,间隔时间
-   忽略文件夹
-   字体(标题)大小,缩放,缩进
-   如果您的书无法正确失败,可以修改正则

```js
// 默认正则,如果您有更好的方案欢迎反馈
/(?:\\s*)第[一二三四五六七八九十百千万零\\d]*(章|话)[^\\n]*/;
```

## 备注
- 后续有做成复杂应用的想法的,但是看我心情吧..
  - 大概就是支持主题定制,黑白主题,字体大小等(就是更多是设置项),以及可以在前端直接配置
  - 目标就是搭配上全屏以及禅模式,可以当成正常的pc阅读应用
  - 前端复杂后考虑使用vue(3) + ts?
-   或许,有时间.真正的有时间了,可以重新设计一下这个的架构,然后考虑重写
-   就行写 novel-app 一样,初始就把架构设计的比较完善
