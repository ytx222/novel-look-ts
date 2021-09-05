/**
 * 提交关于操作文件的,可复用的代码
 */

const path = require('path');
let _fs = vscode.workspace.fs;

const Uri = vscode.Uri;
import * as config from './../config';
import * as vscode from 'vscode';
import * as file from './file';

import encoding from './encoding/index';

/** vscode返回的目录类型 */
type dir = [string, vscode.FileType];
// 没啥好名字
// const encoding = require('./encoding/index');

let ignoreDir = config.get<String[]>('ignoreDir', []);
let ignoreFileName = config.get<String[]>('ignoreFileName', []);
let novelName = new RegExp(config.get('match.novelName', ''));


/**
 * 获取一个目录下的所有可能的电子书文件
 * @param uri 地址
 * @param isFilter 是否筛选
 * @param root 是否是本次递归调用的第一次
 * @returns 地址列表
 */
export async function readDir(uri: vscode.Uri, isFilter: boolean = false, root = true): Promise<vscode.Uri[]> {
	// 每次递归调用时只获取一次
	if (root) {
		ignoreDir = config.get<String[]>('ignoreDir', []);
		ignoreFileName = config.get<String[]>('ignoreFileName', []);
		novelName = new RegExp(config.get('match.novelName', ''));
	}
	// 所有目录项
	const items: dir[] = await getDir(uri);
	console.warn(items);
	let arr: vscode.Uri[] = [];
	for (let index = 0; index < items.length; index++) {
		const [name, type] = items[index];
		//如果是文件夹,
		if (type === vscode.FileType.Directory) {
			// 如果不过滤 或者过滤并且满足条件
			if (!isFilter || !ignoreDir.includes(name)) {
				// 将递归读取的结果,直接添加进数组中 递归的同时吧是否过滤也传递
				let files = await readDir(Uri.joinPath(uri, name), isFilter, false);
				arr.push(...files);
			}
			continue;
		} else if (type === vscode.FileType.File) {
			if (!isFilter || (novelName.test(name) && !ignoreFileName.includes(name))) {
				arr.push(Uri.joinPath(uri, name));
			}
		}
	}
	return arr;

}
/**
 * 打开文件夹,获取dir对象
 */
export async function getDir(uri: vscode.Uri): Promise<dir[]> {
	try {
		const dir: dir[] = await _fs.readDirectory(uri);
		return dir;
		// fs.opendir(url, (err, dir) => {
		// 	if (err) {
		// 		reject(err);
		// 	}
		// 	resolve(dir);
		// });
	} catch (error) {
		console.error('读取文件夹失败');
		throw error;
	}
}
/**
 * 读取文件
 * @param url 地址
 * @param checkEncoding 是否需要检查编码
 * @returns 文件内容
 */
export function readFile(url: string, checkEncoding = false): Promise<string> {
	return new Promise(function (resolve, reject) {
		//{ encoding: "gb2312" },
		_fs.readFile();
		fs.readFile(url, function (err, buffer) {
			if (err) {
				reject(err);
				return;
			}
			if (checkEncoding) {
				resolve(encoding(buffer));
			} else {
				resolve(buffer.toString());
			}
		});
	});
}
export function writeFile(_path: string, content: string, isCreateDir = false) {
	return new Promise((resolve, reject) => {
		fs.writeFile(_path, content, async function (err) {
			if (err) {
				console.warn(isCreateDir, err.code === 'ENOENT');
				if (isCreateDir && err.code === 'ENOENT') {
					await createDir(path.dirname(_path), true);
					// 返回重新调用自身的结果(但是不强制创建文件夹了)
					resolve(await writeFile(_path, content));
				} else {
					reject(err);
				}
			} else {
				resolve();
			}
		});
	});
}
/**
 *
 * @param {String} path
 * @param {Boolean} recursive
 */
export function createDir(path: string, recursive: boolean): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, { recursive }, function (err) {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

/**
 * 打开本地拓展文件路径(Uri)
 */
// async function openUri() {
// 	let fileUri = vscode.Uri.joinPath(file.uri, openDirFileName);
// 	fs.writeFile(fileUri.fsPath, openDirReadme + file.uri.path, async function (err) {
// 		if (err) {
// 			vscode.window.showInformationMessage("打开失败,无文件权限?");
// 		}
// 		// 打开未命名文档
// 		//  function openTextDocument(options?: { language?: string; content?: string; }):
// 		let doc = await vscode.workspace.openTextDocument(fileUri);
// 		await vscode.window.showTextDocument(doc, { preview: false });
// 	});
// }
// async function openChapter(_path, fileName, content) {

// 	let fileUri = vscode.Uri.joinPath(file.getUrl(), _path, fileName + ".vscode-novel");
// 	fs.writeFile(fileUri.fsPath, content, async function (err) {
// 		if (err) {
// 			// 如果是没有文件夹错误,则创建
// 			if (err.code === "ENOENT") {
// 				// await createChapterDir(path.join(file.uri.fsPath, _path), fileName);
// 				return;
// 			}
// 			vscode.window.showInformationMessage("打开失败,无文件权限?");
// 			return;
// 		}
// 		// 打开未命名文档
// 		//  function openTextDocument(options?: { language?: string; content?: string; }):
// 		let doc = await vscode.workspace.openTextDocument(fileUri);
// 		await vscode.window.showTextDocument(doc, { preview: false });
// 	});
// }
