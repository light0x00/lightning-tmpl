import template from "~/index"
import should from "should"

let render = (tmpl: string, data: any, options = { variable: "data" }) => template(tmpl, options).render(data)

describe(`Integration Test`, () => {

	it(`interpolation`, () => {
		let tmpl = `hello,<%=data.msg%>`
		let data = { msg: "world" }
		let r = render(tmpl, data)
		should(r).eql("hello,world")
	})

	it(`escape`, () => {
		let tmpl = `hello,<%-data.msg%>`
		let data = { msg: `&<>"'` }
		let r = render(tmpl, data)
		should(r).eql("hello," + "&amp;" + "&lt;" + "&gt;" + "&quot;" + "&#39;")
	})

	it(`evaluation`, () => {
		let tmpl = "<% data.forEach( function(user) { %><li><%- user %></li><% } ); %>"
		let data = ["fred", "barney"]
		let r = render(tmpl, data)
		should(r).eql("<li>fred</li><li>barney</li>")
	})

	it(`built-in function`, () => {
		let tmpl = `<% print("Hello," + data.user) %>`
		let data = { user: "Bob" }
		let r = render(tmpl, data)
		should(r).eql("Hello,Bob")
	})

	it(`mix`, () => {
		let tmpl =
			`<p><%- data.name %><p>
<p><%= data.desc %></p>
<ul><% for(let hobby of data.tags){ %>
	<li><% print(hobby) %></li><% } %>
</ul>`
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

		let r = render(tmpl, data, { variable: "data" })
		should(r).eql(
			`<p>&lt;&lt;Alice&amp;Bob&gt;&gt;<p>
<p>How do Alice and Bob prevent Truck</p>
<ul>
	<li>HASH</li>
	<li>MAC</li>
	<li>RSA</li>
	<li>Digital Signature</li>
	<li>CA</li>
</ul>`)
	})

	it(`二维数组`, () => {
		let tmpl =
`<% for(let i=0;i<data.length;i++){ %>
	<
	<% for(let j=0;j<data[i].length;j++) { %>
		<%=data[i][j]%>;
	<% } %>
	>
<% } %>`
		let data = [
			["Hello", "Alice"],
			["Hello", "Bob"],
		]
		let r = render(tmpl, data)
		should(r.replace(/\s/g, "")).eql("<Hello;Alice;><Hello;Bob;>")
	})

})