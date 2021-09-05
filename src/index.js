const file = require('./file/file');
import * as vscode from 'vscode';
const { createTreeView, command: viewCommand } = require('./TreeViewProvider');
const { init: initUtil } = require('./util');
/**
 * @type {vscode.ExtensionContext}
 */
let content;

/**
 * 初始化
 * @param {vscode.ExtensionContext} _context vscode拓展上下文
 */
export async function init(_context) {
	content = _context;
	// 工具类,优先初始化,其他地方很有可能用
	initUtil(content);
	let fileList = await file.init(content);
	createTreeView(fileList, content);
	// 这个数据是否需要被当前用户的其他设备同步
	// content.globalState.setKeysForSync(["configuration", "extensions",""]);
}

/**
 * 获取拓展上下文
 * @return {vscode.ExtensionContext}
 */
export function getContent() {
	return content;
}
export const command = {
	...file.command,
	...viewCommand,
};
