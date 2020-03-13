import { FactorNode, InterpolateNode, EscapeNode, EvaluateNode, TemplateNode, FactorsNode, LinkNode } from "./ast"
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

function assertHasNoVariableConflict(variable: string) {
	let builtInVars = [VAR_ESCAPE, VAR_RUNTIME, VAR_TMP, VAR_TMPL]
	return assert(builtInVars.indexOf(variable) < 0, `The specified variable name(${variable}) of data has conflict with built-in variables(${builtInVars.join(",")})!`)
}

type CodegenVisitorContext = {
	enablePrint: boolean,	//是否已经植入print函数
	isContact: boolean //是否处于拼接状态 (详见 `CodegenVisitor.contact()`)
}

type BeforeCodegenAppend = (generated: string, original: Token, needMapping: boolean) => void

export class CodegenVisitor implements ASTVisitor {

	protected tmplGenerated = ""
	private context: CodegenVisitorContext
	private template: TemplateNode
	private astLoader: ASTLoader
	private beforeAppend: BeforeCodegenAppend

	constructor(template: TemplateNode, options: { loader: ASTLoader, beforeAppend: BeforeCodegenAppend }, context = { enablePrint: false, isContact: false }) {
		this.template = template
		this.astLoader = options.loader
		this.beforeAppend = options.beforeAppend
		this.context = context
	}

	apply(): string {
		this.visitTemplateNode(this.template)
		return this.tmplGenerated
	}

	private append(generated: string, original: Token, needMapping = false) {
		this.beforeAppend(generated, original, needMapping)
		this.tmplGenerated += generated
	}

	private contact(code: string, original: Token, needMapping = false) {
		let generated
		if (this.context.isContact) {
			generated = "+" + code
		} else {
			this.context.isContact = true
			generated = `${VAR_TMPL}+=${code}`
		}
		this.append(generated, original, needMapping)
	}

	visitLinkNode(node: LinkNode) {
		let sourceName = node.sourceNameToken.lexeme.trim()
		// console.log("导入:\n" + sourceName)
		let ast = this.astLoader(sourceName)
		let subTmplGenerated = new CodegenVisitor(ast, { loader: this.astLoader, beforeAppend: this.beforeAppend }, this.context).apply()
		this.tmplGenerated += subTmplGenerated
	}

	visitFactorNode(node: FactorNode) {
		if (node.factor instanceof Token) {
			this.contact(`"${node.factor.lexeme}"`, node.factor)
		} else if (node.factor instanceof InterpolateNode) {
			this.visitInterpolateNode(node.factor)
		} else if (node.factor instanceof EscapeNode) {
			this.visitEscapeNode(node.factor)
		} else if (node.factor instanceof EvaluateNode) {
			this.visitEvaluateNode(node.factor)
		} else if (node.factor instanceof LinkNode) {
			this.visitLinkNode(node.factor)
		}
		else {
			throw new Error("parse error")
		}
	}
	visitInterpolateNode(node: InterpolateNode) {
		this.contact(`((${VAR_TMP} = ${node.code} ) == null ? '' : ${VAR_TMP})`, node.code, true)
	}
	visitEscapeNode(node: EscapeNode) {
		this.contact(`${VAR_ESCAPE}( ${node.code} )`, node.code, true)
	}
	visitEvaluateNode(node: EvaluateNode) {
		this.context.isContact = false
		if (!this.context.enablePrint) {
			this.append(`\nfunction print(){ for(let a of arguments) ${VAR_TMPL}+=(a==undefined)?'':a };`, node.code)
			this.context.enablePrint = true
		}
		this.append("\n", node.code)
		this.append(node.code.lexeme + "\n", node.code, true)
	}
	visitFactorsNode(node: FactorsNode) {
		if (node.factor != undefined)
			this.visitFactorNode(node.factor)
		if (node.nextFactors != undefined)
			this.visitFactorsNode(node.nextFactors)
	}
	visitTemplateNode(node: TemplateNode) {
		this.visitFactorsNode(node.factors)
	}
}

export type ASTLoader = (sourceName: string) => TemplateNode

export type CodegenOptions = {
	variable: string,
	useWith: boolean,
	soureMap: boolean,
	astLoader: ASTLoader,
	sourceName: string
}

export function codegen(ast: TemplateNode, options: CodegenOptions) {

	assertHasNoVariableConflict(options.variable)

	let sourceHead = "", sourceBody = "", sourceTail = ""
	//head
	sourceHead = `(${VAR_RUNTIME})=>function(${options.variable}){\n` +
		`let ${VAR_TMP},${VAR_TMPL} = "",${VAR_ESCAPE}=${VAR_RUNTIME}.escape;\n`
	let lineOffset = 3
	if (options.useWith) {
		sourceHead += `with (${options.variable}) {\n`
		lineOffset += 1
	}

	//body
	let sourceMapper = options.soureMap ? new SourceMapMapper(lineOffset, 0) : undefined
	let visitor = new CodegenVisitor(ast, {
		loader: options.astLoader,
		beforeAppend(g: string, o: Token, n: boolean) {
			if (options.soureMap) {
				sourceMapper!.onAppend(g, o, n) //收集模版到源码的映射信息
			}
		}
	})
	sourceBody = visitor.apply()

	//tail
	if (options.useWith) {
		sourceTail += "\n}"
	}
	sourceTail += `\nreturn ${VAR_TMPL}}`

	return {
		source: `${sourceHead}${sourceBody}${sourceTail}`,
		mappings: sourceMapper != undefined ? sourceMapper.mappings : []
	}
}

type SourceMapping = {
	source: string,
	original: { line: number, column: number },
	generated: { line: number, column: number }
}
class SourceMapMapper {
	private line: number
	private column: number

	constructor(lineOffset: number = 0, columnOffset: number = 0) {
		this.line = lineOffset
		this.column = columnOffset
	}

	private _mappings: SourceMapping[] = []
	get mappings(): SourceMapping[] {
		return this._mappings
	}
	onAppend(generated: string, original: Token, needMapping: boolean) {
		if (needMapping) {
			this._mappings.push({
				source: original.sourceName, //从token拿
				original: { line: original.lineBegin, column: original.colBegin },
				generated: { line: this.line, column: this.column }
			})
			// console.log(original.lexeme + `(${original.lineBegin},${original.colBegin}) => (${this.line},${this.column})`)
		}
		for (let chr of generated) {
			if (chr == "\n") {
				++this.line
				this.column = 0
			} else {
				++this.column
			}
		}
	}
}