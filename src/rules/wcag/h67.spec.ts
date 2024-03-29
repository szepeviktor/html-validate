import { HtmlValidate } from "../../htmlvalidate";
import "../../jest";

describe("wcag/h67", () => {
	let htmlvalidate: HtmlValidate;

	beforeAll(() => {
		htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "wcag/h67": "error" },
		});
	});

	it("should not report when img has neither alt or title", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString("<img>");
		expect(report).toBeValid();
	});

	it("should not report when img is missing title", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString('<img alt="foo">');
		expect(report).toBeValid();
	});

	it("should not report when img has both alt and title", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString('<img alt="foo" title="bar">');
		expect(report).toBeValid();
	});

	it("should not report when img is both alt and title is empty", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString('<img alt="" title="">');
		expect(report).toBeValid();
	});

	it("should report error when img has only title", () => {
		expect.assertions(2);
		const report = htmlvalidate.validateString('<img title="bar">');
		expect(report).toBeInvalid();
		expect(report).toHaveError("wcag/h67", "<img> with empty alt text cannot have title attribute");
	});

	it("should report error when img has empty alt and title", () => {
		expect.assertions(2);
		const report = htmlvalidate.validateString('<img title="bar">');
		expect(report).toBeInvalid();
		expect(report).toHaveError("wcag/h67", "<img> with empty alt text cannot have title attribute");
	});

	it("smoketest", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateFile("test-files/rules/wcag/h67.html");
		expect(report).toMatchInlineCodeframe(`
			"error: <img> with empty alt text cannot have title attribute (wcag/h67) at test-files/rules/wcag/h67.html:5:6:
			  3 | <img alt="foo" title="bar">
			  4 | <img title="">
			> 5 | <img title="bar">
			    |      ^^^^^
			  6 | <img alt="" title="bar">
			  7 |
			  8 | <!-- regression #33 (https://gitlab.com/html-validate/html-validate/issues/33) -->
			Selector: img:nth-child(5)
			error: <img> with empty alt text cannot have title attribute (wcag/h67) at test-files/rules/wcag/h67.html:6:13:
			  4 | <img title="">
			  5 | <img title="bar">
			> 6 | <img alt="" title="bar">
			    |             ^^^^^
			  7 |
			  8 | <!-- regression #33 (https://gitlab.com/html-validate/html-validate/issues/33) -->
			  9 | <div>
			Selector: img:nth-child(6)"
		`);
	});

	it("should contain documentation", async () => {
		expect.assertions(1);
		htmlvalidate = new HtmlValidate({
			rules: { "wcag/h67": "error" },
		});
		const docs = await htmlvalidate.getContextualDocumentation({ ruleId: "wcag/h67" });
		expect(docs).toMatchSnapshot();
	});
});
