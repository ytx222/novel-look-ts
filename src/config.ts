import * as vscode from 'vscode';
import Log from './util/log';

let config = {
	// production dev
	env: 'production',
};
// 因为vscode好像没有提供类似api,并且process.env.NODE_ENV也不可用
// 利用打正式包会删除Log.log的特性来模拟测试环境和正式环境
Log.log((config.env = 'dev'));

Log.warn('config,,,,,,,,,,,,,,,,,,');
eval('Log.log("' + config.env + '")');
export const env = config.env;
/**
 * 获取vscode设置
 */
export function get<T>(key: string, defaultValue: T): T {
	let t = vscode.workspace.getConfiguration('novelLook');
	Log.log('match', t.get('match'));
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
