import * as vscode from 'vscode';
import { Book } from './Book';
import { setState } from '../util/util';

import { showChapter } from '../webView';

/** 当前显示章节 */
export let curChapter: Chapter;

export interface LastChapterData {
	title: string;
	i: number;
	bookName: string;

	fullPath: string;
}

export class ChapterGroup extends vscode.TreeItem {
	constructor(label: string, child: (ChapterGroup | Chapter)[]) {
		super(label);
		this.collapsibleState = 1; // 可展开,未展开
		if (label === '未读章节') {
			this.collapsibleState = 2;
		}
		this.child = child;
	}
	child: (ChapterGroup | Chapter)[] = [];

	async getChildren() {
		return this.child;
	}
}

/**
 * 章节
 */
export class Chapter extends vscode.TreeItem {
	label: string;
	title: string;
	content: string;
	type = 'chapter';
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
		const data: LastChapterData = {
			title: this.label,
			i: this.i,
			bookName: this.book.label,

			fullPath: this.book.fullPath,
		};
		setState('lastOpenChapter', data);
		showChapter(this.label, lineList);
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


	// 放着就行
	async getChildren() {
		return [];
	}
}
