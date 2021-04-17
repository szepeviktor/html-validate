import { DynamicValue, HtmlElement } from "../dom";
import HtmlValidate from "../htmlvalidate";
import "../matchers";

function processElement(node: HtmlElement): void {
	if (node.hasAttribute("bind-text")) {
		node.appendText(new DynamicValue(""), {
			filename: "mock",
			line: 1,
			column: 1,
			offset: 0,
			size: 1,
		});
	}
}

describe("rule capitalize-text", () => {
	let htmlvalidate: HtmlValidate;

	beforeAll(() => {
		htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "capitalize-text": "error" },
		});
	});

	it("should not report error when text is capitalized", () => {
		expect.assertions(1);
		const markup = "<h1>Lorem ipsum</h1>";
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when international text is capitalized", () => {
		expect.assertions(1);
		const markup = "<h1>Öland</h1><h2>Δ</h2>";
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when text begins with non-letter character", () => {
		expect.assertions(1);
		const markup = "<h1>#hashtag</h1>";
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when text is dyanmic", () => {
		expect.assertions(1);
		const markup = '<h1 bind-text="foobar"></h1>';
		const report = htmlvalidate.validateString(markup, { processElement });
		expect(report).toBeValid();
	});

	it("should not report error when text is missing", () => {
		expect.assertions(1);
		const markup = "<h1></h1>";
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should report error when text is lowercase", () => {
		expect.assertions(2);
		const markup = "<h1>lorem ipsum</h1>";
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeInvalid();
		expect(report).toHaveError("capitalize-text", "Text must be capitalized in <h1>");
	});

	it("should ignore whitespace", () => {
		expect.assertions(2);
		const markup = "<h1>\n\tlorem ipsum\n</h1>";
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeInvalid();
		expect(report).toHaveError("capitalize-text", "Text must be capitalized in <h1>");
	});

	it("should not report error when element is excluded", () => {
		expect.assertions(2);
		const htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "capitalize-text": ["error", { exclude: ["h1"] }] },
		});
		const valid = htmlvalidate.validateString("<h1>lorem ipsum</h1>");
		const invalid = htmlvalidate.validateString("<h2>lorem ipsum</h2>");
		expect(valid).toBeValid();
		expect(invalid).toBeInvalid();
	});

	it("should report error only for included elements", () => {
		expect.assertions(2);
		const htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "capitalize-text": ["error", { include: ["h2"] }] },
		});
		const valid = htmlvalidate.validateString("<h1>lorem ipsum</h1>");
		const invalid = htmlvalidate.validateString("<h2>lorem ipsum</h2>");
		expect(valid).toBeValid();
		expect(invalid).toBeInvalid();
	});

	describe("ignore", () => {
		it("should ignore element if the first child element is ignored", () => {
			expect.assertions(1);
			const markup = "<h1><code>lorem</code> ipsum</h1>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should ignore element if the first child element is ignored (interelement whitespace)", () => {
			expect.assertions(1);
			const markup = "<h1>\n\t<code>lorem</code> ipsum\n</h1>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should report error for other elements", () => {
			expect.assertions(2);
			const markup = "<h1><span>lorem</span> ipsum</h1>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError("capitalize-text", "Text must be capitalized in <h1>");
		});

		it("should report error text node precedes element", () => {
			expect.assertions(2);
			const markup = "<h1>lorem <code>ipsum</code></h1>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError("capitalize-text", "Text must be capitalized in <h1>");
		});
	});

	it("should contain documentation", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "capitalize-text": "error" },
		});
		expect(htmlvalidate.getRuleDocumentation("capitalize-text")).toMatchSnapshot();
	});

	it("should contain contextual documentation", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "capitalize-text": "error" },
		});
		const context = {
			tagName: "h1",
		};
		expect(htmlvalidate.getRuleDocumentation("capitalize-text", null, context)).toMatchSnapshot();
	});
});
