/* eslint-env browser */
import { cache, nextChapter, postMsg, saveScroll } from './vscodeApi.js';

/**
 * 此文件的定位是提供dom相关的操作,但是不包含业务逻辑
 * 可复用的dom相关的一般是放在这里,
 * 不可复用的可能直接放在业务逻辑那边
 *
 *
 */

/**
 * @type {WebviewElements}
 */
export let el;

export function initEl() {
	let _el = {
		main: document.querySelector('.main'),
		title: document.querySelector('.main .header .title'),
		// content: document.querySelector('.main .content'),
		get content() {
			return document.querySelector('.main .content');
		},
		nav: document.querySelector('.nav'),
		navTitle: document.querySelector('.nav .title'),
		sideNextBtns: document.querySelectorAll('.function-box .side-next-btn'),
		sheet: document.querySelector('style'),
	};
	el = _el;
	return _el;
}

/** @returns {number} 获取主滚动区域的滚动高度 */
export let getScroll = () => el.main.scrollTop;
export let setScroll = h => el.main.scrollTo(0, h);

/**
 * 页面是否触底
 * @param {number} 用来判断的滚动高度,一般是不传,默认用当前页面滚动高度
 */
export function isPageEnd(curScroll = getScroll()) {
	// 总滚动高度
	const h = el.main.scrollHeight;
	// 当前滚动top+元素可视大小(元素大小)
	const curH = curScroll + el.main.clientHeight;
	// 如果距离小于10.就认为触底了
	return h - curH < 10;
}

/**
 * 上下翻页(一个屏幕)
 * @param {Number} direction 方向 1下 -1上
 * @param {Event} event  用来阻止默认行为
 */
export function scrollScreen(direction = 1, event) {
	event?.preventDefault();
	// let cur = window.scrollY;
	let cur = getScroll();
	let h = document.documentElement.clientHeight - el.nav.clientHeight - 50 * (cache.setting?.zoom || 1);
	const newH = cur + h * direction;
	setScroll(newH);
	saveScroll(newH);
}

/**
 * 向下翻页,如果到页面底部则去下一章
 * @returns {boolean} 是否翻章
 */
export function nextPageOrChapter(event) {
	let flag = isPageEnd();
	if (flag) nextChapter();
	// 空格自带翻页效果
	else scrollScreen(1, event);

	return flag;
}

/**
 * 迭代元素的所有父元素
 * @param {Element} el
 * @returns {Iterable<Element>} 父元素
 */
export function* ElementParentIterator(el) {
	let curEl = el;
	while (curEl) {
		yield curEl;
		curEl = curEl?.parentElement;
	}
	return null;
}

window.addEventListener('DOMContentLoaded', function () {
	initEl();
});

/**
 * 发送自定义事件
 * @param {CustomEvents} eventName
 * @param {Object} eventProperty
 */
export function dispatchCustomEvent(eventName, eventProperty = {}) {
	let event = new Event(eventName, {
		bubbles: false,
	});
	// 拷贝一遍属性,某些属性名可能会拷贝失败,这里拦截一下
	for (var item in eventProperty) {
		try {
			event[item] = eventProperty[item];
		} catch (error) {
			console.log('eventProperty copy', error);
		}
	}
	window.dispatchEvent(event);
}
