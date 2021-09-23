import * as vscode from 'vscode';

let config = {
	// production dev
	env: 'dev',
};
export const env = config.env;
/**
 * 获取vscode设置
 */
export function get<T>(key: string, defaultValue: T ): T {
	let t = vscode.workspace.getConfiguration('novelLook');
	console.log('match',t.get('match'));
	return t.get(key, defaultValue);
}
/**
 * 设置vscode设置
 * @param {*} key
 * @param {*} value
 */
export function set(key: string, value: any): void {
	let t = vscode.workspace.getConfiguration('novelLook');
	t.update(key, value, true);
}
