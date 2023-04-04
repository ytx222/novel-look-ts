import { ElementParentIterator } from './dom.js';
import { cache, postMsg } from './vscodeApi.js';

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
	};
	// document.querySelector('.custom-contextmenu');

	// 双击右键下一章
	var rightBtnTime = 0;
	document.oncontextmenu = function (e) {
		console.log(e);
		var now = +Date.now();
		// 300ms内连续两次鼠标右键点击,关闭右键弹窗并且下一章
		if (rightBtnTime + 300 > now) {
			e.preventDefault();
			postMsg('chapterToggle', 'next');
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
	function showContextMenu(x, y) {
		let w = el.contextmenu.offsetWidth;
		let h = el.contextmenu.offsetHeight;
		let pageW = document.body.clientWidth;
		let pageH = document.body.clientWidth;
		// 如果右(下)方位置不足,并且左(上)方有足够的位置,则移动
		if (pageW < x + w && x > w) x -= w;
		if (pageH < y + h && y > h) y -= h;
		el.contextmenu.style = `display: block;top:${y}px;left:${x}px;`;

		isShow = true;
		renderThemeContent();
	}

	function renderThemeContent() {
		let s = cache.setting?.theme?.custom
			?.map(
				(theme, i) => `
		<div class="contextmenu-item theme-item"
		style="${getThemeStyleRule(theme)}"
		data-id="${i + 1}"
		>
		<div class="icon ${cache.setting?.theme.use === i+1?'on':''}"></div>
		${theme.name}</div>`
			)
			?.join('');
		el.customThemeContainer.innerHTML = s;
		console.log(s);
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

	function addTheme() {
		console.warn('addTheme');
	}

	/**
	 * 点击主题项
	 * @param {HTMLDivElement} item
	 */
	function clickItem(item) {
		let i = item.dataset.id;
		postMsg('changeUseTheme', +i || 0);
	}

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

/**
 *获取主题的css样式,用于设置
 * @param {ThemeItem} theme
 * @returns
 */
export function getThemeStyleRule(theme) {
	return `--bg: ${theme.bg};
	--color: ${theme.color};
	--btnBg: ${theme.btnBg};
	--btnColor: ${theme.btnColor};
	--btnActive: ${theme.btnActive};
	--btnActiveBorder:${theme.btnActiveBorder};

	--navBg: ${theme.navBg || 'var(--bg)'} ;
	--textColor:  ${theme.textColor || 'var(--color)'} ;`;
}
