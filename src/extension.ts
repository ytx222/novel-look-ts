// vscode模块包含VS Code可扩展性API
// 导入模块并在下面的代码中使用别名vscode引用它
import * as vscode from 'vscode';
// 方法在index.js,导入,并集中添加
import { init, command } from './index';
import Log from './util/log';

// 此方法在您的扩展被激活时被调用
// 您的扩展是激活的第一次命令被执行
/**
 * 拓展激活的事件,激活拓展时执行,拓展激活事件只会执行一次
 */
export function activate(context: vscode.ExtensionContext) {
	Log.log('拓展初始化');
	// Log.log(context.globalState);
	// Log.log(context.globalStoragePath);
	// Log.log(context.globalStorageUri);
	// 初始化自己的文件夹
	// C:\Users\Administrator\AppData\Roaming\Code\User\globalStorage\ytx.novel-look
	// let uri = context.globalStorageUri;
	// let fs = vscode.workspace.fs;
	// let t=fs.createDirectory(uri).then(function (e,e2) {
	// 	Log.warn("createDirectory");
	// 	Log.warn(e,e2);
	// 	Log.warn(t);
	// })
	init(context);

	interface CommandList {
		// 字符串类型的键  和 拥有任意参数并返回任意值的函数
		[key: string]: (...args: any[]) => any;
	}
	// 注册命令
	for (var item in command) {
		// Log.warn(item,command[item]);
		context.subscriptions.push(vscode.commands.registerCommand('novel-look.' + item, (command as CommandList)[item]));
	}
	// 测试专用命令

	context.subscriptions.push(
		vscode.commands.registerCommand('novel-look.test', function () {
			vscode.window.showInformationMessage('test');
			// vscode.commands.getCommands().then(allCommands => {
			// 	Log.log("所有命令：", allCommands);
			// });
		})
	);
}

// 当你的扩展被停用时，这个方法被调用
export function deactivate() {
	vscode.window.showInformationMessage('拓展被停用');
}
