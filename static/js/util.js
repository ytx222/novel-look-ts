/* eslint-env browser */

export function log() {
	console.log("========log被调用");
}

export async function sleep(ms = 10) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
}

export function toFixed(n, fractionDigits = 3) {
	return +n.toFixed(fractionDigits);
}

export function rgbToHsl(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h,
		s,
		l = (max + min) / 2;

	if (max === min) {
		h = s = 0; // 非彩色
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		const hueMap = {
			[b]: (r - g) / d + 4,
			[g]: (b - r) / d + 2,
			[r]: (g - b) / d + (g < b ? 6 : 0),
		};
		h = hueMap[max] / 6;
		/**
		switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
		*/
	}

	return [h, s, l];
}


function hlsToRgb (h, s, l) {
	// TODO

	let r, g, b;
	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}






}
