import * as vscode from 'vscode';
const file = require("./file/file");

const path = require("path");
import * as config from './config';
const util = require('./util');
const { getState, setState } = require("./util");

let saveScroll = {};
/**
 * @type {vscode.ExtensionContext}
 */
let content;
/**
 * webview页面
 * @type {vscode.WebviewPanel}
 */
let panel;
/**
 * 创建
 */
 export async function createWebView() {
	const index = require("./index");
	content = index.getContent();
	// 存储panel相关文件的目录
	let url = path.join(content.globalStorageUri.fsPath, "static");
	panel = vscode.window.createWebviewPanel(
		"novel", // 标识webview的类型。在内部使用
		"阅读", // 标题
		vscode.ViewColumn.One, // 编辑器列以显示新的webview面板。
		{
			// enableCommandUris: true,
			// // 可以加载资源的路径
			// // localResourceRoots: [vscode.Uri.file(url),uri],
			localResourceRoots: [vscode.Uri.file(url)],
			// // 启用javascript
			enableScripts: true,
			// // 查找
			enableFindWidget: true,
			// 关闭时保留上下文,我这个当然不需要
			// retainContextWhenHidden: true,
		}
	);
	let webview = panel.webview;
	panel.iconPath=vscode.Uri.joinPath(util.getExtensionUri(),"/src/img/fish2.png")
	webview.html = await getWebviewContent(url);
	// 关闭事件
	panel.onDidDispose(onDidDispose, null, content.subscriptions);
	// 消息事件
	webview.onDidReceiveMessage(onMessage, null, content.subscriptions);
	// 初始化完成后,设置style
	initWebView();
}
// 初始化样式设置
function initWebView() {
	let t = config.get("readSetting",{});
	// config.set("readSetting.zoom", v);
	// t.zoom = t.zoom;
	//content.globalState.get("zoom", t.zoom);
	postMsg("setting", t);
	saveScroll = getState("saveScroll", {});
	// console.warn("initWebView",saveScroll);
	// postMsg("readScroll", saveScroll);
}

/**
 * 获取panel的内容
 * @return {Promise<String>}
 */
async function getWebviewContent(url) {
	let s = "";
	// 读取文件,显示
	s = await file.getWebViewHtml();
	// 替换某些特定的值(路径)
	s = s.replace(/(#csp)/g, (_m, _$1, $2) => {
		return panel.webview.cspSource;
	});
	// @ts-ignore
	s = s.replace(/(@)(.+?)/g, (_m, _$1, $2) => {
		console.warn(panel.webview.cspSource);
		return panel.webview.asWebviewUri(vscode.Uri.file(path.join(url, $2)));
	});
	return s;
}

/**
 * 显示某一章
 */
 export async function showChapter(title, list) {
	if (!panel) {
		// 初次显示webView,则需要初始化显示滚动高度
		await createWebView();
		await postMsg("showChapter", { title, list });
		await postMsg("readScroll", saveScroll);
		return;
	} else if (!panel.visible) {
		// 如果当前webView存在,并且被隐藏了,则显示
		panel.reveal();
	}
	await postMsg("showChapter", { title, list });
}
/**
 * 发送消息
 * @param {String} type 操作类型
 * @param {Object} data  数据
 */
async function postMsg(type, data) {
	await panel.webview.postMessage({ type, data });
}
/**************************************
			接收消息,以及处理
***************************************/
async function onDidDispose() {
	// 执行这个的时候webView已经不可用
	panel = null;
	console.log("已关闭panel");
}
/**
 * 对于webView消息的响应函数
 */
let fn = {
	chapterToggle(type) {
		const provider = require("./TreeViewProvider");
		try {
			provider[type + "Chapter"]();
		} catch (error) {
			console.error(error);
			console.log(type + "Chapter");
			console.log(provider);
			console.log(provider[type + "Chapter"]);
			vscode.window.showInformationMessage(`切换章节操作${type}不存在`);
		}
	},
	zoom(v) {
		config.set("readSetting.zoom", v);
	},
	/**
	 * 保存滚动高度
	 * @param {Object} data
	 * @param {String} data.key
	 * @param {Number} data.value
	 */
	saveScroll(data) {
		saveScroll[data.key] = data.value;
		setState("saveScroll", saveScroll);
	},
};
async function onMessage(e) {
	console.warn("message:  ", e);
	fn[e.type](e.data);
}
export async function closeWebView() {
	if (panel) {
		panel.dispose();
		panel = null;
	}
}
