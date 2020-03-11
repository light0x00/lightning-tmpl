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

function assertHasNoVariableConflict(variable: string) {
	let builtInVars = [VAR_ESCAPE, VAR_RUNTIME, VAR_TMP, VAR_TMPL]
	return assert(builtInVars.indexOf(variable) < 0, `The specified variable name(${variable}) of data has conflict with built-in variables(${builtInVars.join(",")})!`)
}

export class CodegenVisitor implements ASTVisitor {

	protected source: string[]
	//是否处于拼接状态 (详见 `join()`)
	private isContact: boolean
	//是否植入print函数
	private enablePrint: boolean
	//AST
	private template: TemplateNode

	private astLoader: ASTLoader

	beforeAppend?(generated: string, original: Token, needMapping: boolean): void

	constructor(template: TemplateNode, options: { loader: ASTLoader }, context = { enablePrint: false, isContact: false, source: [] }) {
		this.template = template
		this.astLoader = options.loader
		this.source = context.source
		this.isContact = context.isContact
		this.enablePrint = context.enablePrint
	}

	apply(): string {
		this.visitTemplateNode(this.template)
		return this.source.join("")
	}

	private append(generated: string, original: Token, needMapping = false) {
		if (this.beforeAppend)
			this.beforeAppend(generated, original, needMapping)
		this.source.push(generated)
	}

	private contact(code: string, original: Token, needMapping = false) {
		let generated
		if (this.isContact) {
			generated = "+" + code
		} else {
			this.isContact = true
			generated = `${VAR_TMPL}+=${code}`
		}
		this.append(generated, original, needMapping)
	}

	visitImportNode(node: any) {
		//0.如果loader为空,则说明不支持子模版,抛出异常
		//1.调用 template-loader 传入sourceName, 得到AST
		//2.new CodegenVisitor(AST,this.context).apply()
	}

	visitFactorNode(node: FactorNode) {
		if (node.factor instanceof Token) {
			this.contact(`"${node.factor.lexeme}"`, node.factor)//注: 分词的时候已经转义
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
		this.contact(`((${VAR_TMP} = ${node.code} ) == null ? '' : ${VAR_TMP})`, node.code, true)
	}
	visitEscapeNode(node: EscapeNode) {
		this.contact(`${VAR_ESCAPE}( ${node.code} )`, node.code, true)
	}
	visitEvaluateNode(node: EvaluateNode) {
		this.isContact = false
		if (!this.enablePrint) {
			this.append(`\nfunction print(){ for(let a of arguments) ${VAR_TMPL}+=(a==undefined)?'':a };`, node.code)
			this.enablePrint = true
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

export type ASTLoader = (sourceName: string, caller: string) => TemplateNode

export type CodegenOptions = {
	variable: string,
	useWith: boolean,
	soureMap: boolean,
	astLoader: ASTLoader,
}

export function codegen(ast: TemplateNode, options: CodegenOptions) {

	assertHasNoVariableConflict(options.variable)

	let visitor = new CodegenVisitor(ast, { loader: options.astLoader })

	let sourceHead = "", sourceBody = "", sourceTail = ""
	//头
	sourceHead = `(${VAR_RUNTIME})=>function(${options.variable}){\n` +
		`let ${VAR_TMP},${VAR_TMPL} = "",${VAR_ESCAPE}=${VAR_RUNTIME}.escape;\n`
	let lineOffset = 3
	if (options.useWith) {
		sourceHead += `with (${options.variable}) {\n`
		lineOffset += 1
	}
	//收集模版到源码的映射信息
	let sourceMapper: SourceMapMapper | undefined
	if (options.soureMap) {
		sourceMapper = new SourceMapMapper(lineOffset, 0)
		visitor.beforeAppend = function (g: string, o: Token, n: boolean) {
			sourceMapper!.onAppend(g, o, n)
		}
	}
	//体
	sourceBody = visitor.apply()

	//尾
	if (options.useWith) {
		sourceTail += "\n}"
	}
	sourceTail += `\nreturn ${VAR_TMPL}}`
	let source = `${sourceHead}${sourceBody}${sourceTail}`
	return {
		source,
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