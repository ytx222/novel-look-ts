import * as vscode from 'vscode';
import { createTreeView, command as viewCommand } from './treeView/TreeViewProvider';
import { setEnv } from './config';
import { command as fileCommand, init as initFile } from './file/file';
import { init as initUtil } from './util/util';

let content: vscode.ExtensionContext;

/**
 * 初始化
 * @param  _context vscode拓展上下文
 */
export async function init(_context: vscode.ExtensionContext) {
	content = _context;

	let isDev = content.extension.packageJSON.isUnderDevelopment;
	console.log('setEnv', isDev ? 'dev' : 'production');
	setEnv(isDev ? 'dev' : 'production');
	// 工具类,优先初始化,其他地方很有可能用
	initUtil(content);
	await initFile(content);
	createTreeView();
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
