const config = require("./config");

// 这个正则是只匹配章节名称,用于获取章节名称的(不包含第几章)
var reg2 = /第.+?章/;
/**
 *
 * @param {String} s
 * @returns
 */
function getChapterTitle(s) {
	// console.log("getChapterTitle", s);
	let t = reg2.exec(s);
	if (t) {
		// console.log("成功", s.substring(t[0].length).trim());
		return s.substring(t[0].length).replace(/ /g, "");
	}
	return s;
}

/**
 * 判断是否是重复章节
 */
function isRepeat(cur, last) {
	// console.warn(cur, last);
	// 如果连续两章的章名相同,则不对后一章名进行分章
	let curTitle = getChapterTitle(cur.s.trim());
	let lastTitle = getChapterTitle(last.s.trim());
	if (curTitle === lastTitle) {
		return true;
	} else {
		// 综合判断相似度和上一章的长度等信息
	}
	return false;
}

/**
 * @param {String} s
 * @return {Array<Object>} 章节列表
 */
function split(s) {
	let match = config.get("match.chapterName");
	let reg = new RegExp(match, "g");

	let t;
	//第一章之前的
	t = reg.exec(s);
	// 因为头部这两个字,txtIndex要-2,size+2(因为字符串截取)
	// (t && t.index + 2) || 2  直接赋值为文件长度,如果后面有内容,则覆盖,没有则直接显示头部
	let arr = [{ txtIndex: -2, s: "头部", i: 0, size: s.length }];
	let i = 0;
	let lastItem = arr[0];
	if (t) {
		do {
			let item = {
				s: t[0],
				i: i + 1,
				txtIndex: t.index,
				size: 0,
			};
			let is = isRepeat(item, lastItem);
			if (is) {
				continue;
			} else {
				arr.push(item);
				lastItem.size = t.index - lastItem.txtIndex;
				lastItem = item;
			}
			i++;
		} while ((t = reg.exec(s)) && t);
		//FIXME: 大结局可能需要额外的正则或处理
		lastItem.size = s.length - lastItem.txtIndex;
	}
	return arr;
}

exports.split = split;
