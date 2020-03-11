import { TokenPro, IToken, Terminal, EOF } from "@parser-generator/definition"
import Queue from "typescript-collections/dist/lib/Queue"
import { MutableString } from "./common"

const DEFAULT_SOURCE_NAME = "anonymous.tmpl"

export class Token implements IToken {

	private _lexeme: string
	private _proto: Terminal

	private _sourceName: string = DEFAULT_SOURCE_NAME

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
	get sourceName() {
		return this._sourceName
	}
	set sourceName(source: string) {
		this._sourceName = source
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

const EOF_CHR = ""

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

	//处理状态
	private text: string
	private lastIndex = 0
	private _hasMore = true

	//行列计数
	private _lineCount = 1
	private _colOffset = 1

	private _sourceNmae: string

	constructor(text: string, sourceName: string = DEFAULT_SOURCE_NAME) {
		super()
		this.text = text
		this._sourceNmae = sourceName
	}

	protected hasMore(): boolean {
		return this._hasMore
	}

	private readChr() {
		let chr = this.peekChr()
		if (chr != "\n") {
			this._colOffset += 1
		} else {
			this._lineCount += 1
			this._colOffset = 1
		}
		++this.lastIndex
		// return chr
	}

	private peekChr(i = 0) {
		return this.lastIndex == this.text.length ? EOF_CHR : this.text[this.lastIndex + i]
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
		result.sourceName = this._sourceNmae
		return result
	}

	private isOuterOfDelimiter: boolean = true

	private delimiterStart(): Token {
		/* 
		默认: this.peekChr(0) == "<"
		*/
		if (this.peekChr(1) == "%") {
			this.readChr() // <
			this.readChr() // %
			this.isOuterOfDelimiter = false
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
			this.isOuterOfDelimiter = true
			return new Token("%>", DE)
		} else {
			return this.content()!
		}
	}
	private content(): Token {
		let startIndex = this.lastIndex
		let replaces: [number, string][] = [] /* 记录当前token中需要转义、反转义的字符 */
		while (this._hasMore) {
			if ((this.peekChr(0) == "<" && this.peekChr(1) == "%") || (this.peekChr(0) == "%" && this.peekChr(1) == ">")) {
				break
			}
			/* 
			1. \n 转义为字符 "\n"					多一个字符
			2. 「"」转义为 「\"」 (对代码块之外)		多一个字符
			3. \<% \%> 去掉「\」					少一个字符
			*/
			else if (this.peekChr(0) == "\n"  && this.isOuterOfDelimiter ) {
				replaces.push([this.lastIndex, "\\n"])
				this.readChr()
			}
			//  " => \"
			else if (this.peekChr(0) == "\"" && this.isOuterOfDelimiter) {
				replaces.push([this.lastIndex, "\\\""])
				this.readChr()
			}
			// \<% or \%>
			else if (
				this.peekChr(0) == "\\" &&
				((this.peekChr(1) == "<" && this.peekChr(2) == "%") ||
					(this.peekChr(1) == "%" && this.peekChr(2) == ">"))
			) {
				replaces.push([this.lastIndex, ""])
				this.readChr()
				this.readChr()	// `<` or `%`
				this.readChr()  // `%` or `>`

			} else if (this.peekChr(0) != EOF_CHR) {
				this.readChr()
			}
			//EOF
			else {
				break
			}
		}
		let lexeme = MutableString.replaceSubstring(this.text, replaces, startIndex, this.lastIndex)
		return new Token(lexeme, CONTENT)
	}

}