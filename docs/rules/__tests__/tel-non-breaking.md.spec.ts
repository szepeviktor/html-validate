import HtmlValidate from "../../../src/htmlvalidate";

const markup: { [key: string]: string } = {};
markup["incorrect"] = `<a href="tel:555123456">
    <span>555-123 456</span>
</a>`;
markup["correct"] = `<a href="tel:555123456">
    <span>555&#8209;123&nbsp;456</span>
</a>`;
markup["ignored"] = `<a class="nobreak" href="tel:555123456">
    <span>555-123 456</span>
</a>`;

describe("docs/rules/tel-non-breaking.md", () => {
	it("inline validation: incorrect", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"tel-non-breaking":"error"}});
		const report = htmlvalidate.validateString(markup["incorrect"]);
		expect(report.results).toMatchSnapshot();
	});
	it("inline validation: correct", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"tel-non-breaking":"error"}});
		const report = htmlvalidate.validateString(markup["correct"]);
		expect(report.results).toMatchSnapshot();
	});
	it("inline validation: ignored", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"tel-non-breaking":["error",{"ignoreClasses":["nobreak"]}]}});
		const report = htmlvalidate.validateString(markup["ignored"]);
		expect(report.results).toMatchSnapshot();
	});
});