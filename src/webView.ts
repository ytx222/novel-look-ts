import * as vscode from 'vscode';
import * as file from './file/file';

import * as config from './config';
import { getState, setState, getExtensionUri, getStateDefault, sleep, formatTime } from './util/util';
import { command } from './TreeViewProvider';
import { getTargetStaticDir } from './file/file';

//FIXME: 机制需要测试!!
const scroll = new Map<string, number>();
type saveScrollItem = [string, number];
let content: vscode.ExtensionContext;

let panel: vscode.WebviewPanel | null = null;
type messageType = {
	type: string;
	data: any;
};

// TODO: 暂时放这里
let isZenMode = false;

let curChapterTitle = '';
let titleTimer: NodeJS.Timeout;

function updateTitle() {
	console.log('updateTitle', isZenMode, !!panel);
	if (!panel) return;
	if (isZenMode) {
		panel.title = `${formatTime()} ${curChapterTitle}`;
	} else if (panel?.title !== '阅读') {
		panel!.title = '阅读';
	}
}

/**
 * 显示某一章
 */
export async function showChapter(title: string, list: string[]) {
	if (!panel) {
		// 初次显示webView,则需要初始化显示滚动高度
		await createWebView();
		initWebView(title, list);

		return;
	} else if (!panel.visible) {
		// 如果当前webView存在,并且被隐藏了,则显示
		panel.reveal();
	}
	await postMsg('showChapter', { title, list });
}

/**
 * 创建
 */
export async function createWebView() {
	const { getContent } = await import('./index');
	content = getContent();
	// 存储panel相关文件的目录
	let uri = vscode.Uri.joinPath(content.globalStorageUri, getTargetStaticDir());

	panel = vscode.window.createWebviewPanel(
		'novel', // 标识webview的类型。在内部使用
		'阅读', // 标题
		vscode.ViewColumn.Active, // 编辑器列以显示新的webview面板。
		{
			// enableCommandUris: true,
			// // 可以加载资源的路径
			// // localResourceRoots: [vscode.Uri.file(url),uri],
			localResourceRoots: [uri],
			// // 启用javascript
			enableScripts: true,
			// // 查找
			enableFindWidget: true,
			// 关闭时保留上下文,我这个当然不需要
			// retainContextWhenHidden: true,
		}
	);
	let webview = panel.webview;
	panel.iconPath = vscode.Uri.joinPath(getExtensionUri(), '/img/fish2.png');
	webview.html = await getWebviewContent(uri);
	// 关闭事件
	panel.onDidDispose(onDidDispose, null, content.subscriptions);
	// 消息事件
	webview.onDidReceiveMessage(onMessage, null, content.subscriptions);
	// 初始化完成后,设置style
	// initWebView();
	// 此方法结束后会继续执行showChapter
}
// 初始化样式设置
async function initWebView(title: string, list: string[]) {
	let data = getStateDefault<scrollInfo>('saveScroll', { key: '', value: 0 });
	console.log('initWebView data', data);
	scroll.set(data.key, data.value);

	let readSetting = config.get('readSetting', {});
	let themeSetting = config.get('theme', {});
	let setting = {
		...readSetting,
		theme: themeSetting,
	};
	console.log('setting', setting);
	await postMsg('showChapter', { title, list });
	await postMsg('readScroll', scroll.get('catch_' + title) || 0);
	await postMsg('setting', setting);

	//FIXME:

	// console.warn("initWebView",saveScroll);
	// postMsg("readScroll", saveScroll);
}

/**
 * 获取panel的内容
 * @return {Promise<String>}
 */
async function getWebviewContent(uri: vscode.Uri) {
	let s = '';
	// 读取文件,显示
	s = await file.getWebViewHtml();
	// 替换某些特定的值(路径)
	s = s.replace(/(#csp)/g, (_m, _$1, $2) => {
		return panel!.webview.cspSource;
	});
	// @ts-ignore
	s = s.replace(/(@)(.+?)/g, (_m, _$1, $2) => {
		// console.warn(panel!.webview.cspSource);
		return panel!.webview.asWebviewUri(vscode.Uri.joinPath(uri, $2));
	});
	return s;
}

