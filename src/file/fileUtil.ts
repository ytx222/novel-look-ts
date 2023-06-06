/**
 * 提交关于操作文件的,可复用的代码
 */

import * as vscode from 'vscode';
const Uri = vscode.Uri;
let _fs = vscode.workspace.fs;
import * as config from './../config';

import * as file from './file';

import { fromString } from 'uint8arrays/from-string';
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
		// FIXME:这里默认有两个是否合适
		ignoreDir = config.get<String[]>('ignoreDir', ['tmp', 'static']);
		ignoreFileName = config.get<String[]>('ignoreFileName', []);
		novelName = new RegExp(config.get('match.novelName', ''));
	}
	// 所有目录项
	const items: dir[] = await getDir(uri);
	// console.warn(items);
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
	// console.warn(arr);
	return arr;
	// 232
}
/**
 * 打开文件夹,获取dir对象
 */
export async function getDir(uri: vscode.Uri): Promise<dir[]> {
	try {
		const dir: dir[] = await _fs.readDirectory(uri);
		return dir;
	} catch (error) {
		console.error('读取文件夹失败');
		throw error;
	}
}

/**
 * 打开文件夹,获取dir对象
 */
export async function isDir(uri: vscode.Uri): Promise<dir[] | false> {
	try {
		const dir: dir[] = await _fs.readDirectory(uri);
		return dir;
	} catch (error) {
		return false;
	}
}
/**
 * 读取文件
 * @param url 地址
 * @param checkEncoding 是否需要检查编码
 * @returns 文件内容
 */
export async function readFile(uri: vscode.Uri, checkEncoding = false): Promise<string> {
	try {
		// console.log(uri);
		// console.time('读取文件耗时1');
		// console.time('读取文件耗时-总');
		// console.log('开始读取文件', uri);
		let buffer = await _fs.readFile(uri);
		// console.timeEnd('读取文件耗时1');
		// console.log('读取buffer完成',checkEncoding);
		if (checkEncoding) {
			return encoding(buffer);
		} else {
			return buffer.toString();
		}
	} finally {
		// console.timeEnd('读取文件耗时-总');
	}
}
/**
 * 写文件
 * @param _path
 * @param content
 * @param isCreateDir
 * @returns
 */
export async function writeFile(path: vscode.Uri, content: string | Uint8Array, isCreateDir = false): Promise<void> {
	if (typeof content === 'string') {
		content = fromString(content);
	}

	try {
		//FIXME: 创建目录逻辑
		await _fs.writeFile(path, content);
	} catch (error) {
		console.error(error);
	}

	// fs.writeFile(_path, content, async function (err) {
	// 	if (err) {
	// 		console.warn(isCreateDir, err.code === 'ENOENT');
	// 		if (isCreateDir && err.code === 'ENOENT') {
	// 			await createDir(path.dirname(_path), true);
	// 			// 返回重新调用自身的结果(但是不强制创建文件夹了)
	// 			resolve(await writeFile(_path, content));
	// 		} else {
	// 			reject(err);
	// 		}
	// 	} else {
	// 		resolve();
	// 	}
	// });
}

/**
 * 创建目录
 * @param {String} path
 * @param {Boolean} recursive
 */
export async function createDir(path: vscode.Uri, recursive: boolean): Promise<void> {
	try {
		//FIXME: 创建目录逻辑
		_fs.createDirectory(path);
	} catch (error) {
		console.error(error);
	}
}

/**
 * 获取文件名称
 * @param uri 文件地址
 * @param isSuffix 是否包含后缀名
 */
export function getFileName(uri: vscode.Uri, isSuffix = false): string {
	const path = uri.path;
	let tArr = path.split('/');
	let name = tArr[tArr.length - 1];
	if (isSuffix) {
		return name;
	}
	let index = name.lastIndexOf('.');
	if (index != -1) {
		name = name.substring(0, index);
	}
	return name;
}
