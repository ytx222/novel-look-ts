import { getFileName, readFile } from '../file/fileUtil';
import { split } from '../split';
import { getExtensionUri, getStateDefault, setState, setSync } from '../util/util';
import * as vscode from 'vscode';
import { Chapter, ChapterGroup } from './Chapter';
import { lastChapter } from './TreeViewProvider';
/**
 * 书
 */
export class Book extends vscode.TreeItem {
	label: string;
	fullPath: string;
	txt: string;
	// 所有章节列表
	chapterList: Chapter[] = [];
	/**未读章节 可能不会初始化 */
	unreadList: Chapter[] = [];
	/** 已读章节 可能不会初始化 */
	haveReadList: Chapter[] = [];
	// TODO:类型
	readList: number[] = [];
	timer?: NodeJS.Timeout;
	type = 'book' as const;
	/**
	 * 创建一本书
	 * @param  label 名称
	 * @param  fullPath 这本书的路径
	 */
	constructor(uri: vscode.Uri) {
		super(getFileName(uri));
		this.label = getFileName(uri);
		this.tooltip = `${this.label}`;
		this.collapsibleState = 1; // 可展开,未展开
		// this.description = this.version;
		// console.log({ lastChapter, p: uri.fsPath, });
		if (lastChapter?.fullPath === uri.fsPath) {
			this.iconPath = vscode.Uri.joinPath(getExtensionUri(), 'img/book_read.png');
		} else {
			this.iconPath = vscode.Uri.joinPath(getExtensionUri(), 'img/book.png');
		}
		// 自己用的
		this.fullPath = uri.fsPath;
		this.txt = ''; //文件内容,暂时留空

		// 已读章节
		this.readList = getStateDefault<number[]>('book_' + this.label, []);
		// console.warn(this.label);
		// console.warn(this.readList);
	}

	async getChildren() {
		return await this.getChapterList();
	}

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
			this.unreadList = this.chapterList.filter(e => !e.isRead);
			this.haveReadList = this.chapterList.filter(e => e.isRead);
			return [
				new ChapterGroup('已读章节', this.haveReadList),
				new ChapterGroup('未读章节', this.unreadList),
			]
		}
		// 如果要进一步做每多少章分组会有一个问题,其实我不知道这是第多少章..
		return this.chapterList;
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
			this.txt = (await readFile(vscode.Uri.file(this.fullPath), { checkEncoding: true })) as string;
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
		// TODO:
		setSync(
			...[
				// 设置需要同步的缓存key
				'book_' + this.label,
				'lastOpenChapter',
				'isShowReadChapter',
				// 'saveScroll',
			]
		);
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