/**
 * 发送消息
 * @param {String} type 操作类型
 * @param {Object} data  数据
 */
async function postMsg(type: string, data: any) {
	console.log('postMsg---', type, data);
	// 当钩子用了
	if (type === 'showChapter') curChapterTitle = data.title;
	try {
		//FIXME: 删除这里的await 或者限制最长50ms? ""
		// FIXME: message id?
		await Promise.race([
			// 发送消息
			panel!.webview.postMessage({ type, data }),
			// 最多等待10ms
			sleep(5),
		]);
		// vscode.window
	} catch (error) {
		console.log(1111);
		console.error(error);
	}
}
/**************************************
			接收消息,以及处理
***************************************/
async function onDidDispose() {
	// 执行这个的时候webView已经不可用
	panel = null;
	console.log('已关闭panel');
}

/**
 * 类型,只支持上下 效果是切换上下章
 */
type chapterToggleType = 'next' | 'prev';
/**
 * 对于webView消息的响应函数
 */
// let fn = new Map<string, Function>([
// 	[
// 		'chapterToggle',
// 		function chapterToggle(type: chapterToggleType) {
// 			const provider = require('./TreeViewProvider');
// 			try {
// 				provider[type + 'Chapter']();
// 			} catch (error) {
// 				console.error(error);
// 				console.log(type + 'Chapter');
// 				console.log(provider);
// 				console.log(provider[type + 'Chapter']);
// 				vscode.window.showInformationMessage(`切换章节操作${type}不存在`);
// 			}
// 		},
// 	],
// ]);

type scrollInfo = {
	key: string;
	value: number;
};
let fn: {
	[key in string]: Function;
} = {
	chapterToggle(type: chapterToggleType) {
		console.log('chapterToggle执行', type);
		try {
			if (type === 'next') {
				command.nextChapter();
			} else {
				command.prevChapter();
			}
		} catch (error) {
			console.error(error);
			console.log(type + 'Chapter');
			console.log(command);
			// console.log(command[type + 'Chapter']);
			vscode.window.showInformationMessage(`切换章节操作${type}不存在`);
		}
	},
	zoom(v: number) {
		config.set('readSetting.zoom', v);
	},
	/**
	 * 保存滚动高度
	 */
	saveScroll(data: scrollInfo) {
		// key之前是章名,现在改成书名,因为在一本书中切换章节没有意义保存
		// scroll.set(data.key, data.value);

		scroll.set(data.key, data.value);
		setState('saveScroll', data);
	},
	/** 切换禅模式 */
	toggleZenMode({ onlyNotice = false }) {
		if (onlyNotice) {
			vscode.commands.executeCommand('workbench.action.toggleZenMode');
		}
		console.warn('toggleZenMode');
		isZenMode = !isZenMode;
		if (isZenMode) {
			titleTimer = setInterval(updateTitle, 1000);
		} else {
			clearInterval(titleTimer);
		}
	},
	/**
	 * 更改使用的主题
	 */
	changeUseTheme(data: number) {
		// key之前是章名,现在改成书名,因为在一本书中切换章节没有意义保存
		// scroll.set(data.key, data.value);

		// scroll.set(data.key, data.value);
		// setState('saveScroll', data);
		config.set('theme.use', data);
		postMsg('changeTheme', data);
	},
	/**
	 * 编辑主题
	 */
	editTheme(data: scrollInfo) {
		// key之前是章名,现在改成书名,因为在一本书中切换章节没有意义保存
		// scroll.set(data.key, data.value);
		// scroll.set(data.key, data.value);
		// setState('saveScroll', data);
	},
};
async function onMessage(e: messageType) {
	// TODO: 日志
	console.log('收到webView message:  ', e);
	fn[e.type]?.(e.data);
}
export async function closeWebView() {
	if (panel) {
		panel.dispose();
		panel = null;
	}
}
