import * as vscode from 'vscode';
import { FileTreeItem, getFileName } from '../file/fileUtil';
import { getExtensionUri } from '../util/util';
import { parseTree } from './TreeViewProvider';

export class BookDir extends vscode.TreeItem {
	constructor(item: FileTreeItem) {
		super(getFileName(item.item));
		this.label = this.tooltip = getFileName(item.item);
		this.collapsibleState = 2; // 可展开,未展开
		this.iconPath = vscode.Uri.joinPath(getExtensionUri(), 'img/dir.png');

		// 先存下来,等访问时再初始化
		this.child = item.child || [];
	}
	type = 'dir';
	child: FileTreeItem[] = [];

	async getChildren() {
		return parseTree(this.child);
	}
}
