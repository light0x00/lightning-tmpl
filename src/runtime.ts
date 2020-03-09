/** Used to map characters to HTML entities. */
const htmlEscapes: { [index: string]: string } = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
}

/** Used to match HTML entities and HTML characters. */
const reUnescapedHtml = /[&<>"']/g
const reHasUnescapedHtml = RegExp(reUnescapedHtml.source)  //为了避免过

/**
 * Converts the characters "&", "<", ">", '"', and "'" in `string` to their
 * corresponding HTML entities.
 */
function escape(str: string) {
	//TODO 可以优化为 使用 y 模式, 将第一次match 的lastIndex交给后一个
	return (str && reHasUnescapedHtml.test(str))
		? str.replace(reUnescapedHtml, (chr) => htmlEscapes[chr])
		: (str || "")
}

export default {
	escape
}
