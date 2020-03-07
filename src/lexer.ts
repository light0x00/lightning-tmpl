import { TokenPro, IToken, Terminal, ILexer, EOF } from "@parser-generator/definition"
import Queue from "typescript-collections/dist/lib/Queue"

export class Token implements IToken {

	private _lexeme: string
	private _proto: Terminal

	private _lineBegin = -1
	private _colBegin = -1
	private _lineEnd = -1
	private _colEnd = -1

	constructor(lexeme: string, proto?: TokenPro) {
		this._lexeme = lexeme
		this._proto = proto ?? lexeme
	}

	get lexeme() {
		return this._lexeme
	}
	get proto() {
		return this._proto
	}
	get lineBegin() {
		return this._lineBegin
	}
	get colBegin() {
		return this._colBegin
	}
	get lienEnd() {
		return this._lineEnd
	}
	get colEnd() {
		return this._colEnd
	}

	key(): Terminal {
		return this._proto
	}

	setLocaltion(lineBegin: number, colBegin: number, lineEnd: number, colEnd: number) {
		this._lineBegin = lineBegin
		this._colBegin = colBegin
		this._lineEnd = lineEnd
		this._colEnd = colEnd
	}
	getLocation() {
		return `(${this._lineBegin},${this._colBegin}) ~ (${this._lineEnd},${this._colEnd})`
	}

	toString() {
		return this._lexeme
	}
}

type char = string
interface IReader {
	read(): char
	peek(): char
}

export class GeneralReader implements IReader {
	private text: string
	private index = 0
	constructor(text: string) {
		this.text = text
	}

	read(): string {
		let chr = this.peek()
		this.index++
		return chr
	}
	peek(): string {
		return this.index == this.text.length ? "" : this.text[this.index]
	}
}

export let CONTENT = new TokenPro("CONTENT")
export let INTERPOLATE_DELIMITER_START = new TokenPro("INTERPOLATE_DELIMITER_START")
export let ESCAPE_DELIMITER_START = new TokenPro("ESCAPE_DELIMITER_START")
export let EVALUATE_DELIMITER_START = new TokenPro("EVALUATE_DELIMITER_START")
export let DELIMITER_END = new TokenPro("DELIMITER_END")

abstract class AbstractLexer<T>{
	private _buffer = new Queue<T>();
	peek(): T {
		this.fill(0)
		return this._buffer.peek()!
	}
	next(): T {
		this.fill(0)
		return this._buffer.dequeue()!
	}
	private fill(i: number) {
		while (this._buffer.size() <= i ) {
			this._buffer.enqueue(this.createToken())
		}
	}
	protected abstract createToken(): T
}

export class Lexer extends AbstractLexer<Token>{

	private reader: IReader
	private current: char = ""
	private _hasMore = true

	private _lineCount = 1
	private _colOffset = 0

	constructor(reader: IReader) {
		super()
		this.reader = reader
		this.readChr()
	}

	protected hasMore(): boolean {
		return this._hasMore
	}

	protected getEOF(): Token {
		throw new Error("Method not implemented.")
	}

	private readChr() {
		if (this.current != "\n") {
			this._colOffset += 1
		} else {
			this._lineCount += 1
			this._colOffset = 1
		}
		this.current = this.reader.read()
		return this.current
	}

	private peekChr() {
		return this.reader.peek()
	}

	createToken(): Token {
		let lineBegin = this._lineCount, colBegin = this._colOffset

		let result: Token
		if (this.current == "<") {
			result = this.delimiterStart()
		} else if (this.current == "%") {
			result = this.delimiterEnd()
		} else if (this.current != "") {
			result = this.content()
		}
		//EOF
		else {
			this._hasMore = false
			result = new Token("", EOF)
		}

		let lineEnd = this._lineCount, colEnd = this._colOffset - 1
		result.setLocaltion(lineBegin, colBegin, lineEnd, colEnd)
		return result
	}

	private delimiterStart(): Token {
		if (this.peekChr() == "%") {
			this.readChr() // <
			this.readChr() // %
			if (this.current == "-") {
				this.readChr() // -
				return new Token("<%-", ESCAPE_DELIMITER_START)
			} else if (this.current == "=") {
				this.readChr() // =
				return new Token("<%=", INTERPOLATE_DELIMITER_START)
			} else {
				return new Token("<%", EVALUATE_DELIMITER_START)
			}
		} else {
			return this.content()!
		}
	}

	private delimiterEnd(): Token {
		if (this.peekChr() == ">") {
			this.readChr()  // %
			this.readChr()  // >
			return new Token("%>", DELIMITER_END)
		} else {
			return this.content()!
		}
	}

	private content(): Token {
		let lexeme = this.current
		while (this._hasMore) {
			this.readChr()
			if (this.current == "<") {
				if (this.peekChr() == "%") {
					break
				}
				else {
					lexeme += this.current
				}
			}
			else if (this.current == "%") {
				if (this.peekChr() == ">") {
					break
				}
				else {
					lexeme += this.current
				}
			}
			else if (this.current != "") {
				lexeme += this.current
			}
			//EOF
			else {
				break
			}
		}
		return new Token(lexeme,CONTENT)
	}

}