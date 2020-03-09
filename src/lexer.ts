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

	setLocation(lineBegin: number, colBegin: number, lineEnd: number, colEnd: number) {
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
const EOF_CHR = ""

class Reader {
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
	peek(i = 0): string {
		return this.index == this.text.length ? "" : this.text[this.index + i]
	}
	readArea(length :number):string{
		return this.text.substr(this.index,length)
	}
}

export let CONTENT = new TokenPro("Content")
export let IN_DS = new TokenPro("<%=")  //INTERPOLATE_DELIMITER_START
export let ES_DS = new TokenPro("<%-") //ESCAPE_DELIMITER_START
export let EV_DS = new TokenPro("<%")  //EVALUATE_DELIMITER_START
export let DE = new TokenPro("%>") //DELIMITER_END

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
		while (this._buffer.size() <= i) {
			this._buffer.enqueue(this.createToken())
		}
	}
	protected abstract createToken(): T
}

export class Lexer extends AbstractLexer<Token>{

	private reader: Reader
	private _hasMore = true

	private _lineCount = 1
	private _colOffset = 1

	constructor(text: string) {
		super()
		this.reader = new Reader(text)
	}

	protected hasMore(): boolean {
		return this._hasMore
	}

	private readChr() {
		if (this.peekChr() != "\n") {
			this._colOffset += 1
		} else {
			this._lineCount += 1
			this._colOffset = 1
		}
		return this.reader.read()
	}

	private peekChr(i = 0) {
		return this.reader.peek(i)
	}

	createToken(): Token {
		let lineBegin = this._lineCount, colBegin = this._colOffset

		let look = this.peekChr()

		let result: Token
		if (look == "<") {
			result = this.delimiterStart()
		} else if (look == "%") {
			result = this.delimiterEnd()
		} else if (look != EOF_CHR) {
			result = this.content()
		}
		//EOF
		else {
			this._hasMore = false
			result = new Token(EOF_CHR, EOF)
		}

		let lineEnd = this._lineCount, colEnd = this._colOffset - 1
		result.setLocation(lineBegin, colBegin, lineEnd, colEnd)
		return result
	}

	private isOuterIfDelimiter: boolean = true

	private delimiterStart(): Token {
		/* 
		默认: this.peekChr(0) == "<"
		*/
		if (this.peekChr(1) == "%") {
			this.readChr() // <
			this.readChr() // %
			this.isOuterIfDelimiter = false
			if (this.peekChr(0) == "-") {
				this.readChr() // -
				return new Token("<%-", ES_DS)
			} else if (this.peekChr(0) == "=") {
				this.readChr() // =
				return new Token("<%=", IN_DS)
			} else {
				return new Token("<%", EV_DS)
			}
		} else {
			return this.content()!
		}
	}

	private delimiterEnd(): Token {
		/* 
		默认: this.peekChr(0) == "%"
		*/
		if (this.peekChr(1) == ">") {
			this.readChr()  // %
			this.readChr()  // >
			this.isOuterIfDelimiter = true
			return new Token("%>", DE)
		} else {
			return this.content()!
		}
	}
	// 对包含「 " 」的字符串 转义

	private content(): Token {
		/* 
		进入此状态,默认已经有一个字符满足下列条件:
		not < 
		not %
		not \
		not EOF
		*/
		let lexeme = ""

		while (this._hasMore) {
			//
			if ((this.peekChr(0) == "<") || (this.peekChr(0) == "%")) {
				if (this.peekChr(1) == "%" || this.peekChr(1) == ">") {
					break
				} else {
					lexeme += this.readChr()
				}
			}
			// else if (this.peekChr(0) == "%") {
			// 	if (this.peekChr(1) == ">") {
			// 		break
			// 	}
			// 	else {
			// 		lexeme += this.readChr()
			// 	}
			// }
			else if (this.peekChr(0) != EOF_CHR) {
				/* 
				1. \n 转义为字符 "\n"
				2. 「"」转义为 「\"」 (对代码块之外)
				3. \<% \%> 去掉「\」
				*/
				if (this.peekChr(0) == "\n") {
					this.readChr()
					lexeme += "\\n"
				}
				//  " => \"
				else if (this.peekChr(0) == "\"" && this.isOuterIfDelimiter) {
					this.readChr()
					lexeme += "\\\""
				}
				// \<% or \%>
				else if (
					this.peekChr(0) == "\\" &&
					((this.peekChr(1) == "<" && this.peekChr(2) == "%") ||
						(this.peekChr(1) == "%" && this.peekChr(2) == ">"))
				) {
					this.readChr()  //丢弃转义符号 `\`
					lexeme += this.readChr() + this.readChr() //消费 `<%` or `%>`
				} else {
					lexeme += this.readChr()
				}
			}
			//EOF
			else {
				break
			}
		}
		return new Token(lexeme, CONTENT)
	}

}