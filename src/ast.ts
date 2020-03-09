import { ASTElement } from "@parser-generator/definition"
import { Token } from "./lexer"

abstract class ASTNode {
	protected readonly children: ASTElement[]
	constructor(eles: ASTElement[]) {
		this.children = eles
	}

}

export class FactorNode extends ASTNode {
	get factor() {
		return this.children[0]
	}
}

export class FactorsNode extends ASTNode {
	get factor(): FactorNode | undefined {
		return this.children.length > 0 ? this.children[0] as FactorNode : undefined
	}

	get nextFactors(): FactorsNode | undefined {
		return this.children.length > 1 ? this.children[1] as FactorsNode : undefined
	}
}

export class InterpolateNode extends ASTNode {
	get code(): Token {
		return this.children[1] as Token
	}
}

export class EscapeNode extends ASTNode {
	get code(): Token {
		return this.children[1] as Token
	}
}

export class EvaluateNode extends ASTNode {
	get code(): Token {
		return this.children[1] as Token
	}
}

export class TemplateNode extends ASTNode {
	get factors(): FactorsNode {
		return this.children[0] as FactorsNode
	}
}
