// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();

// 本地缓存最新章节和样式设置
export let cache = {};

export function getState() {
	return vscode.getState();
}

/**
 * 设置缓存 ,本来的vscode.setState是简单的对象.我自己封装一下成键值对
 * 既然官方说了高性能,那么这样损耗应该不大(性价比高)
 * @param {String} key 键
 * @param {Object} value  值
 */
export function setCache(key, value) {
	cache[key] = value;
	vscode.setState(cache);
}

/**
 * 发送数据
 */
export function postCodeMessage({ type, data }) {
	vscode.postMessage({ type, data });
}
