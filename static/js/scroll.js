/* eslint-env browser */
/**
 * 负责滚动相关的逻辑
 * 比如双击自动滚屏,滚动后缓存高度等
 */
import {
	//
	getState,
	setCache,
	cache,
	saveScroll,
	postMsg,
	nextChapter,
} from './vscodeApi.js';
import { el, getScroll, getStyleRule, isPageEnd, setScroll } from './dom.js';
import { renderId } from './webView.js';

/**  0未滚动 1等待结束  2等待开始  3正在滚动 */
let scrollType = 0;
let timer = {
	scroll: 0, // 滚屏用的计时器
	toggle: 0, // 换章用的计时器
};
let num = 0; // 当前滚动高度
let h = 0; // 窗口高度
let max = 0; // 窗口最大高度

let lastRenderId = -1;
// window.ondblclick = function () {
// 	// 用户手动触发的
// 	autoScrollScreen();
// };
/**
 * 自动滚屏
 */
export function autoScrollScreen() {
	clearTimeout(timer.toggle);
	clearInterval(timer.scroll);
	// 如果当前非滚屏状态,则进入滚屏状态
	if (scrollType === 0 || scrollType === 2) {
		timer.scroll = setInterval(scroll, getIntervalTime());
		scrollType = 3;
		scroll(); // 直接执行一次,如果是触底时,可以直接初始化状态
	} else {
		scrollType = 0;
	}
}
// 问题是每多少时间向下移动1
// 这个时间如果高于10,则可能会产生滚动一卡一卡的感觉(视觉效果)
// 以人眼24帧为标准 72, 96, 120, 144, 168, 192
function scroll(v = 1) {
	// 检查更新尺寸信息,仅在初始化和重新渲染后才更新尺寸信息
	if (lastRenderId !== renderId) {
		max = el.main.scrollHeight;
		h = el.main.clientHeight;
	}

	num = getScroll() + v;
	setScroll(num);
	// console.warn({ max, num, h });
	if (num > max - h) {
		scrollEnd();
	} else if (num > cache.readScroll + 200) {
		// 每200高度,保存一次当前滚动高度
		console.warn('保存高度');
		saveScroll(num);
	}
}
function scrollEnd() {
	// 章节结束
	// 直接执行方法使其取消自动滚屏
	clearInterval(timer.scroll);
	clearTimeout(timer.toggle);
	scrollType = 1;
	timer.toggle = setTimeout(() => {
		// 下一章
		nextChapter();
		scrollRestart();
	}, cache.setting.scrollEndTime);
}
/** 章节结束后的重新开始 */
function scrollRestart() {
	scrollType = 2;
	timer.toggle = setTimeout(() => {
		// 开始滚屏
		autoScrollScreen();
	}, cache.setting.scrollStartTime);
}
window.addEventListener('chapterToggle', function () {
	if (scrollType !== 0) {
		console.warn('检测到章节切换时处于等待下一章状态=======');
		clearInterval(timer.scroll);
		clearTimeout(timer.toggle);
		scrollRestart();
	}
});
// 获取间隔时间
function getIntervalTime() {
	let scrollSpeed = cache.setting.scrollSpeed || 96;
	return Math.round(1000 / scrollSpeed);
}
/***************
	 缩放逻辑
****************/

/** @type {HTMLDivElement} */
let zoomEl = document.querySelector('.zoom');
let zoomTimer = 0;
let scrollEndTimer = 0;
// 隐藏zoom框
const hideZoom = () => {
	// zoomEl.style.opacity = 0;
	zoomEl.classList.remove('on');
	zoomEl.style.opacity = 0;
};
function showZoom(size, zoom) {
	zoomEl.innerText = `${size}px ${(zoom * 100).toFixed(0)}%`;
	zoomEl.style = 'display:flex;opacity:1;';
	zoomEl.classList.add('on');
	zoomEl.ontransitionend = () => {
		zoomEl.style.display = 'none';
	};
	clearTimeout(zoomTimer);
	zoomTimer = setTimeout(hideZoom, 1500);
}
//滚动滑轮触发scrollFunc方法
document.onmousewheel = scrollFunc;
function scrollFunc(e) {
	// 如果是ctrl+滚轮,则放大或缩小显示
	if (e.ctrlKey) {
		// 先计算出新的缩放比例
		let zoom = cache.setting.zoom;
		let n = e.wheelDelta > 0;
		let size = 0.1;
		if (zoom > 1.5 || (n && zoom >= 1.5)) size = 0.25;
		updateZoom(+(zoom + size * (n ? 1 : -1)).toFixed(5));
		return;
	} else if (scrollType !== 0) {
		console.log('e.wheelDelta', e.wheelDelta);
		// 如果处于自动滚屏状态,需要用这个进行滚屏,以
		scroll(e.wheelDelta * -1);
	} else {
		// 记录当前滚动高度,并存储
		// 这里的防抖,其实可以,但是没有太大的必要,因为性能损耗应该也没多少
		clearTimeout(scrollEndTimer);
		// setTimeout(() => {
		// 	console.log('滚轮事件-',isPageEnd());
		// }, 50);
		scrollEndTimer = setTimeout(saveScroll.bind(null, undefined, true, false), 300);
	}
}

let zoomSaveTimer;

function updateZoom(zoom) {
	// 判断值是否合法
	if (zoom < 0.4 || zoom > 10) {
		zoom = zoom > 10 ? 10 : 0.4;
		let oldZoom = cache.setting.zoom;
		if (zoom == oldZoom) return;
	}
	clearTimeout(zoomSaveTimer);
	zoomSaveTimer = setTimeout(() => postMsg('zoom', zoom), 600);
	// 保存
	cache.setting.zoom = zoom;
	setCache('setting', cache.setting);
	// 应用
	// document.documentElement.style.fontSize = cache.setting.rootFontSize * zoom + 'px';
	const rule = getStyleRule(':root:root');
	console.log(rule);
	rule.style = `--rootFontSize: ${rule.styleMap.get('--rootFontSize')}; --zoom: ${zoom};`;
	// 显示
	showZoom(cache.setting.rootFontSize * zoom, zoom);
}
