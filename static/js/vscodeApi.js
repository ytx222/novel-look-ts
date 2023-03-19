/* eslint-env browser */

import { getScroll } from './dom.js';

// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();

/**
 * 一些缓存数据,也可以理解为state,会调用vscode的api进行临时缓存
 * 不能持久保存
 * @type {WebviewCache}
 */
export let cache = {
	setting: {},
	showChapter: {},
};

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

// /**
//  * 发送数据
//  */
// function postCodeMessage({ type, data }) {
// 	({ type, data });
// }

/**
 * 保存当前章节的滚动高度
 *
 * @param {*} scroll
 * @param {*} isPostMsg
 */
export function saveScroll(scroll = getScroll(), isPostMsg = true) {
	// TODO: 未来保存更多的信息,如段落index,pageWidth,以实现页面宽度变化时的自适应
	// 这里需要被调用,所以缓存的方法名是读取 readCacheScroll
	setCache('readScroll', scroll);
	// console.warn("save_Scroll", scroll);
	if (isPostMsg) {
		postMsg('saveScroll', { key: 'catch_' + cache?.showChapter?.title, value: scroll });
	}
}

// 发送消息
export function postMsg(type, data) {
	console.log('子页面-postMsg', type, data);
	//切换章节时,清除当前章节的缓存滚动高度
	if (type === 'chapterToggle') {
		saveScroll(0, false);
	}
	vscode.postMessage({ type, data });
}
