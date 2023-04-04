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
	nextPageOrChapter,
} from './dom.js';
import { autoScrollScreen } from './scroll.js';
import './contextmenu.js';
import { getThemeStyleRule } from './contextmenu.js';
/** 每次重新渲染(调用render方法)加1 */
export let renderId = 0;

const nextChapter = () => postMsg('chapterToggle', 'next');
const prevChapter = () => postMsg('chapterToggle', 'prev');

let themeSheetRuleIndex;

// 渲染id,其实就是渲染次数自增,用于判断是否重新渲染了以便于重新加载尺寸信息等
let fn = {
	undefined() {
		console.error('webView端找不到处理程序,无法执行');
	},
	/*设置一些公共设置,如行高,行间隔,字体大小等*/
	setting(data) {
		setCache('setting', data);
		let sheetEl = document.querySelector('style');
		// 这里多一个.body,以达到更高匹配级别
		sheetEl.sheet.insertRule(`.body .main .content div{
				text-indent: ${data.lineIndent}em;
				font-size:1rem;
		}`);
		document.documentElement.style.fontSize = data.rootFontSize * data.zoom + 'px';
		this.changeTheme(data.theme.use);
		document.body.classList.add('init');
		// window.focus()
	},
	/*显示章节*/
	showChapter(data) {
		// 拦截重复的显示
		if (data.title === (cache.showChapter && cache.showChapter.title)) {
			return;
		}
		console.warn('开始显示章节', data.title, cache, data);
		setCache('showChapter', data);
		render(data.title, data.list);
		// 初次渲染后,renderId 是1
		if (renderId > 1) {
			setScroll(0);
		}
	},
	// 只会被插件层调用
	readScroll(data) {
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
	changeTheme (index) {
		cache.setting.theme.use = index;
		const sheet = el.sheet.sheet;
		console.log({
			sheet,
			themeSheetRuleIndex,
			index,
		});
		// data.theme.use
		// 使用系统默认主题
		if (index !== 0) {
			const themes = cache.setting.theme.custom;
			const theme = themes[index - 1];
			console.log('使用主题', theme);

			const ruleContent = getThemeStyleRule(theme);
			console.log(ruleContent);
			// 使用自定义主题
			if (themeSheetRuleIndex !== undefined) sheet.cssRules[themeSheetRuleIndex].style = ruleContent;
			else {
				themeSheetRuleIndex = sheet.insertRule(`body.body{${ruleContent}}`);
				console.log(sheet.cssRules[themeSheetRuleIndex]);
			}
		} else if (themeSheetRuleIndex !== undefined) {
			sheet.cssRules[themeSheetRuleIndex].style = '';
		}
	},
};
/**
 * @param {String} title
 * @param {Array<String>} lines
 */
function render(title, lines) {
	// console.log('render111', lines);
	el.title.innerText = title;
	el.navTitle.innerText = title;
	el.navTitle.title = title;
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
function addLine(num) {
	// 因为前期肯定隐藏过了dom,这里不在隐藏
	for (var i = 0; i < num; i++) {
		el.content.appendChild(document.createElement('div'));
	}
}
window.addEventListener('DOMContentLoaded', function () {
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

	/*********************************
		换章和其他需要和拓展交互的功能
	**********************************/
	window.onkeydown = function (e) {
		console.log('KEY onkeyup ', e.key);
		const flag = e.altKey || e.shiftKey || e.ctrlKey;
		switch (e.key.toLowerCase()) {
			//FIXME:手动处理tab事件
			// case 'Tab':
			// 	e.stopPropagation()
			// 	return false
			case 'arrowright': //下一章
			case !flag && 'd':
				return nextChapter();
			case 'arrowleft': //上一章
			case !flag && 'a':
				return prevChapter();
			case 'arrowdown': //向下翻页
			case !flag && 's':
				return scrollScreen(1, e);
			case 'arrowup': //向上翻页
			case !flag && 'w':
				return scrollScreen(-1, e);
			//检查是否触底,如果触底,下一章,没有则向下
			// 空格是向下翻页,
			case ' ':
				return nextPageOrChapter(e);
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
				return prevChapter();
			case 3:
				return nextChapter();
		}
	};

	document.querySelector('.footer .btn-box .prev').onclick = prevChapter;
	document.querySelector('.footer .btn-box .next').onclick = nextChapter;
	document.querySelector('.nav button.prev').onclick = prevChapter;
	document.querySelector('.nav button.next').onclick = nextChapter;
	el.content.ondblclick = autoScrollScreen;
	el.sideNextBtns.forEach(e => (e.onclick = nextPageOrChapter));

	/**
	 * 这个东西,放哪里合适呢,
	 * scrollAntiShake里面包含了业务逻辑
	 */
	let scrollTimer;
	el.main.addEventListener('scroll', () => {
		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(scrollAntiShake, 50);
	});
	function scrollAntiShake() {
		console.log('scroll=====');

		if (isPageEnd()) {
			el.sideNextBtns.forEach(e => e.classList.add('right'));
		} else {
			el.sideNextBtns.forEach(e => {
				e.classList.remove('right');
			});
		}
	}
});

function copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}
