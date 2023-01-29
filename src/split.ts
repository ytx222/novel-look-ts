import { get } from './config';

/**
 * 章节信息
 */
type splitChapterInfo = {
	/** 章节名称 */
	s: string;
	/**章节在数组中的下标(分章之后的第几章) */
	i: number;
	/** 章节正文开始位置 */
	txtIndex: number;
	/**章节正文长度 */
	size: number;
};

// 这个正则是只匹配章节名称,用于获取章节名称的(不包含第几章)
const reg2 = /第.+?章/;
/***
 * 获取章节名称
 *
 */
function getChapterTitle(s: string) {
	// console.log("getChapterTitle", s);
	const t = reg2.exec(s);
	if (t) {
		// console.log("成功", s.substring(t[0].length).trim());
		return s.substring(t[0].length).replace(/ /g, '');
	}
	return s;
}

/**
 * 判断是否是重复章节
 */
function isRepeat(cur: splitChapterInfo, last: splitChapterInfo) {
	// console.warn(cur, last);
	// 如果连续两章的章名相同,则不对后一章名进行分章
	const curTitle = getChapterTitle(cur.s.trim());
	const lastTitle = getChapterTitle(last.s.trim());
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
export function split(s: string): splitChapterInfo[] {
	const match = get('match.chapterName', '(?:\\s*)第[一二两三四五六七八九十百千万零〇\\d]*章[^\\n]*');
	const reg = new RegExp(match, 'g');
	let t;
	//第一章之前的
	t = reg.exec(s);
	// 因为头部这两个字,txtIndex要-2,size+2(因为字符串截取)
	// (t && t.index + 2) || 2  直接赋值为文件长度,如果后面有内容,则覆盖,没有则直接显示头部
	const arr: splitChapterInfo[] = [{ txtIndex: -2, s: '头部', i: 0, size: s.length }];
	let i = 0;
	let lastItem = arr[0];
	if (t) {
		do {
			const item = {
				// 这里获取到的会包含\t\r\n 但是为了保证字符index不出现偏差,需要保存
				// FIXME: 后续优化
				s: t[0],

				i: i + 1,
				txtIndex: t.index,
				size: 0,
			};
			const is = isRepeat(item, lastItem);
			if (is) {
				continue;
			} else {
				arr.push(item);
				lastItem.size = t.index - lastItem.txtIndex;
				lastItem = item;
			}
			i++;
		} while ((t = reg.exec(s)) && t);
		// 最后一章的结尾
		lastItem.size = s.length - lastItem.txtIndex;
	}
	console.log(arr);
	return arr;
}
