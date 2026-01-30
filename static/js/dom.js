/* eslint-env browser */
import {
	cache,
	nextChapter,
	postMsg,
	prevChapter,
	saveScroll,
} from "./vscodeApi.js";

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
const sheet = document.createElement("style");
sheet.className = "theme-sheet";

document.head.appendChild(sheet);

/** 滚动冗余区间 */
const scrollThreshold = 10;
export function initEl() {
	let _el = {
		main: document.querySelector(".main"),
		title: document.querySelector(".main .header .title"),
		// content: document.querySelector('.main .content'),
		get content() {
			return document.querySelector(".main .content");
		},
		nav: document.querySelector(".nav"),
		navTitle: document.querySelector(".nav .title"),
		navTime: document.querySelector(".nav .time"),
		sideNextBtns: document.querySelectorAll(".function-box .side-next-btn"),
		btn2: document.querySelector(".btn2"),
		sheet,
	};
	el = _el;
	return _el;
}

/** @returns {number} 获取主滚动区域的滚动高度 */
export let getScroll = () => el.main.scrollTop;
export let setScroll = (h) => el.main.scrollTo(0, h);

/**
 * 页面是否触底
 * @param {number} 用来判断的滚动高度,一般是不传,默认用当前页面滚动高度
 */
export function isPageEnd(curScroll = getScroll()) {
	// 总滚动高度
	const h = el.main.scrollHeight;
	// 当前滚动top+元素可视大小(元素大小)
	const curH = curScroll + el.main.clientHeight;
	// 如果距离小于scrollThreshold.就认为触底了
	return h - curH < scrollThreshold;
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
	let h =
		el.main.clientHeight -
		el.nav.clientHeight -
		50 * (cache.setting?.zoom || 1);
	// 最大值不能超过总滚动高度
	const newH = Math.min(cur + h * direction, el.main.scrollHeight);
	// setScroll(newH);
	el.main.scrollTo({
		left: 0,
		top: newH,
		// behavior:'auto'
		// behavior: 'smooth',
	});
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

export function prevPageOrChapter(event) {
	console.log("prevPageOrChapter");
	let flag = getScroll() < scrollThreshold;
	if (flag) {
		prevChapter();
		window.addEventListener(
			"showChapterAfter",
			function () {
				scrollScreen(1e10);
			},
			{ once: true }
		);
	}
	// 空格自带翻页效果
	else scrollScreen(-1, event);

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
/**
 * @desc: 格式化数字
 * @return: n > 10 [eg: 12] => 12 | n < 10 [eg: 3] => '03'
 * @param {string|number} n
 */
export function formatNumber(v) {
	const num = v.toString();
	return num[1] ? num : "0" + num;
}

export function updateHeaderTime() {
	// console.log('el?.navTime',el?.navTime);
	if (!el?.navTime) return;

	const oldTime = el?.navTime?.innerText;
	const date = new Date();
	const newTime = `${formatNumber(date.getHours() % 12)}:${formatNumber(
		date.getMinutes()
	)}`;
	if (newTime !== oldTime) el.navTime.innerText = newTime;
}

window.addEventListener("DOMContentLoaded", function () {
	initEl();
	// 时间显示
	handleBtn2Click();
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
			console.log("eventProperty copy", error);
		}
	}
	window.dispatchEvent(event);
}

/**
 * 迭代元素的所有父元素
 * @param {String} selector selectorText
 * @returns {CSSStyleRule|null} 父元素
 */
export function getStyleRule(selector) {
	let rules = el?.sheet?.sheet?.cssRules;
	console.log("getStyleRule", rules);
	// if (!rules) return null;
	for (var i = 0; i < rules?.length; i++) {
		if (rules[i].selectorText === selector) {
			return rules[i];
		}
	}
	return null;
}

window.onresize = function (e) {
	console.log("onresize", e);
	//innerWidth: 1920
	// console.log(isFullscreen());
	// document.body.requestFullscreen();
	updateBtn2Area();
};

const center = {
	// 家里电脑
	x: 0,
	y: 0,
	size: 0,
};
const isArea = (e) => {
	console.log(e.x, e.y, center);
	return (
		Math.abs(e.x - center.x) < center.size &&
		Math.abs(e.y - center.y) < center.size
	);
};
export const updateBtn2Area = (init) => {
	// 已经初始化,不重复初始化
	if (init && center.size) return;
	if (!el.btn2) return;

	let area = el.btn2.getBoundingClientRect();
	console.log(area);
	center.x = area.x + area.width / 2;
	center.y = area.y + area.width / 2;
	center.size = area.width / 2;
	console.log(center);
};

window.addEventListener("load", () => {
	updateBtn2Area(true);
	setTimeout(() => {
		updateBtn2Area(true);
	}, 100);
});

function handleBtn2Click() {
	console.log("handleBtn2Click", el?.btn2);
	if (!el?.btn2) return;

	// btn2.onclick
	document.addEventListener(
		"click",
		(e) => {
			console.log("document click", e);
			console.log(isArea(e));
			if (isArea(e)) {
				nextPageOrChapter();
				e.stopPropagation();
			}
		},
		true
	);
}

// function isFullscreen() {
// 	return (
// 		document.fullscreenElement ||
// 		document.webkitFullscreenElement ||
// 		document.mozFullScreenElement ||
// 		document.msFullscreenElement
// 	);
// }
