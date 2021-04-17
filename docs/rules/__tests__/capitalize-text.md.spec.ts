import HtmlValidate from "../../../src/htmlvalidate";

const markup: { [key: string]: string } = {};
markup["incorrect"] = `<h1>lorem ipsum</h1>`;
markup["correct"] = `<h1>Lorem ipsum</h1>`;
markup["ignored"] = `<h1><code>loremIpsum</code> dolor sit amet</h1>`;

describe("docs/rules/capitalize-text.md", () => {
	it("inline validation: incorrect", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"capitalize-text":"error"}});
		const report = htmlvalidate.validateString(markup["incorrect"]);
		expect(report.results).toMatchSnapshot();
	});
	it("inline validation: correct", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"capitalize-text":"error"}});
		const report = htmlvalidate.validateString(markup["correct"]);
		expect(report.results).toMatchSnapshot();
	});
	it("inline validation: ignored", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"capitalize-text":"error"}});
		const report = htmlvalidate.validateString(markup["ignored"]);
		expect(report.results).toMatchSnapshot();
	});
});
