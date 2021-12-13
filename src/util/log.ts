/**
 * 统一管理日志,防止在生产环境中输入什么东西导致性能出现问题
 */
console.log('log 执行');

const defaultFn = (..._: any[]): any => void 0;
let _log = defaultFn;
let _warn = defaultFn;
let _error = defaultFn;
let _time = defaultFn;
let _timeEnd = defaultFn;

_log = console.log;
_warn = console.warn;
_error = console.error;
_time = console.time;
_timeEnd = console.timeEnd;
// 覆盖旧方法
// console.log = () => void 0;
// console.warn = () => void 0;
// console.error = () => void 0;
// console.time = () => void 0;
// console.timeEnd = () => void 0;
export default class Log {
	static log(...args: any) {
		_log(...args);
	}

	static warn(...args: any) {
		_warn(...args);
	}

	static error(...args: any) {
		_error(...args);
	}

	static time(...args: any) {
		_time(...args);
	}

	static timeEnd(...args: any) {
		_timeEnd(...args);
	}
}
