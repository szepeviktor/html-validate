import HtmlValidate from "../../../src/htmlvalidate";

const markup: { [key: string]: string } = {};
markup["incorrect"] = `<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1" />`;
markup["correct"] = `<!-- explicily enabled -->
<meta name="viewport" content="user-scalable=yes" />

<!-- property no set (default enabled) -->
<meta name="viewport" content="width=device-width, initial-scale=1" />`;

describe("docs/rules/meta-viewport-scalable.md", () => {
	it("inline validation: incorrect", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"meta-viewport-scalable":"error"}});
		const report = htmlvalidate.validateString(markup["incorrect"]);
		expect(report.results).toMatchSnapshot();
	});
	it("inline validation: correct", () => {
		expect.assertions(1);
		const htmlvalidate = new HtmlValidate({"rules":{"meta-viewport-scalable":"error"}});
		const report = htmlvalidate.validateString(markup["correct"]);
		expect(report.results).toMatchSnapshot();
	});
});
