import { GeneralReader, Lexer } from "~/lexer"
import { EOF } from "@parser-generator/definition"
import should from "should"

describe(`Lexer Test`, () => {

	let getLexemes = (text: string) => {
		let result = []
		let lexer = new Lexer(new GeneralReader(text))
		for (let t = lexer.next(); t.proto != EOF; t = lexer.next()) {
			result.push(t.lexeme)
		}
		return result
	}

	it(`case1 interpolate script`, () => {
		let actuality = getLexemes(`<%=user.name%>`)
		let expectation = ["<%=", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

	it(`case2 escape script`, () => {
		let actuality = getLexemes(`<%-user.name%>`)
		let expectation = ["<%-", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

	it(`case3 evaluate script`, () => {
		let actuality = getLexemes(`<%user.name%>`)
		let expectation = ["<%", "user.name", "%>"]
		should(actuality).eql(expectation)
	})

	it(`case4 mix`, () => {
		let actuality = getLexemes(`<h1><%= user.name %></h1><p><%- user.desc %></p><% print("hello") %>`)
		let expectation = [
			"<h1>",
			"<%=", " user.name ", "%>",
			"</h1><p>",
			"<%-", " user.desc ", "%>",
			"</p>",
			"<%", ` print("hello") `, "%>"
		]
		should(actuality).eql(expectation)
	})

	it(`case5 mix`, () => {
		let actuality = getLexemes(`
<% for(let i=0;i<users;i++){ %>
	<h1><%= users[i].name %></h1>
	<p><%- users[i].desc %></p>
<% } %>
`
		)
		let expectation = [
			"\n",
			"<%",
			" for(let i=0;i<users;i++){ ",
			"%>",
			"\n\t<h1>",
			"<%=", " users[i].name ", "%>", "</h1>" +
			"\n\t<p>", "<%-", " users[i].desc ", "%>", "</p>\n",
			"<%", " } ", "%>", "\n"
		]
		should(actuality).eql(expectation)
	})

})

describe(`Lexer Extension Test`, () => {
	let getLocaltions = (text: string) => {
		let result = []
		let lexer = new Lexer(new GeneralReader(text))
		for (let t = lexer.next(); t.proto != EOF; t = lexer.next()) {
			result.push([t.lexeme, t.lineBegin, t.colBegin, t.lienEnd, t.colEnd])
		}
		return result
	}

	it(`case1`, () => {
		let actuality = getLocaltions(`<%=
user.name %>
`
		)
		let expectation = [
			["<%=", 1, 1, 1, 3],
			["\nuser.name ", 1, 4, 2, 10],
			["%>", 2, 11, 2, 12],
			["\n", 2, 13, 3, 0],
		]
		should(actuality).eql(expectation)
	})

	it(`case2`, () => {
		let actuality = getLocaltions(`
<h1>
	<%= user.name %>
</h1>
`
		)
		let expectation = [
			["\n<h1>\n\t", 1, 1, 3, 1],
			["<%=", 3, 2, 3, 4],
			[" user.name ", 3, 5, 3, 15],
			["%>", 3, 16, 3, 17],
			["\n</h1>\n", 3, 18, 5, 0]
		]
		should(actuality).eql(expectation)
	})
})

