import { FactorNode, InterpolateNode, EscapeNode, EvaluateNode, TemplateNode, FactorsNode } from "./ast"
import { Token } from "./lexer"
import { assert } from "@light0x00/shim"

interface ASTVisitor {
	visitFactorNode(node: FactorNode): any
	visitInterpolateNode(node: InterpolateNode): any
	visitEscapeNode(node: EscapeNode): any
	visitEvaluateNode(node: EvaluateNode): any
	visitFactorsNode(node: FactorsNode): any
	visitTemplateNode(node: TemplateNode): any
}

const VAR_ESCAPE = "__e"
const VAR_RUNTIME = "__r"
const VAR_TMPL = "__p"
const VAR_TMP = "__t"
const VAR_DATA = "data"

function assertHasNoVariableConflict(variable: string) {
	let builtInVars = [VAR_ESCAPE, VAR_RUNTIME, VAR_TMP, VAR_TMPL]
	return assert(builtInVars.indexOf(variable) < 0, `The specified variable name(${variable}) of data has conflict with built-in variables(${builtInVars.join(",")})!`)
}

export class CodegenVisitor implements ASTVisitor {

	//函数声明
	private _source_head: string
	//变量声明部分
	private _source_decls: string
	//启用的内置函数
	private _source_libs: string[] = []
	//拼接模版部分
	private _source_body = ""
	//函数返回
	private _source_tail: string

	//内置函数
	private readonly libs = {
		print: { enable: false, code: `\nfunction print(){ for(let a of arguments) ${VAR_TMPL}+=(a==undefined)?'':a }` },
	}

	//data的变量名,可由用户指定`variable`,默认为data
	private argVar: string = VAR_DATA

	//是否启用with 如果未指定`variable`,则默认启用
	private useWith: boolean = true
	//是否处于拼接状态 (详见 `join()`)
	private isJoin: boolean = false

	//AST
	private template: TemplateNode

	constructor(template: TemplateNode, dataVariable?: string) {
		this.template = template
		if (dataVariable != undefined) {
			assertHasNoVariableConflict(dataVariable)
			this.argVar = dataVariable
			this.useWith = false
		}
		this._source_head = `(${VAR_RUNTIME})=>function(${this.argVar}){`
		this._source_decls = `\nlet ${VAR_TMP},${VAR_TMPL} = "",${VAR_ESCAPE}=${VAR_RUNTIME}.escape`
		this._source_tail = `\nreturn ${VAR_TMPL}\n}`
	}

	apply() {
		this.visitTemplateNode(this.template)
		return this._source_head + this._source_decls + this._source_libs.join("") + this._source_body + this._source_tail
	}

	private join(code: string) {
		if (this.isJoin) {
			this._source_body += "+"
		} else {
			this._source_body += `\n${VAR_TMPL}+=`
			this.isJoin = true
		}
		this._source_body += code
	}

	visitFactorNode(node: FactorNode) {
		if (node.factor instanceof Token) {
			this.join(`"${node.factor.lexeme}"`) //注: 分词的时候已经转义
		} else if (node.factor instanceof InterpolateNode) {
			this.visitInterpolateNode(node.factor)
		} else if (node.factor instanceof EscapeNode) {
			this.visitEscapeNode(node.factor)
		} else if (node.factor instanceof EvaluateNode) {
			this.visitEvaluateNode(node.factor)
		} else {
			throw new Error("parse error")
		}
	}
	visitInterpolateNode(node: InterpolateNode) {
		this.join(`((${VAR_TMP} = ${node.code} ) == null ? '' : ${VAR_TMP})`)
	}
	visitEscapeNode(node: EscapeNode) {
		this.join(`${VAR_ESCAPE}( ${node.code} )`)
	}
	visitEvaluateNode(node: EvaluateNode) {
		this.isJoin = false
		if (!this.libs.print.enable) {
			this._source_libs.push(this.libs.print.code)
			this.libs.print.enable = true
		}
		this._source_body += "\n" + node.code.lexeme
	}
	visitFactorsNode(node: FactorsNode) {
		if (node.factor != undefined)
			this.visitFactorNode(node.factor)
		if (node.nextFactors != undefined)
			this.visitFactorsNode(node.nextFactors)
	}
	visitTemplateNode(node: TemplateNode) {

		if (this.useWith) {
			this._source_body += `\nwith (${this.argVar}) {`
		}
		//拼接
		this.visitFactorsNode(node.factors)

		if (this.useWith) {
			this._source_body += "\n}"
		}

	}

}