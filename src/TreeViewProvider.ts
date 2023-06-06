import * as vscode from 'vscode';
import * as file from './file/file';
import { split } from './split';
import * as webView from './webView';
import { getFileName } from './file/fileUtil';
import { getState, setState, setSync, getExtensionUri, getStateDefault } from './util/util';
/** 当前显示章节 */
let curChapter: Chapter;

/**
 * 子节点类型
 */
type TreeItem = Book | Chapter;

/**
 * 书架,数据提供者
 */
export class Bookrack implements vscode.TreeDataProvider<TreeItem> {
	/**
	 * 初始化书架
	 * @param arr 书的地址列表
	 */
	constructor(arr: vscode.Uri[]) {
		this.list = this.parseArr(arr);
	}

	/**
	 * 刷新需要的
	 */
	private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | null> = new vscode.EventEmitter<TreeItem | null>();
	readonly onDidChangeTreeData: vscode.Event<TreeItem | null> = this._onDidChangeTreeData.event;

	// 书架列表
	list: Book[];
	/**
	 * 根据书的地址列表,取出对应的信息,格式化
	 * @param arr
	 * @returns
	 */
	parseArr(arr: vscode.Uri[]): Book[] {
		return arr.map(u => new Book(u));
	}

	/**
	 *
	 */
	refresh(uris: vscode.Uri[]): void {
		let arr = uris.map(e => e.fsPath);
		// console.warn('执行刷新', arr);
		// 对比差异,目录顺序是固定的,所以返回的也应该是固定的
		if (this.list.length) {
			for (var i = 0; i < this.list.length; i++) {
				if (this.list[i].fullPath === arr[i]) {
					//如果相等,则什么都不做
				} else {
					//如果不相等,首先判断是否是被删除了
					if (arr.includes(this.list[i].fullPath)) {
						//新增
						this.list.splice(i, 0, new Book(uris[i]));
					} else {
						//被删除了
						this.list.splice(i--, 1);
					}
				}
			}
		} else {
			console.warn('没有书,则直接使用新数据,不差量更新');
			console.warn(arr);
			this.list = this.parseArr(uris);
		}
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
	async getChildren(element: Book): Promise<TreeItem[]> {
		if (!this.list.length) {
			vscode.window.showInformationMessage('没有书');
			return Promise.resolve([]);
		}
		// 返回根元素的子元素(书)
		if (!element) {
			return Promise.resolve(this.list);
		} else {
			// 返回某个元素的子元素,在这里必定的书的子元素,章节
			let t = await element.getChapterList();
			return Promise.resolve(t);
		}
	}
}

/**
 * 书
 */
class Book extends vscode.TreeItem {
	/**
	 * 创建一本书
	 * @param  label 名称
	 * @param  fullPath 这本书的路径
	 */
	constructor(uri: vscode.Uri) {
		super(getFileName(uri));
		//FIXME:书名悬浮显示什么
		this.label = getFileName(uri);
		this.tooltip = `${this.label}`;
		this.collapsibleState = 1; // 可展开,未展开
		// this.description = this.version;
		this.iconPath = vscode.Uri.joinPath(getExtensionUri(), 'img/book.png');
		// 自己用的
		this.fullPath = uri.fsPath;
		this.txt = ''; //文件内容,暂时留空

		// 已读章节
		this.readList = getStateDefault<number[]>('book_' + this.label, []);
		// console.warn(this.label);
		// console.warn(this.readList);
	}
	label: string;
	fullPath: string;
	txt: string;
	chapterList: Chapter[] = [];
	showList: Chapter[] = [];
	// TODO:类型
	readList: number[] = [];
	timer?: NodeJS.Timeout;
	// 获取这本书的章节内容,这个是获取章节列表的最佳方式
	async getChapterList() {
		// console.log(`getChapterList==${this.label}`);
		// console.time('获取章节内容时间');
		await this.getContent();
		let arr = split(this.txt);
		//FIXME: 类型修改
		this.chapterList = arr.map(
			(
				t: {
					s: string;
					i: number;
					txtIndex: number;
					size: number;
				},
				i: number
			) => {
				return new Chapter(this, t.s, t.i, t.txtIndex, t.size, !!this.readList[i] || false);
			}
		);
		// console.timeEnd('获取章节内容时间');

		// 如果需要隐藏已读章节
		// console.warn('是否隐藏已读章节', !getStateDefault('isShowReadChapter', false));
		if (!getStateDefault('isShowReadChapter', false)) {
			// 多筛选一遍,并不怎么消耗性能,但是可以提高可维护性
			this.showList = this.chapterList.filter(e => !e.isRead);
		} else {
			this.showList = this.chapterList;
		}
		return this.showList;
	}

	//
	/**
	 * 获取这本书的内容,为了节省内存,设置计时器在多少时间后删除文本(自动回收)
	 * 重复调用这个方法可以重置这个时间
	 */
	async getContent() {
		try {
			if (this.timer) {
				clearInterval(this.timer);
			}
			//10分钟后清除这本书
			this.timer = setTimeout(() => {
				this.clearTxt();
			}, 1000 * 60 * 10);
			if (this.txt) {
				return;
			}
			// console.time();
			//TODO:
			this.txt = await file.readFile(vscode.Uri.file(this.fullPath), true);
			// console.timeEnd();
		} catch (error) {
			console.error(error);
			vscode.window.showInformationMessage('获取书内容失败,错误信息已打印到控制台');
		}
	}

