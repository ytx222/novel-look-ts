import { ElementParentIterator ,dispatchCustomEvent} from './dom.js';
import { cache, nextChapter, postMsg, setCache } from './vscodeApi.js';
import { changeTheme } from './webView.js';
import { updateZoom } from './scroll.js';

let isShow = false;
/**
 * 本页面的元素相关逻辑稍微复杂点,自己维护吧
 * 开发时方便起见代码先写dom加载完成事件里
 */
window.addEventListener('DOMContentLoaded', function () {
	/** @type { Record<string,HTMLDivElement> } */
	const el = {
		contextmenu: document.querySelector('.custom-contextmenu'),
		customThemeContainer: document.getElementById('customThemeContainer'),
		themeContainer: document.getElementById('themeContainer'),
		zenModeButton: document.querySelector('.contextmenu-item.zen-mode'),
		systemTheme: this.themeContainer.querySelector('.system-theme'),

		scrollSpeedInput: document.getElementById('scroll-speed-input'),
		zoomInput: document.getElementById('zoom-input'),
		// turnScreenButton: document.querySelector('.contextmenu-item.turn-screen'),
		turnScreenInput: document.getElementById('turn-screen'),
	};
	// document.querySelector('.custom-contextmenu');

	// 双击右键下一章
	var rightBtnTime = 0;
	document.oncontextmenu = function (e) {
		console.log(e);
		var now = Date.now();
		// 300ms内连续两次鼠标右键点击,关闭右键弹窗并且下一章
		if (rightBtnTime + 300 > now) {
			e.preventDefault();
			nextChapter();
			rightBtnTime = 0;
		} else if (isShow) {
			// 在显示状态中,则隐藏
			hideContextMenu();
		} else {
			showContextMenu(e.pageX, e.pageY);
		}
		rightBtnTime = now;
		return false;
	};

	/**
	 * 显示右键菜单
	 * @param {number} x
	 * @param {number} y
	 */
	showContextMenu = (x, y) => {
		console.warn('showContextMenu', { isShow, x });
		// 如果当前ContextMenu处于显示状态,则允许通过不传递x,y(坐标)来实现重新渲染
		if (!isShow && x !== undefined) {
			el.contextmenu.style = `display: block;`;
			let w = el.contextmenu.offsetWidth;
			let h = el.contextmenu.offsetHeight;
			let pageW = document.body.clientWidth;
			let pageH = document.body.clientHeight;
			const direction = cache.setting?.screenDirection || 1;
			// 在各种旋转状态时,修正坐标
			if (!(direction & 1)) {
				// 横着的
				[pageW, pageH] = [pageH, pageW];
				// [w, h] = [h, w];
				[x, y] = [y, x];
			}
			if (direction === 2) {
				y = pageW - y ;
			}
			if (direction === 3) {
				x = pageW - x ;
				y = pageH - y ;
			}
			if (direction === 4) {
				x = pageH - x ;
			}
			if (!(direction & 1)) {
				// 横着的,判断时x需要和h对比,y和w对比
				// 这里将pageW和pageH反过来
				[pageW, pageH] = [pageH, pageW];
			}
			// console.log({ x, y, w, h, pageW, pageH });
			// console.log({x,y,w,h,pageW,pageH});
			// 如果右(下)方位置不足,并且左(上)方有足够的位置,则移动
			if (pageW < x + w && x > w) x -= w;
			if (pageH < y + h && y > h) y -= h;
			el.contextmenu.style = `display: block;top:${y || 0}px;left:${x || 0}px;`;
			isShow = true;
		}
		renderThemeContent();
	};

	function renderThemeContent() {
		// 使用的主题的下标
		const use = cache.setting?.theme.use - 1;
		const themes = cache.setting?.theme?.custom || [];
		let themeHtml = themes.map(
			(theme, i) => `
		<div class="contextmenu-item theme-item"
		style="${getThemeStyleRule(theme)}"
		data-id="${i + 1}"
		>
		<div class="icon ${use === i ? 'on' : ''}"></div>
		${theme.name}</div>`
		);
		// 更新当前使用的主题
		if (!~use /** use == -1 */) {
			console.warn(el.systemTheme);
			el.systemTheme.querySelector('.icon')?.classList.add('on');
		} else {
			el.systemTheme.querySelector('.icon')?.classList.remove('on');
		}
		// 更新滚动速度,zoom等

		el.scrollSpeedInput.value = cache.setting.scrollSpeed;
		el.zoomInput.value = cache.setting.zoom;
		el.turnScreenInput.value = cache.setting.screenDirection;

		let s = themeHtml?.join('');
		el.customThemeContainer.innerHTML = s;
	}

	el.themeContainer.onclick = function (e) {
		console.log(e);
		console.warn(e);
		for (const item of ElementParentIterator(e.target)) {
			console.log(item);
			if (item === el.themeContainer) return;
			// if (item.classList.contains("remove-icon"))
			//     return void deleteItem(item.parentElement);
			if (item.classList.contains('add-theme')) return addTheme();
			if (item.classList.contains('theme-item')) return void clickItem(item);
		}
	};
	el.scrollSpeedInput.onchange = inputChange;
	el.zoomInput.onchange = inputChange;
	el.turnScreenInput.onchange = inputChange;

	function inputChange (e) {
		let isMsg = true;
		//
		console.warn(e);
		let target = e.target;
		let value = target.value;
		let name = target.name;
		// 判断value是否合法
		if (name === 'zoom') {
			// 如果不合法
			// if (value < 0.4 || value > 10) {
			// 	value = value > 10 ? 10 : 0.4;
			// 	target.value = value;
			// 	return;
			// }

			return updateZoom(value);
		}
		if (name === 'screenDirection') {
			isMsg = false;
			if (!['1', '2', '3', '4'].includes(value)) {
				return screenDirection
			}
			document.body.className=`body init screenDirection-${value}`
			// window.postMessage({})
			// setTimeout(() => {
			// 	dispatchCustomEvent('message', { data:{type: 'screenDirection', }})
			// })


		}
		console.log({ value, name });
		const newSetting = { ...cache.setting, [name]: +value };
		console.log({ newSetting });
		setCache('setting', newSetting);
		isMsg && postMsg('updateReadSetting', { key: `readSetting.${name}`, value: +value });
	}

	function addTheme() {
		console.warn('addTheme');
	}

	/**
	 * 点击主题项
	 * @param {HTMLDivElement} item
	 */
	function clickItem(item) {
		let i = item.dataset.id;
		const use = +i || 0;
		postMsg('changeUseTheme', use);
		// 更新主题
		changeTheme(use, true);
		// 更新menu
		showContextMenu();
		// 缓存数据
		// setCache('changeTheme', { ...cache.changeTheme, use });
		cache.setting.theme.use = use;
		setCache('setting', cache.setting);
	}

	/**
	 * 主题之外的其他项目的处理
	 */
	el.zenModeButton.onclick = function () {
		// 进入禅模式
		postMsg('toggleZenMode');
	};

	// el.turnScreenButton.onclick = function () {
	// 	// 进入禅模式
	// 	// postMsg('toggleZenMode');
	// };


	/** 隐藏menu相关逻辑 */
	function hideContextMenu() {
		if (!isShow) return;
		isShow = false;
		el.contextmenu.style = '';
	}
	document.body.addEventListener('click', hideContextMenu);
	el.contextmenu.addEventListener('click', e => {
		e.stopPropagation();
	});
	// window.addEventListener('blur', hideContextMenu);
});

