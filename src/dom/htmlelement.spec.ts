import { Attribute, DOMTree, HtmlElement, NodeClosed } from ".";
import { Config } from "../config";
import { Location } from "../context";
import { Token, TokenType } from "../lexer";
import { MetaElement, MetaTable } from "../meta";
import { Parser } from "../parser";

describe("HtmlElement", () => {
	let root: DOMTree;
	const location: Location = {
		filename: "filename",
		offset: 0,
		line: 1,
		column: 1,
		size: 4,
	};

	beforeEach(() => {
		const parser = new Parser(Config.empty());
		root = parser.parseHtml(`<div id="parent">
			<ul>
				<li class="foo">foo</li>
				<li class="bar baz" id="spam" title="ham">bar</li>
			</ul>
			<p class="bar">spam</p>
			<span class="baz">flux</span>
		</div>`);
	});

	describe("fromTokens()", () => {
		function createTokens(
			tagName: string,
			open: boolean = true,
			selfClose: boolean = false
		): [Token, Token] {
			const slash = open ? "" : "/";
			const startToken: Token = {
				type: TokenType.TAG_OPEN,
				data: [`<${slash}${tagName}`, slash, tagName],
				location,
			};
			const endToken: Token = {
				type: TokenType.TAG_CLOSE,
				data: [selfClose ? "/>" : ">"],
				location,
			};
			return [startToken, endToken];
		}

		it("should create HtmlElement from tokens", () => {
			const [startToken, endToken] = createTokens("foo"); // <foo>
			const node = HtmlElement.fromTokens(startToken, endToken, null, null);
			expect(node.nodeName).toEqual("foo");
			expect(node.tagName).toEqual("foo");
			expect(node.location).toEqual({
				filename: "filename",
				offset: 1,
				line: 1,
				column: 2,
				size: 3,
			});
			expect(node.closed).toEqual(NodeClosed.Open);
		});

		it("should throw error if tagname is missing", () => {
			const [startToken, endToken] = createTokens(""); // <foo>
			expect(() => {
				HtmlElement.fromTokens(startToken, endToken, null, null);
			}).toThrow("tagName cannot be empty");
		});

		it("should set parent for opening tag", () => {
			const [startToken1, endToken1] = createTokens("foo", true); //  <foo>
			const [startToken2, endToken2] = createTokens("foo", false); // </foo>
			const parent = new HtmlElement("parent");
			const open = HtmlElement.fromTokens(startToken1, endToken1, parent, null);
			const close = HtmlElement.fromTokens(
				startToken2,
				endToken2,
				parent,
				null
			);
			expect(open.parent).toBeDefined();
			expect(close.parent).toBeUndefined();
		});

		it("should set metadata", () => {
			const [startToken, endToken] = createTokens("foo"); // <foo>
			const foo: MetaElement = mockEntry("foo");
			const table = new MetaTable();
			table.loadFromObject({ foo });
			const node = HtmlElement.fromTokens(startToken, endToken, null, table);
			expect(node.meta).toEqual(foo);
		});

		it("should set closed for omitted end tag", () => {
			const [startToken, endToken] = createTokens("foo"); // <foo>
			const foo: MetaElement = mockEntry("foo", { void: true });
			const table = new MetaTable();
			table.loadFromObject({ foo });
			const node = HtmlElement.fromTokens(startToken, endToken, null, table);
			expect(node.closed).toEqual(NodeClosed.VoidOmitted);
		});

		it("should set closed for self-closed end tag", () => {
			const [startToken, endToken] = createTokens("foo", true, true); // <foo/>
			const node = HtmlElement.fromTokens(startToken, endToken, null, null);
			expect(node.closed).toEqual(NodeClosed.VoidSelfClosed);
		});
	});

	it("root element", () => {
		const rootElement = root.root;
		expect(rootElement.isRootElement()).toBeTruthy();
		expect(rootElement.nodeName).toEqual("#document");
		expect(rootElement.tagName).toBeUndefined();
	});

	it("id property should return element id", () => {
		const el = new HtmlElement("foo");
		el.setAttribute("id", "bar", location);
		expect(el.id).toEqual("bar");
	});

	it("id property should return null if no id attribute exists", () => {
		const el = new HtmlElement("foo");
		expect(el.id).toBeNull();
	});

	it("previousSibling should return node before this node", () => {
		const root = new HtmlElement("root");
		const a = new HtmlElement("a", root);
		const b = new HtmlElement("b", root);
		const c = new HtmlElement("c", root);
		expect(c.previousSibling).toEqual(b);
		expect(b.previousSibling).toEqual(a);
		expect(a.previousSibling).toBeNull();
	});

	it("nextSibling should return node after this node", () => {
		const root = new HtmlElement("root");
		const a = new HtmlElement("a", root);
		const b = new HtmlElement("b", root);
		const c = new HtmlElement("c", root);
		expect(a.nextSibling).toEqual(b);
		expect(b.nextSibling).toEqual(c);
		expect(c.nextSibling).toBeNull();
	});

	it("should be assigned a unique id", () => {
		const n1 = new HtmlElement("foo");
		const n2 = new HtmlElement("foo");
		expect(n1.unique).toEqual(expect.any(Number));
		expect(n2.unique).toEqual(expect.any(Number));
		expect(n1.unique === n2.unique).toBeFalsy();
	});

	it("append() should add node as child", () => {
		const parent = new HtmlElement("parent");
		const child = new HtmlElement("child");
		expect(parent.children).toHaveLength(0);
		parent.append(child);
		expect(parent.children).toHaveLength(1);
		expect(parent.children[0].unique).toEqual(child.unique);
	});

	it("hasAttribute()", () => {
		const node = new HtmlElement("foo");
		node.setAttribute("foo", "", location);
		expect(node.hasAttribute("foo")).toBeTruthy();
		expect(node.hasAttribute("bar")).toBeFalsy();
	});

	it("getAttribute()", () => {
		const node = new HtmlElement("foo");
		node.setAttribute("foo", "value", location);
		expect(node.getAttribute("foo")).toBeInstanceOf(Attribute);
		expect(node.getAttribute("foo")).toEqual({
			key: "foo",
			value: "value",
			location,
		});
		expect(node.getAttribute("bar")).toBeNull();
	});

	describe("getAttributeValue", () => {
		it("should get attribute value", () => {
			const node = new HtmlElement("foo");
			node.setAttribute("bar", "value", location);
			expect(node.getAttributeValue("bar")).toEqual("value");
		});

		it("should return null for missing attributes", () => {
			const node = new HtmlElement("foo");
			expect(node.getAttributeValue("bar")).toBeNull();
		});
	});

	describe("classList", () => {
		it("should return list of classes", () => {
			const node = new HtmlElement("foo");
			node.setAttribute("class", "foo bar baz", location);
			expect(Array.from(node.classList)).toEqual(["foo", "bar", "baz"]);
		});

		it("should return empty list when class is missing", () => {
			const node = new HtmlElement("foo");
			expect(Array.from(node.classList)).toEqual([]);
		});
	});

	describe("should calculate depth", () => {
		it("for nodes without parent", () => {
			const node = new HtmlElement("foo");
			expect(node.depth).toEqual(0);
		});

		it("for nodes in a tree", () => {
			expect(root.querySelector("#parent").depth).toEqual(0);
			expect(root.querySelector("ul").depth).toEqual(1);
			expect(root.querySelector("li.foo").depth).toEqual(2);
			expect(root.querySelector("li.bar").depth).toEqual(2);
		});
	});

	describe("is()", () => {
		it("should match tagname", () => {
			const el = new HtmlElement("foo");
			expect(el.is("foo")).toBeTruthy();
			expect(el.is("bar")).toBeFalsy();
		});

		it("should match any tag when using asterisk", () => {
			const el = new HtmlElement("foo");
			expect(el.is("*")).toBeTruthy();
		});
	});

	describe("getElementsByTagName()", () => {
		it("should find elements", () => {
			const nodes = root.getElementsByTagName("li");
			expect(nodes).toHaveLength(2);
			expect(nodes[0].getAttributeValue("class")).toEqual("foo");
			expect(nodes[1].getAttributeValue("class")).toEqual("bar baz");
		});

		it("should support universal selector", () => {
			const tagNames = root
				.getElementsByTagName("*")
				.map((cur: HtmlElement) => cur.tagName);
			expect(tagNames).toHaveLength(6);
			expect(tagNames).toEqual(["div", "ul", "li", "li", "p", "span"]);
		});
	});

	describe("querySelector()", () => {
		it("should find element by tagname", () => {
			const el = root.querySelector("ul");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("ul");
		});

		it("should find element by #id", () => {
			const el = root.querySelector("#parent");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("div");
			expect(el.getAttributeValue("id")).toEqual("parent");
		});

		it("should find element by .class", () => {
			const el = root.querySelector(".foo");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("li");
			expect(el.getAttributeValue("class")).toEqual("foo");
		});

		it("should find element by [attr]", () => {
			const el = root.querySelector("[title]");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("li");
			expect(el.getAttributeValue("class")).toEqual("bar baz");
		});

		it('should find element by [attr=".."]', () => {
			const el = root.querySelector('[class="foo"]');
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("li");
			expect(el.getAttributeValue("class")).toEqual("foo");
		});

		it("should find element by multiple selectors", () => {
			const el = root.querySelector(".bar.baz#spam");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("li");
			expect(el.getAttributeValue("class")).toEqual("bar baz");
		});

		it("should find element with descendant combinator", () => {
			const el = root.querySelector("ul .bar");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("li");
			expect(el.getAttributeValue("class")).toEqual("bar baz");
		});

		it("should find element with child combinator", () => {
			const el = root.querySelector("div > .bar");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("p");
			expect(el.getAttributeValue("class")).toEqual("bar");
		});

		it("should find element with adjacent sibling combinator", () => {
			const el = root.querySelector("li + li");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("li");
			expect(el.getAttributeValue("class")).toEqual("bar baz");
		});

		it("should find element with general sibling combinator", () => {
			const el = root.querySelector("ul ~ .baz");
			expect(el).toBeInstanceOf(HtmlElement);
			expect(el.tagName).toEqual("span");
			expect(el.getAttributeValue("class")).toEqual("baz");
		});

		it("should return null if nothing matches", () => {
			const el = root.querySelector("foobar");
			expect(el).toBeNull();
		});
	});

	describe("querySelectorAll()", () => {
		it("should find multiple elements", () => {
			const el = root.querySelectorAll(".bar");
			expect(el).toHaveLength(2);
			expect(el[0]).toBeInstanceOf(HtmlElement);
			expect(el[1]).toBeInstanceOf(HtmlElement);
			expect(el[0].tagName).toEqual("li");
			expect(el[1].tagName).toEqual("p");
		});

		it("should return [] when nothing matches", () => {
			const el = root.querySelectorAll("missing");
			expect(el).toEqual([]);
		});
	});

	describe("visitDepthFirst()", () => {
		it("should visit all nodes in correct order", () => {
			const root = HtmlElement.rootNode({
				filename: "inline",
				offset: 0,
				line: 1,
				column: 1,
			});
			/* eslint-disable no-unused-vars */
			const a = new HtmlElement("a", root);
			const b = new HtmlElement("b", root);
			const c = new HtmlElement("c", b);
			/* eslint-enable no-unused-vars */
			const order: string[] = [];
			root.visitDepthFirst((node: HtmlElement) => order.push(node.tagName));
			expect(order).toEqual(["a", "c", "b"]);
		});
	});

	describe("someChildren()", () => {
		it("should return true if any child node evaluates to true", () => {
			const root = new HtmlElement("root");
			/* eslint-disable no-unused-vars */
			const a = new HtmlElement("a", root);
			const b = new HtmlElement("b", root);
			const c = new HtmlElement("c", b);
			/* eslint-enable no-unused-vars */
			const result = root.someChildren(
				(node: HtmlElement) => node.tagName === "c"
			);
			expect(result).toBeTruthy();
		});

		it("should return false if no child node evaluates to true", () => {
			const root = new HtmlElement("root");
			/* eslint-disable no-unused-vars */
			const a = new HtmlElement("a", root);
			const b = new HtmlElement("b", root);
			const c = new HtmlElement("c", b);
			/* eslint-enable no-unused-vars */
			const result = root.someChildren(() => false);
			expect(result).toBeFalsy();
		});

		it("should short-circuit when first node evalutes to true", () => {
			const root = new HtmlElement("root");
			/* eslint-disable no-unused-vars */
			const a = new HtmlElement("a", root);
			const b = new HtmlElement("b", root);
			const c = new HtmlElement("c", b);
			/* eslint-enable no-unused-vars */
			const order: string[] = [];
			root.someChildren((node: HtmlElement) => {
				order.push(node.tagName);
				return node.tagName === "a";
			});
			expect(order).toEqual(["a"]);
		});
	});

	describe("everyChildren()", () => {
		it("should return true if all nodes evaluates to true", () => {
			const root = new HtmlElement("root");
			/* eslint-disable no-unused-vars */
			const a = new HtmlElement("a", root);
			const b = new HtmlElement("b", root);
			const c = new HtmlElement("c", b);
			/* eslint-enable no-unused-vars */
			const result = root.everyChildren(() => true);
			expect(result).toBeTruthy();
		});

		it("should return false if any nodes evaluates to false", () => {
			const root = new HtmlElement("root");
			/* eslint-disable no-unused-vars */
			const a = new HtmlElement("a", root);
			const b = new HtmlElement("b", root);
			const c = new HtmlElement("c", b);
			/* eslint-enable no-unused-vars */
			const result = root.everyChildren(
				(node: HtmlElement) => node.tagName !== "b"
			);
			expect(result).toBeFalsy();
		});
	});

	describe("find()", () => {
		it("should visit all nodes until callback evaluates to true", () => {
			const root = new HtmlElement("root");
			/* eslint-disable no-unused-vars */
			const a = new HtmlElement("a", root);
			const b = new HtmlElement("b", root);
			const c = new HtmlElement("c", b);
			/* eslint-enable no-unused-vars */
			const result = root.find((node: HtmlElement) => node.tagName === "b");
			expect(result.tagName).toEqual("b");
		});
	});
});

function mockEntry(tagName: string, stub = {}): MetaElement {
	return Object.assign(
		{
			tagName,
			metadata: false,
			flow: false,
			sectioning: false,
			heading: false,
			phrasing: false,
			embedded: false,
			interactive: false,
			deprecated: false,
			void: false,
			transparent: false,
			implicitClosed: [],
			attributes: {},
			deprecatedAttributes: [],
			permittedContent: [],
			permittedDescendants: [],
			permittedOrder: [],
		},
		stub
	);
}
