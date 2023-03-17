/**
 *
 *
 *
 */
declare global {
	interface WebviewElements {
		main: HTMLLIElement;
		title: HTMLLIElement;
		content: () => HTMLLIElement;
		nav: HTMLLIElement;
		navTitle: HTMLLIElement;
	}

}
export {};
