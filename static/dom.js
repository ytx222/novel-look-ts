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
