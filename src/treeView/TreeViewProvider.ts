import * as vscode from "vscode";
import * as file from "../file/file";
import { split } from "../split";
import * as webView from "../webView";
import { FileTreeItem, getFileName } from "../file/fileUtil";
import {
	getState,
	setState,
	setSync,
	getExtensionUri,
	getStateDefault,
} from "../util/util";
import { Book } from "./Book";
import { Chapter, ChapterGroup, LastChapterData, curChapter } from "./Chapter";
import { BookDir } from "./BookDir";

/**
 * 子节点类型
 */
type TreeItem = BookDir | Book | Chapter | ChapterGroup;

export let lastChapter: LastChapterData;

export const parseTree = (arr: FileTreeItem[], map?: Map<string, Book>) => {
	let res = arr.map((item) => {
		if (item.type === vscode.FileType.Directory) {
			return new BookDir(item);
		}
		// 如果是
		map && map.set(item.item.fsPath, new Book(item.item));
		return new Book(item.item);
	});
	// BookDir排序在最前面,剩余的按照默认排序
	res.sort((a, b) => {
		if (a.type === "dir" && b.type !== "dir") {
			return -1;
		}
		if (
			a instanceof Book &&
			a.fullPath === lastChapter?.fullPath &&
			b.type !== "dir"
		) {
			return -1;
		}

		return a.label! > b.label! ? 1 : -1;
	});

	return res;
};

/**
 * 书架,数据提供者
 */
export class Bookrack implements vscode.TreeDataProvider<TreeItem> {
	/**
	 * 初始化书架
	 * @param arr 书的地址列表
	 */
	constructor(arr: FileTreeItem[]) {
		this.init(arr);
	}

	init(arr: FileTreeItem[]) {
		// 初始化之前阅读的书
		lastChapter = getState<LastChapterData>("lastOpenChapter")!;
		// 初始化数据
		this.bookMap = new Map<string, Book>();
		this.child = parseTree(arr, this.bookMap);
	}

	/**
	 * 刷新需要的
	 */
	private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | null> =
		new vscode.EventEmitter<TreeItem | null>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | null> =
		this._onDidChangeTreeData.event;
	// TODO: 以后使用hash?,这样可以在文件重命名后仍然保留
	// 但是过渡的为用户(我自己?)的修改行为买单十分有意义
	/**
	 * 书架列表
	 * 存储所有书的指针,使用书的完整地址作为key
	 */
	bookMap: Map<string, Book> = new Map();
	child: (Book | BookDir)[] = [];
	/**
	 * 根据书的地址列表,取出对应的信息,格式化
	 * @param arr
	 * @returns
	 */

	/**
	 *
	 */
	refresh(arr: FileTreeItem[]): void {
		this.init(arr);
		//FIXME: 这里目前使用了最简单的方法,即完全重新初始化,这样毕竟干净,但是更消耗性能,
		// let arr = uris.map(e => e.fsPath);
		// // console.warn('执行刷新', arr);
		// // 对比差异,目录顺序是固定的,所以返回的也应该是固定的
		// if (this.list.length) {
		// 	for (var i = 0; i < this.list.length; i++) {
		// 		if (this.list[i].fullPath === arr[i]) {
		// 			// 相等的,也执行一些刷新逻辑,比如清除txt,重新读取文件
		// 			this.list[i].txt = '';
		// 		} else {
		// 			//如果不相等,首先判断是否是被删除了
		// 			if (arr.includes(this.list[i].fullPath)) {
		// 				//新增
		// 				this.list.splice(i, 0, new Book(uris[i]));
		// 			} else {
		// 				//被删除了
		// 				this.list.splice(i--, 1);
		// 			}
		// 		}
		// 	}
		// } else {
		// 	console.warn('没有书,则直接使用新数据,不差量更新');
		// 	console.warn(arr);
		// 	this.list = this.parseTree(uris);
		// }
		// console.warn('新list', this.list);
		// 通知更新
		this._onDidChangeTreeData.fire(null);
	}

	/**
	 * 实现这个来返回在视图中显示的元素的UI表示形式(TreeItem)。
	 * @param  element
	 * @return 其实只会是book
	 */
	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	/**
	 * 实现这个以返回给定元素或根的子元素(如果没有传递元素)。
	 * @param  element 应该是一个书对象
	 * @return 字类型(章节)数组
	 */
	//
	async getChildren(element: TreeItem): Promise<TreeItem[]> {
		if (!this.bookMap.size) {
			vscode.window.showInformationMessage("没有书");
			return Promise.resolve([]);
		}
		// 返回根元素的子元素(书)
		if (!element) {
			return Promise.resolve(this.child);
		}
		// 返回某个元素的子元素,在这里必定的书的子元素,章节
		let t = await element.getChildren();
		return Promise.resolve(t);

		// return Promise.resolve([]);
	}
}

