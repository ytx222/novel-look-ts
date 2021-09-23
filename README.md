# 小说阅读插件介绍
## TODO: 完善readme
此插件正在从 https://github.com/ytx222/novel-look 迁移请耐心等待更新
迁移中的工作
- img路径修改
- commonjs(node规范)切换到esm
- 代码类型标注
- 使用的node api 迁移到 vscode api
- 将项目中的绝大多数(或所有)使用url(string)的地方更新为uri(vscode.Uri)
- 代码优化

正则
```js
/(?:\\s*)第[一二三四五六七八九十百千万零\\d]*(章|话)[^\\n]*/
```


用接口代替type
自己读写文件,代替vscode自带的存储?
	500ms的防抖
	每100ms,检查并保存一次
	可以将多次保存操作复用?
# bug
FIXME: 刷新不生效
# 优化项
- TreeViewProvider
	- fullPath 改用Uri
	- base 文件名(带后缀) 已经不需要了
