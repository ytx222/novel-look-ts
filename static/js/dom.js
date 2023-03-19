/* eslint-env browser */
window.addEventListener('DOMContentLoaded', function () {
	el = {
		main: document.querySelector('.main'),
		title: document.querySelector('.main .header .title'),
		// content: document.querySelector('.main .content'),
		get content() {
			return document.querySelector('.main .content');
		},
		nav: document.querySelector('.nav'),
		navTitle: document.querySelector('.nav .title'),
	};
});

/**
 * @type {WebviewElements}
 */
export let el;

export let getScroll = () => el.main.scrollTop;
export let setScroll = h => el.main.scrollTo(0, h);

/**
	 * 页面是否触底
	 */
export function isPageEnd() {
	const h = el.main.scrollHeight;
	const curH = getScroll() + el.main.clientHeight;
	// 如果距离小于10.就认为触底了
	return h - curH < 10;
}

/**
	 * 上下翻页(一个屏幕)
	 * @param {Number} direction 方向 1下 -1上
	 * @param {Event} event  用来阻止默认行为
	 */
export function scrollScreen(direction = 1, event) {
	event.preventDefault();
	// let cur = window.scrollY;
	let cur = getScroll();
	let h = document.documentElement.clientHeight - el.nav.clientHeight - 50 * (setting?.zoom || 1);
	setScroll(cur + h * direction);
}
