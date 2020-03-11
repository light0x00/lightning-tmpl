/* 

*/

// let str = `hello,"world"\\<%`

// let replaceItems: [number, string][] = [
// 	[6, "\\\""],
// 	[12, "\\\""],
// 	[13, ""]
// ]

// let offset = 0
// let result = ""

// for (let [idx, val] of replaceItems) {
// 	result += str.substring(offset, idx) + val
// 	offset = idx + 1
// }
// result += str.substring(offset, str.length)

// console.log(result)

// 	[6, "\\\""],
// 	[12, "\\\""],
// 	[13, ""]

// let s = new StringX(`begin hello,"world"\\<% end`, 6, 4)
// s.addReplaceChar(12, "\\\"")
// s.addReplaceChar(18, "\\\"")
// s.addReplaceChar(19, "")
// let r = s.toString()
// console.log(r+".")

import LinkedList from "typescript-collections/dist/lib/LinkedList"

export function replaceSubstring(str: string, replaces: [number, string][], start: number, end: number) {
	if (replaces.length == 0) {
		return str.substring(start, end)
	}
	// let result = ""
	let offset = start
	let substrs: string[] = []

	for (let [idx, val] of replaces) {
		//assert idx >= offset
		// result += str.substring(offset, idx) + val
		substrs.push(str.substring(offset, idx) + val)
		offset = idx + 1
	}
	substrs.push(str.substring(offset, end))
	return substrs.join()
}

/* 
1. 确定最终字符长度 ,创建一个相同长度的int数组
2. 遍历字符串的range 并将字符的charCode 填入int数组 String.prototype.charCodeAt()
3. String.fromCharCode
*/

/**
 * 此类旨在解决一个字符串 频繁变更的
 */
export class MutableString {
	private str: string
	private start: number
	private end: number

	// private replaceChars: [number, string][] = []
	private replaceChars = new LinkedList<[number, string]>()

	/**
	 * 
	 * @param str 字符串
	 * @param startIndex @param endIndex  要处理的子串, 默认处理整个字符串. (注: 范围是「左闭右开」的,规则同`String.substring(start,end)` )
	 * 
	 */
	constructor(str: string, startIndex?: number, endIndex?: number) {
		this.str = str
		this.start = startIndex ?? 0
		this.end = endIndex ?? str.length
	}

	replaceChar(charIndex: number, replaceValue: string) {
		// this.replaceChars.push([charIndex, replaceValue])
		this.replaceChars.add([charIndex, replaceValue])
	}

	setRange(startIndex: number, endIndex: number) {
		this.start = startIndex
		this.end = endIndex
	}

	toString() {
		let offset = this.start
		let result = ""
		this.replaceChars.forEach(
			([idx, val]) => {
				result += this.str.substring(offset, idx) + val
				offset = idx + 1
			}
		)
		result += this.str.substring(offset, this.end)
		return result
	}
	
	static replaceSubstring2(str: string, replaceChars: LinkedList<[number, string]>, start: number, end: number) {
		let offset = start
		let result = ""
		replaceChars.forEach(
			([idx, val]) => {
				result += str.substring(offset, idx) + val
				offset = idx + 1
			}
		)
		result += str.substring(offset, end)
		return result
	}

	static replaceSubstring(str: string, replaceChars: [number, string][], start: number, end: number) {
		let offset = start
		let result = []
		for (let [idx, val] of replaceChars) {
			//assert offset <= idx
			result.push(str.substring(offset, idx) + val)
			offset = idx + 1
		}
		//assert offset <= end
		result.push(str.substring(offset, end))
		return result.join("")
	}

}

export type Optional<T> = {
	readonly [P in keyof T]?: T[P];
};