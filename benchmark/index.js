var Benchmark = require('benchmark');
const { default: template, compile } = require("../");
const _ = require("lodash")
const { readFileSync } = require("fs");
const { resolve } = require("path");

let getMock = (name) => readFileSync(resolve(__dirname, name), "utf8")

let tmpls = [
	["10", getMock("10.tmpl")],
	// ["50", getMock("50.tmpl")],
	["200", getMock("200.tmpl")],
	// ["500", getMock("500.tmpl")],
	["1000", getMock("1000.tmpl")],
	// ["2000", getMock("2000.tmpl")]
]

let data = {
	name: "<<Alice&Bob>>",
	desc: "How do Alice and Bob prevent Truck",
	tags: [
		"HASH",
		"MAC",
		"RSA",
		"Digital Signature",
		"CA"
	]
}

for (let t of tmpls) {
	let [lines, tmpl] = t
	new Benchmark.Suite()
		.add(`lodash-template [compile] [Number Of Lines:${lines}]`, function () {
			_.template(tmpl)
		})
		.add(`light-template [compile] [Number Of Lines:${lines}]`, function () {
			template(tmpl)
		})
		.on('error', function (event) {
			console.log(event)
		})
		.on('cycle', function (event) {
			console.log(String(event.target));
		})
		.on('complete', function () {
			console.log('Fastest is ' + this.filter('fastest').map('name'));
		})
		.run({ 'async': false });

	console.log("\n")
	let lodashRender = _.template(tmpl, { variable: "data" })
	let lightRender = template(tmpl, { variable: "data" })
	// console.log(lodashRender.source)
	// console.log(lightRender.source)
	new Benchmark.Suite()
		.add(`lodash-template [render] [Number Of Lines:${lines}]`, function () {
			lodashRender(data)
		})
		.add(`light-template [render] [Number Of Lines:${lines}]`, function () {
			lightRender.render(data)
		})
		.on('error', function (event) {
			console.log(event)
		})
		.on('cycle', function (event) {
			console.log(String(event.target));
		})
		.on('complete', function () {
			console.log('Fastest is ' + this.filter('fastest').map('name'));
		})
		.run({ 'async': false });
	console.log("\n")
}


