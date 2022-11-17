window.addEventListener('DOMContentLoaded', function () {
	// eslint-disable-next-line no-undef
	const vscode = acquireVsCodeApi();
	// 元素
	const el = {
		main: document.querySelector('.main'),
		title: document.querySelector('.main .header .title'),
		content: document.querySelector('.main .content'),
		navTitle: document.querySelector('.nav .title'),
	};

	let getScroll = () => el.main.scrollTop;
	let setScroll = h => el.main.scrollTo(0, h);

	// 本地缓存最新章节和样式设置
	let cache = {};
	let setting = {};
	// 当前章节的缓存名称
	let chapterName = '';
	// 渲染id,其实就是渲染次数自增,用于判断是否重新渲染了以便于重新加载尺寸信息等
	let renderId = 0;
	let fn = {
		undefined() {
			console.error('webView端找不到处理程序,无法执行');
		},
		/*设置一些公共设置,如行高,行间隔,字体大小等*/
		setting(data) {
			setCache('setting', data);
			setting = data;
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
		},
		/*显示章节*/
		showChapter(data) {
			// 拦截重复的显示
			if (data.title === (cache.showChapter && cache.showChapter.title)) {
				return;
			}
			chapterName = 'catch_' + data.title;
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
		readScroll(data) {
			// console.warn('readScroll', data);
			if (!data) return;
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
	let data = vscode.getState();
	if (data) {
		console.warn('是隐藏后的', data);
		for (var item in data) {
			fn[item](data[item]);
		}
	}
	/**
	 * 设置缓存 ,本来的vscode.setState是简单的对象.我自己封装一下成键值对
	 * 既然官方说了高性能,那么这样损耗应该不大(性价比高)
	 * @param {String} key 键
	 * @param {Object} value  值
	 */
	function setCache(key, value) {
		cache[key] = value;
		vscode.setState(cache);
	}

	/**
	 * @param {String} title
	 * @param {Array<String>} lines
	 */
	function render(title, lines) {
		el.title.innerText = title;
		el.navTitle.innerText = title;
		let list = el.content.children;
		el.content.style.display = 'none';
		if (list.length < lines.length) {
			addLine(lines.length - list.length);
		}
		var i = 0;
		// 比如不能再设置时获取属性,否则必须刷新(回流)
		// 循环添加数据
		for (; i < list.length; i++) {
			if (i < lines.length) {
				list[i].innerText = lines[i];
				list[i].style.display = undefined;
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

	/*********************************
		换章和其他需要和拓展交互的功能
	**********************************/
	window.onkeydown = function (e) {
		// console.log(e);
		switch (e.key) {
			//FIXME:手动处理tab事件
			// case 'Tab':
			// 	e.stopPropagation()
			// 	return false
			case 'ArrowRight': //下一章
				postMsg('chapterToggle', 'next');
				break;
			case 'ArrowLeft': //上一章
				postMsg('chapterToggle', 'prev');
				break;
			case 'ArrowDown': //向下翻页
			case 'Space':
				scrollScreen(1, e);
				break;
			case 'ArrowUp': //向上翻页
				scrollScreen(-1, e);
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
				// postMsg("chapterToggle", "next");
				postMsg('chapterToggle', 'prev');
				break;
			case 3:
				// postMsg("chapterToggle", "prev");
				postMsg('chapterToggle', 'next');
				break;
			default:
				break;
		}
	};
	// 双击右键下一章
	var rightBtnTime = 0;
	window.oncontextmenu = function () {
		var now = +Date.now();
		if (rightBtnTime + 500 > now) {
			postMsg('chapterToggle', 'next');
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
	/**
	 * 上下翻页(一个屏幕)
	 * @param {Number} direction 方向 1下 -1上
	 * @param {Event} event  用来阻止默认行为
	 */
	function scrollScreen(direction = 1, event) {
		event.preventDefault();
		// let cur = window.scrollY;
		let cur = getScroll();
		let h = document.documentElement.clientHeight - 60;
		setScroll(cur + h * direction);
		// window.scrollTo(0, cur + h * direction);
	}
	// 滚屏,滚轮相关
	{
		let scrollType = 0; // 0未滚动 1等待结束  2等待开始  3正在滚动
		let timer = {
			scroll: 0, // 滚屏用的计时器
			toggle: 0, // 换章用的计时器
		};
		let num = 0; // 当前滚动高度
		let h = 0; // 窗口高度
		let max = 0; // 窗口最大高度
		let lastScrollY = 0;

		let lastRenderId = -1;
		window.ondblclick = function () {
			// 用户手动触发的
			autoScrollScreen();
		};
		/**
		 * 自动滚屏
		 */
		function autoScrollScreen() {
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
			console.warn({ max, num, h });
			if (num > max - h) {
				scrollEnd();
			} else if (num > lastScrollY + 200) {
				// 每200高度,保存一次当前滚动高度
				lastScrollY = num;
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
				scrollType = 2;
				postMsg('chapterToggle', 'next');
				timer.toggle = setTimeout(() => {
					// 开始滚屏
					autoScrollScreen();
				}, setting.scrollStartTime);
			}, setting.scrollEndTime);
		}
		// 获取间隔时间
		function getIntervalTime() {
			let scrollSpeed = setting.scrollSpeed || 96;
			return Math.round(1000 / scrollSpeed);
		}
		/***************
		    监听滚动
		****************/
		{
			let el = document.querySelector('.zoom');
			let timer = 0;
			let scrollEndTimer = 0;
			function showZoom(size, zoom) {
				el.innerText = `${size}px ${(zoom * 100).toFixed(0)}%`;
				el.style.display = 'flex';
				el.style.opacity = 1;
				clearTimeout(timer);
				timer = setTimeout(() => {
					el.style.opacity = 0;
					timer = setTimeout(() => {
						el.style.display = 'none';
					}, 500);
				}, 1500);
			}
			//滚动滑轮触发scrollFunc方法
			document.onmousewheel = scrollFunc;
			function scrollFunc(e) {
				// 如果是ctrl+滚轮,则放大或缩小显示
				if (e.ctrlKey) {
					// 先计算出新的缩放比例
					let zoom = setting.zoom;
					let n = e.wheelDelta > 0 ? 0.1 : -0.1;
					zoom = +(zoom + n).toFixed(1);
					// 如果合法
					if (zoom >= 0.2 && zoom <= 5) {
						// 保存
						postMsg('zoom', zoom);

						setting.zoom = zoom;
						setCache('setting', setting);
						// 应用
						document.documentElement.style.fontSize = setting.rootFontSize * zoom + 'px';
						// 显示
						showZoom(setting.rootFontSize * zoom, zoom);
					}
					return;
				} else if (scrollType !== 0) {
					// 如果处于自动滚屏状态,则可以用这个进行滚屏,
					// 如果不处于自动滚屏状态,这样滚动会使其进入自动滚屏状态,也有可能与当前计时器逻辑相冲突
					scroll(e.wheelDelta * -1);
				} else {
					// 记录当前滚动高度,并存储
					clearTimeout(scrollEndTimer);
					scrollEndTimer = setTimeout(saveScroll, 300);
				}
				// if (e.wheelDelta > 0) { }
				// if (e.wheelDelta < 0) { }
			}
			// function scrollEnd() { saveScroll(); }
		}
	}

	function saveScroll(scroll = getScroll(), isPostMsg = true) {
		// setCache('saveScroll', { [chapterName]: scroll });
		// 这里需要被调用,所以缓存的方法名是读取 readCacheScroll
		setCache('readScroll', scroll);
		// setCache('readCacheScroll', { [chapterName]: scroll });
		// console.warn("save_Scroll", scroll);
		if (isPostMsg) {
			postMsg('saveScroll', { key: chapterName, value: scroll });
		}
	}

	// 发送消息
	function postMsg(type, data) {
		console.log('子页面-postMsg', type, data);
		//切换章节时,清除当前章节的缓存滚动高度
		if (type === 'chapterToggle') {
			saveScroll(0, false);
		}
		vscode.postMessage({ type, data });
	}
});
