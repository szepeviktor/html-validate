import { HtmlValidate } from "../htmlvalidate";
import "../jest";

describe("rule script-element", () => {
	let htmlvalidate: HtmlValidate;

	beforeAll(() => {
		htmlvalidate = new HtmlValidate({
			rules: { "script-element": "error" },
		});
	});

	it("should not report when script element has end tag", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString("<script></script>");
		expect(report).toBeValid();
	});

	it("should report when script element is self-closed", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString("<script/>");
		expect(report).toHaveError("script-element", "End tag for <script> must not be omitted");
	});

	it("should handle stray end tag", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString("</script>");
		expect(report).toBeValid();
	});

	it("should handle missing end tag", () => {
		expect.assertions(1);
		const report = htmlvalidate.validateString("<script>");
		expect(report).toBeValid();
	});

	it("should contain documentation", async () => {
		expect.assertions(1);
		const docs = await htmlvalidate.getRuleDocumentation("script-element");
		expect(docs).toMatchSnapshot();
	});
});
