import HtmlValidate from "../htmlvalidate";
import "../matchers";

describe("rule no-trailing-whitespace", () => {
	let htmlvalidate: HtmlValidate;

	beforeAll(() => {
		htmlvalidate = new HtmlValidate({
			rules: {"no-trailing-whitespace": "error"},
		});
	});

	it("should not report when there is no trailing whitespace", () => {
		const report = htmlvalidate.validateString("<div>\n  foo\n</div>");
		expect(report).toBeValid();
	});

	it("should report error when tag have trailing whitespace", () => {
		const report = htmlvalidate.validateString("<p>  \n</p>");
		expect(report).toBeInvalid();
		expect(report).toHaveError("no-trailing-whitespace", "Trailing whitespace");
	});

	it("should report error when empty line have trailing whitespace", () => {
		const report = htmlvalidate.validateString("<p>\n  \n</p>");
		expect(report).toBeInvalid();
		expect(report).toHaveError("no-trailing-whitespace", "Trailing whitespace");
	});

	it("should report error for both tabs and spaces", () => {
		const report = htmlvalidate.validateString("<p>\n  \n\t\n</p>");
		expect(report).toBeInvalid();
		expect(report).toHaveErrors([
			["no-trailing-whitespace", "Trailing whitespace"],
			["no-trailing-whitespace", "Trailing whitespace"],
		]);
	});

	it("smoketest", () => {
		const report = htmlvalidate.validateFile("test-files/rules/no-trailing-whitespace.html");
		expect(report.results).toMatchSnapshot();
	});

	it("should contain documentation", () => {
		expect(htmlvalidate.getRuleDocumentation("no-trailing-whitespace")).toMatchSnapshot();
	});

});
