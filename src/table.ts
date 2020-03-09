import {
	NonTerminal,
	Production,
	SymbolWrapper,
	EOF,
	ParsingTable,
	Goto, Shift, Accept, Reduce, NIL
} from "@parser-generator/definition"

import {
	CONTENT,
	IN_DS,
	ES_DS,
	EV_DS,
	DE
} from "./lexer"

import {
	FactorNode,
	FactorsNode,
	InterpolateNode,
	EscapeNode,
	EvaluateNode,
	TemplateNode
} from "./ast"

/****************************************
Grammar
****************************************/
let S = new NonTerminal("S")
let template = new NonTerminal("template")
let factors = new NonTerminal("factors")
let factor = new NonTerminal("factor")
let interpolate = new NonTerminal("interpolate")
let escape = new NonTerminal("escape")
let evaluate = new NonTerminal("evaluate")
/* (0) S->template */
let p0 = new Production(0,S,[
	new SymbolWrapper(template)],undefined,undefined)
/* (1) template->factors<%(e)=>new TemplateNode(e)%> */
let p1 = new Production(1,template,[
	new SymbolWrapper(factors)],undefined, (e)=>new TemplateNode(e) )
/* (2) factors->factorfactors<%(e)=>new FactorsNode(e)%> */
let p2 = new Production(2,factors,[
	new SymbolWrapper(factor),
	new SymbolWrapper(factors)],undefined, (e)=>new FactorsNode(e) )
/* (3) factors->NIL<%(e)=>new FactorsNode(e)%> */
let p3 = new Production(3,factors,[
	new SymbolWrapper(NIL)],undefined, (e)=>new FactorsNode(e) )
/* (4) factor->CONTENT<%(e)=>new FactorNode(e)%> */
let p4 = new Production(4,factor,[
	new SymbolWrapper(CONTENT)],undefined, (e)=>new FactorNode(e) )
/* (5) factor->interpolate<%(e)=>new FactorNode(e)%> */
let p5 = new Production(5,factor,[
	new SymbolWrapper(interpolate)],undefined, (e)=>new FactorNode(e) )
/* (6) factor->escape<%(e)=>new FactorNode(e)%> */
let p6 = new Production(6,factor,[
	new SymbolWrapper(escape)],undefined, (e)=>new FactorNode(e) )
/* (7) factor->evaluate<%(e)=>new FactorNode(e)%> */
let p7 = new Production(7,factor,[
	new SymbolWrapper(evaluate)],undefined, (e)=>new FactorNode(e) )
/* (8) interpolate->IN_DSCONTENTDE<%(e)=>new InterpolateNode(e)%> */
let p8 = new Production(8,interpolate,[
	new SymbolWrapper(IN_DS),
	new SymbolWrapper(CONTENT),
	new SymbolWrapper(DE)],undefined, (e)=>new InterpolateNode(e) )
/* (9) escape->ES_DSCONTENTDE<%(e)=>new EscapeNode(e)%> */
let p9 = new Production(9,escape,[
	new SymbolWrapper(ES_DS),
	new SymbolWrapper(CONTENT),
	new SymbolWrapper(DE)],undefined, (e)=>new EscapeNode(e) )
/* (10) evaluate->EV_DSCONTENTDE<%(e)=>new EvaluateNode(e)%> */
let p10 = new Production(10,evaluate,[
	new SymbolWrapper(EV_DS),
	new SymbolWrapper(CONTENT),
	new SymbolWrapper(DE)],undefined, (e)=>new EvaluateNode(e) )
S.prods=[p0]
template.prods=[p1]
factors.prods=[p2,p3]
factor.prods=[p4,p5,p6,p7]
interpolate.prods=[p8]
escape.prods=[p9]
evaluate.prods=[p10]
let table = new ParsingTable()
table.put(0,template,new Goto(1))
table.put(0,factors,new Goto(2))
table.put(0,factor,new Goto(3))
table.put(0,EOF,new Reduce(p3))
table.put(0,CONTENT,new Shift(4))
table.put(0,interpolate,new Goto(5))
table.put(0,escape,new Goto(6))
table.put(0,evaluate,new Goto(7))
table.put(0,IN_DS,new Shift(8))
table.put(0,ES_DS,new Shift(9))
table.put(0,EV_DS,new Shift(10))
table.put(1,EOF,new Accept())
table.put(2,EOF,new Reduce(p1))
table.put(3,factors,new Goto(11))
table.put(3,factor,new Goto(3))
table.put(3,EOF,new Reduce(p3))
table.put(3,CONTENT,new Shift(4))
table.put(3,interpolate,new Goto(5))
table.put(3,escape,new Goto(6))
table.put(3,evaluate,new Goto(7))
table.put(3,IN_DS,new Shift(8))
table.put(3,ES_DS,new Shift(9))
table.put(3,EV_DS,new Shift(10))
table.put(4,CONTENT,new Reduce(p4))
table.put(4,IN_DS,new Reduce(p4))
table.put(4,ES_DS,new Reduce(p4))
table.put(4,EV_DS,new Reduce(p4))
table.put(4,EOF,new Reduce(p4))
table.put(5,CONTENT,new Reduce(p5))
table.put(5,IN_DS,new Reduce(p5))
table.put(5,ES_DS,new Reduce(p5))
table.put(5,EV_DS,new Reduce(p5))
table.put(5,EOF,new Reduce(p5))
table.put(6,CONTENT,new Reduce(p6))
table.put(6,IN_DS,new Reduce(p6))
table.put(6,ES_DS,new Reduce(p6))
table.put(6,EV_DS,new Reduce(p6))
table.put(6,EOF,new Reduce(p6))
table.put(7,CONTENT,new Reduce(p7))
table.put(7,IN_DS,new Reduce(p7))
table.put(7,ES_DS,new Reduce(p7))
table.put(7,EV_DS,new Reduce(p7))
table.put(7,EOF,new Reduce(p7))
table.put(8,CONTENT,new Shift(12))
table.put(9,CONTENT,new Shift(13))
table.put(10,CONTENT,new Shift(14))
table.put(11,EOF,new Reduce(p2))
table.put(12,DE,new Shift(15))
table.put(13,DE,new Shift(16))
table.put(14,DE,new Shift(17))
table.put(15,CONTENT,new Reduce(p8))
table.put(15,IN_DS,new Reduce(p8))
table.put(15,ES_DS,new Reduce(p8))
table.put(15,EV_DS,new Reduce(p8))
table.put(15,EOF,new Reduce(p8))
table.put(16,CONTENT,new Reduce(p9))
table.put(16,IN_DS,new Reduce(p9))
table.put(16,ES_DS,new Reduce(p9))
table.put(16,EV_DS,new Reduce(p9))
table.put(16,EOF,new Reduce(p9))
table.put(17,CONTENT,new Reduce(p10))
table.put(17,IN_DS,new Reduce(p10))
table.put(17,ES_DS,new Reduce(p10))
table.put(17,EV_DS,new Reduce(p10))
table.put(17,EOF,new Reduce(p10))

export default table