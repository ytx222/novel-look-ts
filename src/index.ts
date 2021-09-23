import * as vscode from 'vscode';
import { createTreeView, command as viewCommand } from './TreeViewProvider';
import { init as initUtil } from './util';
import { init as initFile, command as fileCommand } from './file/file';

let content: vscode.ExtensionContext;

/**
 * 初始化
 * @param  _context vscode拓展上下文
 */
export async function init(_context: vscode.ExtensionContext) {
	content = _context;
	// 工具类,优先初始化,其他地方很有可能用
	initUtil(content);
	const fileList = await initFile(content);
	// console.warn("全局init===fileList",fileList);
	createTreeView(fileList);
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
/**
 * 可被vscode执行的命令
 */
export const command = {
	...fileCommand,
	...viewCommand,
};
