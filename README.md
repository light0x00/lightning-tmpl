# Light-Template

一个基于JavaScript的模版DSL

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<a href="https://travis-ci.com/light0x00/light-template"><img src="https://travis-ci.com/light0x00/light-template.svg?branch=master"></a> 
<a href="https://www.npmjs.com/package/light-template"><img src="https://img.shields.io/npm/v/light-template"></a>

## 特性

- 用原生JS控制模版的渲染
- 支持模版调试

![img](./docs/debug_demo.png)


## 安装

**npm**

```bash
npm install light-template
```

**browser**

```html
<script src="path/to/light-template.min.js"></script>
<script>
	let { default: template } = LIGHT_TEMPLATE
</script>
```

## 示例

```ts
import template from "light-template";

//模版
let tmpl =`<p><%- data.name %><p>
<p><%= data.desc %></p>
<ul><% for(let hobby of data.tags){ %>
<li><% print(hobby) %></li><% } %>
</ul>`
//数据
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
//编译
let executor = template(tmpl, { variable: "data", soureMap: true })
//执行
let result = executor.render(data)

console.log(result)
```

输出:

```html
<p>&lt;&lt;Alice&amp;Bob&gt;&gt;<p>
<p>How do Alice and Bob prevent Truck</p>
<ul>
<li>HASH</li>
<li>MAC</li>
<li>RSA</li>
<li>Digital Signature</li>
<li>CA</li>
</ul>
```

## 语法

语法基本与 [lodash.template](https://lodash.com/docs/4.17.15#template) 相同

**插值**

`<%=`,顾名思义,就是插入一个值

```ts
let tmpl =`<p><%= data.greeting %><p>`
let data = { greeting: "Hello World" }

let exe = template(tmpl, { variable: "data" })
let result = exe.render(data)

console.log(result)
// output:
// <p>Hello World<p>
```

**HTML转义**

`<%-` 可用于转义HTML保留字符

```ts
let tmpl =`<p><%- data.greeting %><p>`
let data = { greeting: `<img src="xss">` }

let exe = template(tmpl, { variable: "data" })
let result = exe.render(data)

console.log(result)
// output:
// <p>&lt;img src=&quot;xss&quot;&gt;<p>
```

**脚本块**

`<%` `%>` 之间可以编写任意的JS代码

```ts
let tmpl =`<ul>
<% for(let user of users){
	print('<li>'+user+'</li>')
} %>
</ul>`
let data = ["Alice","Bob"]

let result = template(tmpl, { variable: "users", soureMap: true }).render(data)

console.log(result)
// output:
// <ul>
// <li>Alice</li><li>Bob</li>
// </ul>
```

**保留字符转义**

`<%`、`%>`是保留字符, 如果要用作文本,使用`\`转义

```ts
let tmpl ="脚本块的语法是:\\<% code \\%>"  //这里有两个`\` 是因为`\`在JS中也是特殊字符,因此要加一个`\`转义
let result = template(tmpl, { variable: "data", soureMap: true }).render({})

console.log(result)
// output:
//脚本块的语法是:<% code %>
```

## 原理

将模版编译为一个JavaScript函数, 该函数接收一个data,以拼接字符串的形式生成最终的模版.

```
<p><%= data.greeting %><p>
```

⬇️

```js
function(data){
	let __p = ""
	__p+="<p>"+ data.greeting +"<p>"
	return __p
}
```

## API

**template**

```ts
template(tmpl: string, options?: TemplateSettings): TemplateExecutor
```

- tmpl ,模版内容
- TemplateSettings
	- `variable?: string`,指定数据对象在模版中的变量名,可通过该变量引用数据对象
	- `soureMap?: boolean`,是否生成sourceMap
- TemplateExecutor
	- `render(data :any)`,接收一个数据对象对模版进行渲染
	- `source: string`,生成的渲染函数

**compile**

```ts
compile(tmpl: string, settings?: TemplateSettings): string
```
与template的区别是,此方法仅返回渲染函数的字符串形式.

## 其他

**with**

JS中的with关键字可以将一个变量的属性作为一个作用域的上下文

```js
let obj = { x :1 ,y:2 }
with(obj){
	//可以直接使用obj的属性
	z=x+y
}
```

如果把这一特性用在模版中,原本要`<%= data.greeting %>`,而现在可直接通过 `<%= greeting %>`访问数据对象.
但是,with是一个过期的特性,strict 模式中使用with会直接抛出异常, 因此舍弃了提供该功能.


