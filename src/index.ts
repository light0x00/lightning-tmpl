import { Lexer } from "./lexer"
import parser from "./parser"
import { codegen } from "./interp"
import runtime from "./runtime"
import { SourceMapGenerator } from "source-map"
import { Base64 } from "js-base64"

export { runtime }

export class TemplateExecutor {
	private _source: string
	private fn: (context: any) => (data: any) => string
	constructor(source: string) {
		this._source = source
		try {
			this.fn = eval(source)
		} catch (e) {
			throw new Error("[Template Syntax Error]\n" + e)
		}
	}
	get source() {
		return this._source
	}
	render(data: any): string {
		return this.fn(runtime)(data)
	}
}

export type TemplateSettings = {
	variable?: string,
	useWith?: boolean,
	soureMap?: boolean,
	sourceName?: string,
	sourceLoader?: SourceLoader,
}

export default function template(tmpl: string, options?: TemplateSettings): TemplateExecutor {
	return new TemplateExecutor(compile(tmpl, options))
}

export type SourceLoader = (sourceName: string) => string

const DEFAULT_SOURCE_LOADER = (sourceName: string) => { throw new Error("Failed to load subtemplate `" + sourceName + "`, source loader is not specified!") }

export function compile(tmpl: string, settings?: TemplateSettings): string {
	let entrySourceName = settings?.sourceName ?? "anonymous.tmpl"
	let sourceMapGenerator: undefined | SourceMapGenerator
	if (settings?.soureMap) {
		sourceMapGenerator = new SourceMapGenerator()
		sourceMapGenerator.setSourceContent(entrySourceName, tmpl)
	}
	let compileSettings = {
		variable: settings?.variable ?? "data",
		soureMap: settings?.soureMap ?? false,
		useWith: settings?.useWith ?? false,
		sourceName: entrySourceName,
		sourceLoader: settings?.sourceLoader ?? DEFAULT_SOURCE_LOADER,
		onLoadSource: (source: string, sourceName: string) => {
			if (sourceMapGenerator)
				sourceMapGenerator.setSourceContent(sourceName, source)
		}
	}
	let { source, mappings } = compile0(tmpl, compileSettings)
	if (sourceMapGenerator) {
		for (let m of mappings)
			sourceMapGenerator.addMapping(m)
		let sourceMap = sourceMapGenerator.toString()
		source += "\n" + "//# sourceMappingURL=data:application/json;charset=utf-8;base64," + Base64.btoa(sourceMap)
	}
	return source
}

function compile0(entry: string, settings: {
	variable: string,
	useWith: boolean,
	soureMap: boolean,
	sourceName: string,
	sourceLoader: SourceLoader,
	onLoadSource: (source: string, sourceName: string) => void
}) {
	let ast = parser.parse(new Lexer(entry, settings.sourceName))
	let codegenOptions = {
		variable: settings.variable,
		useWith: settings.useWith,
		soureMap: settings.soureMap,
	}
	let astLoader = ((sourceName: string) => {
		let source = settings.sourceLoader(sourceName)
		settings.onLoadSource(source, sourceName)
		return parser.parse(new Lexer(source, sourceName))
	})
	return codegen(ast, { ...codegenOptions, astLoader })
}