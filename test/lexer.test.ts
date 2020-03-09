import { Lexer, Token, CONTENT, EV_DS, DE, IN_DS, ES_DS } from "~/lexer"
import { EOF } from "@parser-generator/definition"
import should from "should"

function mapTokens<T>(text: string, fn: (t: Token) => T): T[] {
	let result = []
	let lexer = new Lexer(text)
	for (let t = lexer.next(); t.proto != EOF; t = lexer.next()) {
		result.push(fn(t))
	}
	return result
}

let getLexemes = (text: string) => {
	return mapTokens(text, (t) => t.lexeme)
}

describe(`DFA Test`, () => {

	it(`interpolate`, () => {
		let actuality = getLexemes(`<%=user.name%>`)
		let expectation = ["<%=", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

	it(`escape`, () => {
		let actuality = getLexemes(`<%-user.name%>`)
		let expectation = ["<%-", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

	it(`evaluate`, () => {
		let actuality = getLexemes(`<%user.name%>`)
		let expectation = ["<%", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

	it(`mix`, () => {
		let actuality = getLexemes(
			`<% for(let i=0;i<users;i++){ %><h1><%= users[i].name %></h1><% } %>`)
		let expectation = [
			"<%",
			" for(let i=0;i<users;i++){ ",
			"%>",
			"<h1>",
			"<%=", " users[i].name ", "%>", "</h1>",
			"<%", " } ", "%>"
		]
		should(actuality).eql(expectation)
	})

})

describe(`Token Tag Test`, () => {
	it(`case 1`, () => {
		let actuality = mapTokens(
			`<% for(let i=0;i<users;i++){ %><h1><%= users[i].name %></h1><% } %>`,
			(t) => t.proto)
		let expectation = [
			EV_DS,
			CONTENT,
			DE,
			CONTENT,
			IN_DS, CONTENT, DE, CONTENT,
			EV_DS, CONTENT, DE
		]
		should(actuality).eql(expectation)
	})
})

describe(`Charactor Escape & Unescape Test`, () => {

	it("换行符应该被替换为`\\n` ", () => {
		let actuality = getLexemes("<%-hello%>\n")
		let expectation = ["<%-", "hello", "%>", "\\n"]
		should(actuality).eql(expectation)
	})

	it("不在代码块之内的 `\"` 应该被转义 ", () => {
		let actuality = getLexemes(`"hello"<%-world%>`)
		let expectation = ["\\\"hello\\\"", "<%-", "world", "%>"]
		should(actuality).eql(expectation)
	})
	
	it("代码块之内的 `\"` 不应该被转义", () => {
		let actuality = getLexemes(`"hello"<%-"world"%>`)
		let expectation = ["\\\"hello\\\"", "<%-", "\"world\"", "%>"]
		should(actuality).eql(expectation)
	})

	it("`\\<%` 应该被反转义为 `<%`", () => {
		let actuality = getLexemes(`\\<%hello<%-user.name%>`)
		let expectation = ["<%hello", "<%-", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

	it("`\\%>` 应该被反转义为 `%>`", () => {
		let actuality = getLexemes(`hello\\%><%-user.name%>`)
		let expectation = ["hello%>", "<%-", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

})

describe(`Token Location Test`, () => {
	let getLocaltions = (text: string) => mapTokens(text, (t) => [t.lexeme, t.lineBegin, t.colBegin, t.lienEnd, t.colEnd])

	it(`case 1`, () => {
		let actuality = getLocaltions(`<%=
user.name %>
`
		)
		let expectation = [
			["<%=", 1, 1, 1, 3],
			["\\nuser.name ", 1, 4, 2, 10],
			["%>", 2, 11, 2, 12],
			["\\n", 2, 13, 3, 0],
		]
		should(actuality).eql(expectation)
	})

	it(`case 2`, () => {
		let actuality = getLocaltions(`
<h1>
	<%= user.name %>
</h1>
`
		)
		let expectation = [
			["\\n<h1>\\n\t", 1, 1, 3, 1],
			["<%=", 3, 2, 3, 4],
			[" user.name ", 3, 5, 3, 15],
			["%>", 3, 16, 3, 17],
			["\\n</h1>\\n", 3, 18, 5, 0]
		]
		should(actuality).eql(expectation)
	})
})

