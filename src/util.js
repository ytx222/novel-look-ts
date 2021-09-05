import * as vscode from 'vscode';
/**
 * @type {vscode.ExtensionContext}
 */
let content;

export function init(_content) {
	content = _content;
}
/**
 * 设置存储数据
 * @param {String} key 键
 * @param {Object} value 默认值
 */
 export function setState(key, value) {
	content.globalState.update(key, value);
}
/**
 * 读取存储数据
 * @param {String} key 键
 * @param {Object} def 默认值
 */
 export function getState(key, def) {
	return content.globalState.get(key, def);
}
/**
 * 设置需要同步的值
 * @param  {...String} keys
 */
 export function setSync(...keys) {
	content.globalState.setKeysForSync(keys);
}

/**
 * 获取拓展的安装目录
 * @returns {vscode.Uri}
 */
 export function getExtensionUri() {
	return content.extensionUri;
}
