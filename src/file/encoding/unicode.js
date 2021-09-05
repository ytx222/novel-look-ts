export class UTF_16BE {
	name() {
		return "UTF-16BE";
	}
	match(det) {
		const input = det.fRawInput;
		if (input.length >= 2 && (input[0] & 0xff) == 0xfe && (input[1] & 0xff) == 0xff) {
			return 100;
		}
		return null;
	}
}
export class UTF_16LE {
	name() {
		return "UTF-16LE";
	}
	match(det) {
		const input = det.fRawInput;
		if (input.length >= 2 && (input[0] & 0xff) == 0xff && (input[1] & 0xff) == 0xfe) {
			if (input.length >= 4 && input[2] == 0x00 && input[3] == 0x00) {
				return null;
			}
			return 100;
		}
		return null;
	}
}
export class UTF_32 {
	name() {
		return "UTF-32";
	}
	getChar(input, index) {
		return -1;
	}
	match(det) {
		let numValid = 0,
			numInvalid = 0,
			hasBOM = false,
			confidence = 0;
		const limit = (det.fRawLength / 4) * 4;
		const input = det.fRawInput;
		if (limit == 0) {
			return null;
		}
		if (this.getChar(input, 0) == 0x0000feff) {
			hasBOM = true;
		}
		for (let i = 0; i < limit; i += 4) {
			const ch = this.getChar(input, i);
			if (ch < 0 || ch >= 0x10ffff || (ch >= 0xd800 && ch <= 0xdfff)) {
				numInvalid += 1;
			} else {
				numValid += 1;
			}
		}
		if (hasBOM && numInvalid == 0) {
			confidence = 100;
		} else if (hasBOM && numValid > numInvalid * 10) {
			confidence = 80;
		} else if (numValid > 3 && numInvalid == 0) {
			confidence = 100;
		} else if (numValid > 0 && numInvalid == 0) {
			confidence = 80;
		} else if (numValid > numInvalid * 10) {
			confidence = 25;
		}
		return confidence == 0 ? null : confidence;
	}
}
export class UTF_32BE extends UTF_32 {
	name() {
		return "UTF-32BE";
	}
	getChar(input, index) {
		return (
			((input[index + 0] & 0xff) << 24) |
			((input[index + 1] & 0xff) << 16) |
			((input[index + 2] & 0xff) << 8) |
			(input[index + 3] & 0xff)
		);
	}
}
export class UTF_32LE extends UTF_32 {
	name() {
		return "UTF-32LE";
	}
	getChar(input, index) {
		return (
			((input[index + 3] & 0xff) << 24) |
			((input[index + 2] & 0xff) << 16) |
			((input[index + 1] & 0xff) << 8) |
			(input[index + 0] & 0xff)
		);
	}
}
