/**
 * 统一管理日志,防止在生产环境中输入什么东西导致性能出现问题
 */
console.log('log 执行');

const _log = console.log;
const _warn = console.warn;
const _error = console.error;
const _time = console.time;
const _timeEnd = console.timeEnd;
console.log = () => void 0;
console.warn = () => void 0;
console.error = () => void 0;

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
