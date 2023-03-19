/**
 *
 *
 *
 */
declare global {
	/** dom元素 */
	interface WebviewElements {
		main: HTMLLIElement;
		title: HTMLLIElement;
		content: () => HTMLLIElement;
		nav: HTMLLIElement;
		navTitle: HTMLLIElement;
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
	}
}
export {};
