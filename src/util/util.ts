import * as vscode from 'vscode';
/**
 * @type {}
 */
let content: vscode.ExtensionContext;

export function init(_content: vscode.ExtensionContext): void {
	content = _content;
}
/**
 * 设置存储数据
 * @param {String} key 键
 * @param {Object} value 默认值
 */
export function setState(key: string, value: any): void {
	content.globalState.update(key, value);
}
/**
 * 读取存储数据
 * @param {String} key 键
 * @param {Object} def 默认值
 */
export function getState<T>(key: string): T | undefined {
	return content.globalState.get(key);
}
/**
 * 读取存储数据
 * @param {String} key 键
 * @param {Object} def 默认值
 */
export function getStateDefault<T>(key: string, def: T): T {
	return content.globalState.get(key, def);
}
/**
 * 设置需要同步的值
 */
export function setSync(...keys: string[]): void {
	content.globalState.setKeysForSync(keys);
}

/**
 * 获取拓展的安装目录
 * @returns {vscode.Uri}
 */
export function getExtensionUri(): vscode.Uri {
	return content.extensionUri;
}
