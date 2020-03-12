const { default: template, compile, runtime }  = require("../")
const { readFileSync } = require("fs")
const { resolve } = require("path")

//模版加载器
let TMPL_ROOT = resolve(__dirname, "./tmpls")
let sourceLoader = (name) => readFileSync(resolve(TMPL_ROOT, name), "utf8")

//入口模版
let entry = sourceLoader("index.html")

//编译
let exe = template(entry, { variable: "article", soureMap: true, sourceLoader })

//数据
let data = {
	title: "XX Tutorial",
	content: "XX is good technology,since...",
	tags: ["eazy", "funny", "popular"],
	comments: [
		{ user: "Alice", content: "Wow,Cool!" },
		{ user: "Bob", content: "Thank you. I've learned a lot." },
		{ user: "Trunk", content: "Oh,What the fucking tutotial,I can't understand it." },
		{ user: "Keyboard Man", content: "XX is shit, YY is better." },
	]
}

//渲染
let result = exe.render(data)

console.log(result)