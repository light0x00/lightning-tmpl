export function replaceSubstring(str: string, replaceChars: [number, string][], start: number, end: number) {
	let offset = start
	let result = ""
	for (let [idx, val] of replaceChars) {
		//assert offset <= idx
		result += str.substring(offset, idx) + val
		offset = idx + 1
	}
	//assert offset <= end
	result += str.substring(offset, end)
	return result
}

export type Optional<T> = {
	readonly [P in keyof T]?: T[P];
};