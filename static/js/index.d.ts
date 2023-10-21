import { initEl } from './dom';
import type { fn } from './../../src/webView';
/**
 *
 *
 *
 */

type NotNull<T> = {
	[P in keyof T]: T[P] & {};
};
declare global {
	/** dom元素 */

	type WebviewElements = NotNull<ReturnType<typeof initEl>>;

	// type WebviewElements = {
	// 	[k in keyof ReturnType<typeof initEl>]: Element;
	// };

	type PostMessageTypes = keyof typeof fn;
	type PostMessageFn = <T extends PostMessageTypes>(type:T,data: Parameters<(typeof fn)[T]>[0] ) => void;

	interface ThemeItem {
		name: string;
		bg: string;
		color: string;
		btnBg: string;
		btnColor: string;
		btnActive: string;
		btnActiveBorder: string;
		navBg?: string;
		textColor?: string;
	}

	/** 缓存数据 */
	interface WebviewCache {
		setting: {
			zoom: number;
			rootFontSize: number;
			lineIndent: number;
			theme: {
				use: number;
				custom: ThemeItem[];
			};
			titleCenter: boolean;
			screenDirection:1|2|3|4
		};
		showChapter: {
			title: string;
			list: string[];
		};
		readScroll: number;
		// screenDirection:1|2|3|4
		// theme: {
		// 	use: number;
		// 	custom: ThemeItem[];
		// };
	}
	type CustomEvents = 'chapterToggle' | '';
}

export {};
