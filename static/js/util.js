/* eslint-env browser */

export function log () {
	console.log('========log被调用');
}


export async function sleep (ms = 10) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
}


export function toFixed(n, fractionDigits = 3) {
	return +n.toFixed(fractionDigits);
}
