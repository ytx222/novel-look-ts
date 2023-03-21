/* eslint-env browser */
import { log, sleep } from './util.js';

import {
	//
	getState,
	setCache,
	cache,
	saveScroll,
	postMsg,
} from './vscodeApi.js';
import {
	//
	el,
	getScroll,
	setScroll,
	isPageEnd,
	scrollScreen,
	nextPageOrChapter
} from './dom.js';
import { autoScrollScreen } from './scroll.js';

/** 每次重新渲染(调用render方法)加1 */
export let renderId = 0;

window.addEventListener('DOMContentLoaded', function () {
	// 渲染id,其实就是渲染次数自增,用于判断是否重新渲染了以便于重新加载尺寸信息等
	let fn = {
		undefined () {
			console.error('webView端找不到处理程序,无法执行');
		},
		/*设置一些公共设置,如行高,行间隔,字体大小等*/
		setting (data) {
			setCache('setting', data);
			let sheetEl = document.querySelector('style');
			// 这里多一个.body,以达到更高匹配级别
			sheetEl.sheet.insertRule(`.body .main .content div{
					text-indent: ${data.lineIndent}em;
					font-size:1rem;
			}`);
			document.documentElement.style.fontSize = data.rootFontSize * data.zoom + 'px';
			// sheetEl.sheet.insertRule(`html{
			// 	font-size:${data.rootFontSize * data.zoom}px !important;
			// }`);
			document.body.classList.add('init');
			// window.focus()
		},
		/*显示章节*/
		showChapter (data) {
			// 拦截重复的显示
			if (data.title === (cache.showChapter && cache.showChapter.title)) {
				return;
			}
			console.warn('开始显示章节', data.title, cache?.showChapter?.title, data);
			setCache('showChapter', data);
			render(data.title, data.list);
			// 初次渲染后,renderId 是1
			if (renderId > 1) {
				setScroll(0);
			}
			// console.warn(renderId);
			// console.warn('开始显示章节', data.title, cache.showChapter.title);
		},
		// 只会被插件层调用
		readScroll (data) {
			// console.warn('readScroll', data);
			if (!data) {
				return;
			}
			// 在刚刚调用render,还没有实际渲染的时候,
			// 滚动到超出目前的高度,是不生效的
			// 这里只需要一个渲染后的时机,settimeout和requestAnimationFrame是差不多的
			requestAnimationFrame(setScroll.bind(null, data));
			saveScroll(data, false);
		},
	};
	window.addEventListener('message', function (e) {
		let data = e.data.data;
		let type = e.data.type;
		console.log('子页面-message', type, data);
		fn[type](data);
		// postMsg('type'+'_end')
	});
	/**********************************
		  判断是否是隐藏后重新显示
	 **********************************/
	let data = getState();
	if (data) {
		console.warn('是隐藏后的', data);
		for (var item in data) {
			fn[item](data[item]);
		}
	}

	/**
	 * @param {String} title
	 * @param {Array<String>} lines
	 */
	function render (title, lines) {
		console.log('render111', lines);
		el.title.innerText = title;
		el.navTitle.innerText = title;
		let list = el.content.children;
		el.content.style.display = 'none';
		if (list.length < lines.length) {
			addLine(lines.length - list.length);
		}

		// 比如不能再设置时获取属性,否则必须刷新(回流)
		// 循环添加数据
		for (let i = 0; i < list.length; i++) {
			if (i < lines.length) {
				list[i].innerText = lines[i];
				list[i].dataset.i = i;
				list[i].style = '';
			} else {
				list[i].style.display = 'none';
			}
		}

		el.content.style.display = 'block';
		// 修改渲染id,告诉其他人我重新渲染了
		renderId++;
		console.log('子页面render', renderId);
	}
	/**
	 * 在行不够用的情况下添加行
	 */
	function addLine (num) {
		// 因为前期肯定隐藏过了dom,这里不在隐藏
		for (var i = 0; i < num; i++) {
			el.content.appendChild(document.createElement('div'));
		}
	}

	/*********************************
		换章和其他需要和拓展交互的功能
	**********************************/
	window.onkeydown = function (e) {

		console.log('KEY onkeyup ', e.key);
		switch (e.key.toLowerCase()) {
			//FIXME:手动处理tab事件
			// case 'Tab':
			// 	e.stopPropagation()
			// 	return false
			case 'arrowright': //下一章
			case !e.altKey && 'd':
				postMsg('chapterToggle', 'next');
				break;
			case 'arrowleft': //上一章
			case !e.altKey && 'a':
				postMsg('chapterToggle', 'prev');
				break;
			case 'arrowdown': //向下翻页

			case !e.altKey && 's':
				scrollScreen(1, e);
				break;
			case 'arrowup': //向上翻页
			case !e.altKey && 'w':
				scrollScreen(-1, e);
				break;
			//检查是否触底,如果触底,下一章,没有则向下
			// 空格是向下翻页,
			case ' ':
				// e.preventDefault();
				// console.log('preventDefault');

				nextPageOrChapter(e)
				break;
			case '.':
				// 多判断一下是不是数字键盘的.
				if (e.code === 'NumpadDecimal') {
					let t = Date.now();
					let count = 60;
					let maxCount = count * 0.33;
					const fn = () => {
						let v = 5 * Math.min(count / maxCount, 1) * 1.05;
						console.log(v, count / maxCount);
						setScroll(getScroll() + v);
						if (count--) {
							requestAnimationFrame(fn);
						} else {
							console.log('动画完成,时间', Date.now() - t);
							saveScroll();
						}
					};
					fn();
				}

				break;
			case 'PageUp':
			case 'PageDown':
			case 'Home':
			case 'End':
				break;
			default:
				break;
		}
	};
	window.onmouseup = function (e) {
		// MouseEvent.button MDN https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
		// 0：按下主按钮，通常是向左按钮或未初始化状态
		// 1：按下辅助按钮，通常是滚轮按钮或中间按钮（如果有）
		// 2：按下辅助按钮，通常是右键
		// 3：第四个按钮，通常是“浏览器后退”按钮
		// 4：第五个按钮，通常是“浏览器前进”按钮
		switch (e.button) {
			case 1:
			case 4:
				postMsg('chapterToggle', 'prev');
				break;
			case 3:
				postMsg('chapterToggle', 'next');
				break;
			default:
				break;
		}
	};
	// 双击右键下一章
	var rightBtnTime = 0;
	document.oncontextmenu = function (e) {
		var now = +Date.now();
		if (rightBtnTime + 500 > now) {
			// 500ms内连续两次鼠标右键点击,关闭右键弹窗并且下一章
			postMsg('chapterToggle', 'next');
			return false;
		}
		rightBtnTime = now;
	};

	document.querySelector('.footer .btn-box .prev').onclick = () => postMsg('chapterToggle', 'prev');
	document.querySelector('.footer .btn-box .next').onclick = function () {
		// 操作后清除光标,好像没有意义
		// console.log(this);
		// this.blur()
		postMsg('chapterToggle', 'next');
	};
	document.querySelector('.nav button.prev').onclick = () => postMsg('chapterToggle', 'prev');
	document.querySelector('.nav button.next').onclick = () => postMsg('chapterToggle', 'next');
	document.querySelector('.nav').ondblclick = function (e) {
		console.log('nav---ondblclick');
		e.stopPropagation();
		return false;
	};
	el.content.ondblclick = autoScrollScreen


	el.sideNextBtns.forEach(e => e.onclick = nextPageOrChapter)





	/**
	 * 这个东西,放哪里合适呢,
	 * scrollAntiShake里面包含了业务逻辑
	 */
	let scrollTimer
	el.main.addEventListener('scroll', () => {
		clearTimeout(scrollTimer)
		scrollTimer = setTimeout(scrollAntiShake, 50);
	})
	function scrollAntiShake () {
		console.log('scroll=====');

		if (isPageEnd()) {
			el.sideNextBtns.forEach(e => e.classList.add('right'))
		} else {
			el.sideNextBtns.forEach(e => {
				e.classList.remove('right')
			})
		}
	}

});

function copy (obj) {
	return JSON.parse(JSON.stringify(obj));
}
