/**
 * file不提供工具方法,只提供和文件相关的,工具方法的封装调用
 */

import * as vscode from 'vscode';
import * as util from './fileUtil';
import * as config from '../config';

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
	const dirSrc = vscode.Uri.joinPath(uri, '/static/');
	// let file= vscode.Uri.file
	const file = vscode.Uri.joinPath(dirSrc, 'webView.html');
	// 测试环境的话,不使用拓展工作路径的
	console['warn']('isDev:', config.env);

	if (config.env === 'dev') {
		await copyDir(vscode.Uri.joinPath(context.extensionUri, '/static/'), dirSrc);
		return await util.readFile(file);
	}
	try {
		return await util.readFile(file);
	} catch (error) {
		await copyDir(vscode.Uri.joinPath(context.extensionUri, '/static/'), dirSrc);
		return await util.readFile(file);
	}
}

/**
 * 复制文件夹
 * @param src 源
 * @param dist 目标
 */
async function copyDir(src: vscode.Uri, dist: vscode.Uri) {
	// console.warn('复制文件夹',src,dist);
	// 复制文件夹的逻辑
	let files = await util.readDir(src);
	console.log('files', files);
	// 这里文件不多,没有必要用多进程同步进行,for循环单进程读写文件即可
	for (var i = 0; i < files.length; i++) {
		const fileName = util.getFileName(files[i], true);
		// console.log(fileName);
		let toFileUrl = vscode.Uri.joinPath(dist, fileName);
		// console.log('toFileUrl',toFileUrl);
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
	var exec = require('child_process').exec;
	exec('explorer.exe /e,"' + url + '"');
}

/**
 * 打开资源管理器-webView文件所在的目录
 */
function openWebViewDir() {
	let url = vscode.Uri.joinPath(uri, '/static/').fsPath;
	var exec = require('child_process').exec;
	exec('explorer.exe /e,"' + url + '"');
}

export const command = {
	openWebViewDir,
	openExplorer,
};

export function getUrl() {
	return uri;
}

/** 读取文件 */
export const readFile = util.readFile;
/** 获取文件名称 */
export const getFileName = util.getFileName;
