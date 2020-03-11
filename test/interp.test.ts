import { Lexer } from "~/lexer"
import parser from "~/parser"
import { CodegenVisitor } from "~/interp"
import should from "should"

const getInterpResult = (text: string) => {
	return new CodegenVisitor(
		parser.parse(new Lexer(text,"")),
		{ loader: (s) => { throw new Error("ASTLoader Not Implement") } }
	).apply()
}

describe(`Interpreter Test`, () => {

	it("有脚本块时,应该插入`print`函数", () => {
		let r = getInterpResult(`<% print("Hello") %>`)
		should(r).assert(r.indexOf("function print") >= 0)
	})

	it("没有脚本块时,不应该插入`print`函数", () => {
		let r = getInterpResult(`<%= "Hello" %>`)
		should(r).assert(r.indexOf("function print") < 0)
	})

})