	/**
	 * 设置某个章节为已读章节
	 * @param  i 章节下标
	 */
	setReadChapter(i: number) {
		this.readList[i] = 1; //数据转化为json,所以1应该比true更合适
		setState('book_' + this.label, this.readList);
		// console.warn(this.readList);
		setSync('book_' + this.label);
	}

	clearReadChapter() {
		this.readList = [];
		setState('book_' + this.label, []);
	}

	clearTxt() {
		console.log('清除txt', this.label);
		this.txt = '';
	}
}

interface LastChapterData {
	title: string;
	i: number;
	bookName: string;
}

/**
 * 章节
 */
class Chapter extends vscode.TreeItem {
	/**
	 * 创建章节
	 * @param book 这个章节属于哪本书
	 * @param label 章节标题
	 * @param i 数组index
	 * @param txtIndex 在这本书的内容的开始下标
	 * @param size 长度
	 * @param isRead 是否已读
	 */
	constructor(
		public book: Book,
		label: string,
		public i: number,
		public txtIndex: number,
		public size: number,
		public isRead = false
	) {
		super(label.trim());
		this.label = label.trim();
		this.tooltip = `${this.label}---共${size}字`;
		this.collapsibleState = 0; // 不可折叠
		// 4个自己用的
		this.title = label;
		this.i = i;
		// this.txtIndex = txtIndex;
		this.size = size;
		this.book = book;
		this.command = { title: '', command: 'novel-look.showChapter', arguments: [this] }; // 执行命令
		this.content = '';
		this.isRead = isRead;
	}
	label: string;
	title: string;
	content: string;
	/**
	 * 打开本章
	 *
	 */
	async openThis() {
		// console.log(this.i, this.txtIndex, this.size);
		curChapter = this;
		await this.getTxt();
		let lineList = this.parseChapterTxt_WebView();
		// 缓存最后打开的章节
		const data: LastChapterData = { title: this.label, i: this.i, bookName: this.book.label };
		setState('lastOpenChapter', data);
		webView.showChapter(this.label, lineList);
	}
	/**
	 * 处理章节的内容,对于webView,不需要太多处理,给他数组就行,剩下的用css解决
	 */
	parseChapterTxt_WebView() {
		let arr = this.content.split('\n');
		let res: string[] = [];
		arr.forEach(function (item) {
			item = item.trim();
			if (item && item.length) {
				res.push(item);
			}
		});
		return res;
	}
	async getTxt() {
		await this.book.getContent();
		this.content = this.book.txt.substring(this.txtIndex + this.title.length, this.txtIndex + this.size);
	}
	/**
	 * 设置当前章节为已读章节
	 */
	setThisRead() {
		this.book.setReadChapter(this.i);
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
		vscode.window.showInformationMessage('无法对书进行此操作');
	} else {
		vscode.window.showInformationMessage('未提供正确的参数,请点击某一章节打开');
	}
}
export async function nextChapter() {
	console.warn('nextChapter=========');
	// 对一个章节进行下一章命令时,会记录当前章节已读
	changeChapter(1, '下', true);
}
export async function prevChapter() {
	console.warn('prevChapter=========');
	changeChapter(-1, '上');
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
		vscode.window.showInformationMessage(`未找到当前章,也许是出错了,请关闭再试一次`);
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
		let data = getState<LastChapterData>('lastOpenChapter');
		if (data && data.bookName) {
			// 找到那本书
			for (var i = 0; i < bookrack.list.length; i++) {
				if (bookrack.list[i].label === data.bookName) {
					// 防止在没有获取书内容的时候查找章节
					let book = bookrack.list[i];
					await book.getChapterList();
					let ChapterList = book.chapterList;
					let chapter = ChapterList[data.i];
					// 判断章节是否正确(不一定有必要,但是保险起见)
					if (chapter && chapter.label === data.title) {
						chapter.openThis();
					}
					return;
				}
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

export function createTreeView(fileList: vscode.Uri[]) {
	// console.log("createTreeView 执行");
	// vscode.window.registerTreeDataProvider("novelLookTreeView", new Bookrack(t));
	bookrack = new Bookrack(fileList);
	treeView = vscode.window.createTreeView<Bookrack>('novelLookTreeView', {
		// @ts-ignore
		treeDataProvider: bookrack,
	});
	// 报了一个treeView未使用的错,我很不爽
	if (treeView) return;
	// treeView.reveal
}
async function refreshFile(isNotMsg = false) {
	// console.log("执行刷新");
	let list = await file.getBookList();
	bookrack.refresh(list);
	if (!isNotMsg) {
		vscode.window.showInformationMessage('刷新完成');
	}
	return list;
}

async function showReadChapter() {
	setState('isShowReadChapter', true);
	await refreshFile();
}
async function hideReadChapter() {
	setState('isShowReadChapter', false);
	await refreshFile();
}
async function clearReadChapter(e: vscode.TreeItem): Promise<void> {
	//是对章执行的命令
	console.log('clearReadChapter---执行');
	if (e && e instanceof Chapter) {
		vscode.window.showInformationMessage('无法对章节进行此操作');
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
