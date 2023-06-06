/**
 * file不提供工具方法,只提供和文件相关的,工具方法的封装调用
 */

import * as vscode from 'vscode';
import * as util from './fileUtil';
import * as config from '../config';
import { getDir } from './fileUtil';

import { exec } from 'child_process';
import { closeWebView, showChapter } from '../webView';

const staticDir = '/static/';
// export const targetStaticDir = '/static/2.0.7';
export const getTargetStaticDir = () => {
	// 动态获取当前版本号
	return `/static/${context.extension.packageJSON.version}${config.env === 'dev' ? '.dev' : ''}`;
};

let uri: vscode.Uri;

let _fs: vscode.FileSystem;
// /**
//  * @type {vscode.ExtensionContext}
//  */
let context: vscode.ExtensionContext;
/**
 * 初始化
 */
export async function init(_context: vscode.ExtensionContext): Promise<vscode.Uri[]> {
	// console.warn("init----file");
	// 初始化变量
	context = context || _context;
	uri = uri || context.globalStorageUri;
	_fs = _fs || vscode.workspace.fs;
	// 先创建一遍,如果已存在,不会做操作
	await _fs.createDirectory(uri);
	return await getBookList();
}

/**
 * 获取书架中书的列表
 * @returns
 */
export async function getBookList(): Promise<vscode.Uri[]> {
	return await util.readDir(uri, true);
}

/**
 * 获取webView的html内容
 * @returns
 */
export async function getWebViewHtml() {
	// 拓展安装目录 里的静态文件目录()
	const dirSrc = vscode.Uri.joinPath(context.extensionUri, staticDir);
	// 要拷贝到的地址的目录
	const targetDirSrc = vscode.Uri.joinPath(uri, getTargetStaticDir());
	const file = vscode.Uri.joinPath(dirSrc, 'webView.html');
	// 开发环境,始终从拓展目录(开发目录)拷贝一份最新的文件
	// 正式环境,则判断文件不存在时拷贝一份
	if (config.env === 'dev' || !(await util.isDir(targetDirSrc))) {
		await copyDir(dirSrc, targetDirSrc);
	}

	return await util.readFile(file);
}

async function refreshStaticFile() {
	// 拓展安装目录()
	const dirSrc = vscode.Uri.joinPath(context.extensionUri, staticDir);
	// 要拷贝到的地址的目录
	const targetDirSrc = vscode.Uri.joinPath(uri, getTargetStaticDir());
	await copyDir(dirSrc, targetDirSrc);
	// vscode.window.showInformationMessage('刷新完成');
	console.log('刷新完成');

	// 重启视图
	closeWebView();
	vscode.commands.executeCommand('novel-look.openWebView');
}

/**
 * 复制文件夹
 * @param src 源
 * @param dist 目标
 */
async function copyDir(src: vscode.Uri, dist: vscode.Uri) {
	// 复制文件夹的逻辑
	let files = await util.readDir(src);
	// console.log('copyDir files', files);
	// console.warn('=========');
	// 这里文件不多,没有必要用多进程同步进行,for循环单进程读写文件即可
	for (var i = 0; i < files.length; i++) {
		// console.log(files[i]);
		// 目标文件的路径,可能是文件名(index.html),或者相对地址(/js/a.js)
		const filePath = files[i].path.replace(src.path, '');
		let toFileUrl = vscode.Uri.joinPath(dist, filePath);
		let s = await util.readFile(files[i]);
		// console.log(s);
		await util.writeFile(toFileUrl, s, true);
	}
}
/**
 * 打开资源管理器
 * @param {*} url
 */
function openExplorer(url = uri.fsPath) {
	exec('explorer.exe /e,"' + url + '"');
}

/**
 * 打开资源管理器-webView文件所在的目录
 */
function openWebViewDir() {
	let url = vscode.Uri.joinPath(uri, staticDir).fsPath;
	exec('explorer.exe /e,"' + url + '"');
}

export const command = {
	openWebViewDir,
	openExplorer,
	refreshStaticFile,
};

export function getUrl() {
	return uri;
}

/** 读取文件 */
// export const readFile = util.readFile;
export { readFile, getFileName } from './fileUtil';
/** 获取文件名称 */
// export const getFileName = util.getFileName;
