const chardet = require('chardet');
const iconv = require('iconv-lite');
// const utf8 = require("./utf8").default;
// const gb_18030 = require("./mbcs").gb_18030;

/**
 * 自动识别buffer内容的编码,并转换成对应字符串
 * @return {String}
 */
export default function (buffer: Buffer): string {
	//Uint8Array
	let det = { fRawInput: buffer, fRawLength: buffer.length };
	if (det.fRawLength > 1024 * 128) {
		console.warn(det.fRawLength);
		det.fRawLength = 1024 * 128;
	}
	/**		utf8 */
	// console.time("utf8");
	// let isUTF8 = new utf8().match(det);
	// console.timeEnd("utf8");
	// console.warn("isUTF8", isUTF8);
	/**		GB18030 */
	// console.time("GB18030");
	// let isGB18030 = new gb_18030().match(det);
	// console.timeEnd("GB18030");
	// console.warn("isGB18030", isGB18030);
	/*
	速度对比
	大小  	   GB18030		utf8
	64----		99   		34
	128---		144  		54
	256---		194  		85
	512---		316  		150
	在128大小下,单独判断和detect(GB18030) 速度 130:17
	后期有需要的话,很有必要单独拿出来做判断
	*/

	console.time('判断编码耗时');
	let t = chardet.detect(buffer.slice(0, 1024 * 128));
	console.timeEnd('判断编码耗时');
	// console.warn(t);
	// 将buffer转换为指定编码格式
	let s = iconv.decode(buffer, t);
	// console.log(s.substring(0, 50));
	return s;
	// resolve(s);
}
