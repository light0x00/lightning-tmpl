// const { default: template  } = require("../");
const { Lexer } = require("../lib/cjs/lexer");
const { default: parser } = require("../lib/cjs/parser");
const { CodegenVisitor } = require("../lib/cjs/interp");
const { readFileSync } = require("fs");
const { resolve } = require("path");

let getMock = (name) => readFileSync(resolve(__dirname, name), "utf8")

let tmpl = getMock(`1000.tmpl`)

class Timer {
	constructor(name){
		this.name = name
	}
	start() {
		this.lastTime = Date.now()
	}
	end() {
		let time = Date.now()
		console.log(this.name," elapsed time: ", time - this.lastTime)
	}
}

function lexerTest(times) {
	let timer = new Timer("lexer")
	timer.start()
	for (let i = 0; i < times; i++) {
		let lex = new Lexer(tmpl)
		while (lex.hasMore()) {
			lex.next()
		}
	}
	timer.end()
}



function parseTest(times) {
	let timer = new Timer("lexer+parser")
	timer.start()
	for (let i = 0; i < times; i++)
		parser.parse(new Lexer(tmpl))
	timer.end()
}

function interpTest(times) {
	let timer = new Timer("lexer+parser+interp")
	timer.start()
	for (let i = 0; i < times; i++) {
		let ast = parser.parse(new Lexer(tmpl))
		new CodegenVisitor(ast, { beforeAppend() { } }).apply()
	}
	timer.end()
}

lexerTest(10)
interpTest(10)
parseTest(10)

console.log("After JIT")

lexerTest(10)
parseTest(10)
interpTest(10)