export let showContextMenu = (x, y) => {
	throw new Error('webview=>contextMenu=>showContextMenu uninitialized ');
};

/**
 *获取主题的css样式,用于设置
 * @param {ThemeItem} theme
 * @returns
 */
export function getThemeStyleRule(theme) {
	let s = `--bg: ${theme.bg};
	--color: ${theme.color};
	--btnBg: ${theme.btnBg};
	--btnColor: ${theme.btnColor};
	--btnActive: ${theme.btnActive};
	--btnActiveBorder:${theme.btnActiveBorder};

	--navBg: ${theme.navBg || 'var(--bg)'} ;
	--textColor:  ${theme.textColor || 'var(--color)'} ;`;

	// theme.color
	if (isHexColor(theme.bg)) {
		s += ` --bg-rgb:${hexToRGB(theme.bg).join(',')}; `;
	}
	// theme.color
	if (isHexColor(theme.color)) {
		s += ` --color-rgb:${hexToRGB(theme.color).join(',')}; `;
	}
	return s;
}

/**
判断一个字符串是16进制色值 */
function isHexColor(str) {
	// 使用正则表达式匹配16进制颜色值的格式
	const hexColorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
	return hexColorPattern.test(str);
}

function hexToRGB(hex) {
	// 去除前缀 #
	hex = hex.replace(/^#/, '');
	// 提取RR, GG, BB分量
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);

	// 返回分量值
	return [r, g, b];
}
