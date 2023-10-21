/* eslint-env browser */

import { dispatchCustomEvent, getScroll } from './dom.js';

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

	// screenDirection: 1,
	// theme: {},
};
// 方便调试
window.cache = cache;

export function getState() {
	return vscode.getState();
}


/**
 * 设置缓存 ,本来的vscode.setState是简单的对象.我自己封装一下成键值对
 * 既然官方说了高性能,那么这样损耗应该不大(性价比高)
 * <T extends keyof AAA>(key:T, value:AAA[T])
 * @param {keyof WebviewCache} key 键
 * @param {Object} value  值
 */
export function setCache(key, value) {
	cache[key] = value;
	vscode.setState(cache);
}

/**
 * 保存当前章节的滚动高度
 *
 * @param {number} scroll
 * @param {boolean} isPostMsg
 */
export function saveScroll(scroll = getScroll(), isPostMsg = true) {
	console.log({ scroll, isPostMsg });
	// 如果滚动高度未变化,则无意义
	if (scroll === cache.readScroll) return;
	// TODO: 未来保存更多的信息,如段落index,pageWidth,以实现页面宽度变化时的自适应
	// 这里需要被调用,所以缓存的方法名是读取 readCacheScroll
	setCache('readScroll', scroll);
	// console.warn("save_Scroll", scroll);
	if (isPostMsg) {
		postMsg('saveScroll', { key: 'catch_' + cache?.showChapter?.title, value: scroll });
	}
}

/**
 * 发送消息
 * @param {PostMessageTypes} type
 * @param {*} data
 */
/**
 * @type {PostMessageFn}
 */
export function postMsg(type, data) {
	console.log('子页面-postMsg', type, data);
	vscode.postMessage({ type, data });
}

/**
 * 切换章节必须走的方法
 * @param {'next' | 'prev'} type
 */
export const chapterToggle = type => {
	postMsg('chapterToggle', type);
	//切换章节时,清除当前章节的缓存滚动高度
	saveScroll(0, false);
	// 清空选择
	document.getSelection()?.empty();
	dispatchCustomEvent('chapterToggle', { toggleType: type });
};
/** 下一章 */
export const nextChapter = () => void chapterToggle('next');
/** 上一章 */
export const prevChapter = () => void chapterToggle('prev');
