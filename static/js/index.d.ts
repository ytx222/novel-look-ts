import { initEl } from './dom';
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
	interface PostMessageType {
		chapterToggle: 'next' | 'prev';
		zoom: number;
	}

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
		};
		showChapter: {
			title: string;
			list: string[];
		};
		readScroll: number;
	}
	type CustomEvents = 'chapterToggle' | '';
}

export {};
