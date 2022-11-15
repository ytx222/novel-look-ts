import * as vscode from 'vscode';

let config = {
	// production dev
	env: 'production',
};
// config.env = 'dev'
// 因为vscode好像没有提供类似api,并且process.env.NODE_ENV也不可用
// 利用打正式包会删除console语句的特性来模拟测试环境和正式环境
console.count({
	toString: () => (config.env = 'dev'),
} as any);
//console['wa'+'rn']('config,,,,,,,,,,env='+config.env);
let t = console.warn;
t('config,,,,,,,,,12,env=' + config.env);
export const env = config.env;
/**
 * 获取vscode设置
 */
export function get<T>(key: string, defaultValue: T): T {
	let t = vscode.workspace.getConfiguration('novelLook');
	// let _=console.log
	// _('获取设置',key, t.get(key));
	return t.get<T>(key, defaultValue);
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
