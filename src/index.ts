import { Lexer } from "./lexer"
import parser from "./parser"
import { CodegenVisitor } from "./interp"
import runtime from "./runtime"

export type TemplateOptions = {
	variable?: string
}

class TemplateExecutor {
	private _source: string
	private fn: (context: any) => (data: any) => string
	constructor(source: string) {
		this._source = source
		try {
			this.fn = eval(source)
		} catch (e) {
			throw new Error("There is a syntax error with the script block,error:\n" + e)
		}
	}
	get source() {
		return this._source
	}
	apply(data: any): string {
		return this.fn(runtime)(data)
	}
}

import debug from "debug"
let logger = debug("tmpl")

export function template(tmpl: string, options?: TemplateOptions): TemplateExecutor {
	logger("parse begin")
	let ast = parser.parse(new Lexer(tmpl))
	logger("parse end,interp begin")
	let source = new CodegenVisitor(ast, options?.variable).apply()
	logger("interp end")
	return new TemplateExecutor(source)
}
