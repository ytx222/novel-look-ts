import * as vscode from 'vscode';
import { WorkspaceConfiguration } from 'vscode';

type ENV = 'production' | 'dev';

let config = {
	env: 'production' as ENV,
};

export let env = config.env;
export const setEnv = (e: ENV) => {
	config.env = e;
	env = e;
};

let configuration: WorkspaceConfiguration;
/**
 * 获取vscode设置
 */
export function get<T>(key: string, defaultValue: T): T {
	configuration ??= vscode.workspace.getConfiguration('novelLook');
	// let _=console.log
	// _('获取设置',key, t.get(key));
	return configuration.get<T>(key, defaultValue);
}
/**
 * 设置vscode设置
 * @param {*} key
 * @param {*} value
 */
export function set(key: string, value: any): void {
	configuration ??= vscode.workspace.getConfiguration('novelLook');
	configuration.update(key, value, true);
}