async function showChapter(e: TreeItem | null | undefined): Promise<void> {
	//是对章执行的命令
	if (e && e instanceof Chapter) {
		// console.log("showChapter---执行");
		// 打开章节
		e.openThis();
	} else if (e && e instanceof Book) {
		// 对书执行
		vscode.window.showInformationMessage("无法对书进行此操作");
	} else {
		vscode.window.showInformationMessage(
			"未提供正确的参数,请点击某一章节打开"
		);
	}
}
export async function nextChapter() {
	console.warn("nextChapter=========");
	// 对一个章节进行下一章命令时,会记录当前章节已读
	changeChapter(1, "下", true);
}
export async function prevChapter() {
	console.warn("prevChapter=========");
	changeChapter(-1, "上");
}
/**
 * 切换章节
 * @param {Number} n
 * @param {String} s
 * @param {Boolean} isSave 是否保存当前章节为已读章节
 */
async function changeChapter(n: number, s: string, isSave = false) {
	//TODO: 日志
	// console.log('changeChapter', n, s, isSave);
	if (curChapter) {
		if (isSave) {
			//记录当前章节为已读
			curChapter.setThisRead();
		}
		let curBook = curChapter.book;
		let index = curChapter.i;
		let newChapter = curBook.chapterList[index + n];

		if (newChapter) {
			newChapter.openThis();
		} else {
			vscode.window.showInformationMessage(`未找到${s}一章`);
		}
	} else {
		vscode.window.showInformationMessage(
			`未找到当前章,也许是出错了,请关闭再试一次`
		);
	}
}
/**
 * 关闭webview
 */
async function closeWebView() {
	await webView.closeWebView();
}
/**
 * 关闭后重新打开webview
 * 如果有缓存的(本次拓展启动后有打开章节),则直接打开
 * 如果没有,则尝试读取存储的记录
 */
async function openWebView() {
	if (curChapter) {
		await curChapter.openThis();
	} else {
		// 读取缓存中的
		vscode.window.showInformationMessage(`正在打开`);
		lastChapter = getState<LastChapterData>("lastOpenChapter")!;
		if (bookrack.bookMap.get(lastChapter?.fullPath || "")) {
			const book = bookrack.bookMap.get(lastChapter!.fullPath) as Book;
			// 找到那本书
			// 防止在没有获取书内容的时候查找章节
			await book.getChapterList();
			let ChapterList = book.chapterList;
			let chapter = ChapterList[lastChapter!.i];
			// 判断章节是否正确(不一定有必要,但是保险起见)
			if (chapter && chapter.label === lastChapter!.title) {
				chapter.openThis();
				return;
			}
			vscode.window.showInformationMessage(`未找到对应的章节`);
		} else {
			vscode.window.showInformationMessage(`您最近没有打开章节,无法显示`);
		}
	}
}

/*
	对于treeView的
*/

let treeView: vscode.TreeView<Bookrack>;
let bookrack: Bookrack;

export async function createTreeView() {
	if (treeView) return;
	let fileList = await file.getBookList();
	console.log("createTreeView 执行", fileList);
	// vscode.window.registerTreeDataProvider("novelLookTreeView", new Bookrack(t));
	bookrack = new Bookrack(fileList);
	treeView = vscode.window.createTreeView<Bookrack>("novelLookTreeView", {
		// @ts-ignore
		treeDataProvider: bookrack,
	});
}
async function refreshFile(isNotMsg = false) {
	// console.log("执行刷新");
	let list = await file.getBookList();
	bookrack.refresh(list);
	if (!isNotMsg) {
		vscode.window.showInformationMessage("刷新完成");
	}
	return list;
}

async function showReadChapter() {
	setState("isShowReadChapter", true);
	await refreshFile();
}
async function hideReadChapter() {
	setState("isShowReadChapter", false);
	await refreshFile();
}
async function clearReadChapter(e: vscode.TreeItem): Promise<void> {
	//是对章执行的命令
	console.log("clearReadChapter---执行");
	if (e && e instanceof Chapter) {
		vscode.window.showInformationMessage("无法对章节进行此操作");
	} else if (e && e instanceof Book) {
		// 对书执行
		// e.collapsibleState = 2;
		e.clearReadChapter();
		await refreshFile();
	}
}

export const command = {
	showChapter,
	nextChapter,
	prevChapter,
	closeWebView,
	openWebView,
	refreshFile, // 刷新treeView显示
	showReadChapter,
	hideReadChapter,
	clearReadChapter,
};
