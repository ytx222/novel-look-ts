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
	// console.warn('content.globalState',content.globalState);
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
	// console.warn('content.extensionUri',content.extensionUri);
	return content.extensionUri;
}

export function fn<T>(this: T, ...args: T[]): Promise<{ this: T; args: T[] }> {
	return new Promise<{ this: T; args: T[] }>((resolve, reject) => {
		setTimeout(() => {
			resolve({ this: this, args });
		}, 1000);
	});
}

export async function sleep(ms = 10) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(resolve, ms);
	});
}

/** 只有时分秒 */
export function formatTime(date?: Date, isDate = false): string {
	const _date = date || new Date();
	const year = _date.getFullYear();
	const month = _date.getMonth() + 1;
	const day = _date.getDate();
	const hour = _date.getHours();
	const minute = _date.getMinutes();
	const second = _date.getSeconds();
	let res = [hour, minute, second].map(formatNumber).join(':');
	if (isDate) res = [year, month, day].map(formatNumber).join('/') + ' ' + res;
	return res;
}

/**
 * @desc: 格式化数字
 * @return: n > 10 [eg: 12] => 12 | n < 10 [eg: 3] => '03'
 * @param {*} n
 */
export function formatNumber(v: string | number) {
	const num = v.toString();
	return num[1] ? num : '0' + num;
}
