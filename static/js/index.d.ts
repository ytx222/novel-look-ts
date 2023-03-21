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
	/** 缓存数据 */
	interface WebviewCache {
		setting: {
			zoom: number;
			rootFontSize: number;
			lineIndent: number;
		};
		showChapter: {
			title: string;
			list: string[];
		};
		readScroll: number;
	}
}
export {};
