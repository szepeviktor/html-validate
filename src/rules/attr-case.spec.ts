import HtmlValidate from "../htmlvalidate";
import "../matchers";
import { processAttribute } from "../transform/mocks/attribute";

describe("rule attr-case", () => {
	let htmlvalidate: HtmlValidate;

	describe('configured with "lowercase"', () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "attr-case": ["error", { style: "lowercase" }] },
			});
		});

		it("should not report error when attributes is lowercase", () => {
			const report = htmlvalidate.validateString('<div foo="bar"></div>');
			expect(report).toBeValid();
		});

		it("should not report error when attribute has special characters", () => {
			const report = htmlvalidate.validateString('<div foo-bar-9="bar"></div>');
			expect(report).toBeValid();
		});

		it("should report error when attributes is uppercase", () => {
			const report = htmlvalidate.validateString('<div FOO="bar"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "FOO" should be lowercase'
			);
		});

		it("should report error when attributes is mixed", () => {
			const report = htmlvalidate.validateString('<div clAss="bar"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "clAss" should be lowercase'
			);
		});

		it("smoketest", () => {
			const report = htmlvalidate.validateFile(
				"test-files/rules/attr-case.html"
			);
			expect(report.results).toMatchSnapshot();
		});
	});

	describe('configured with "uppercase"', () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "attr-case": ["error", { style: "uppercase" }] },
			});
		});

		it("should report error when attributes is lowercase", () => {
			const report = htmlvalidate.validateString('<div foo="bar"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "foo" should be uppercase'
			);
		});

		it("should not report error when attribute has special characters", () => {
			const report = htmlvalidate.validateString('<div FOO-BAR-9="bar"></div>');
			expect(report).toBeValid();
		});

		it("should not report error when attributes is uppercase", () => {
			const report = htmlvalidate.validateString('<div FOO="bar"></div>');
			expect(report).toBeValid();
		});

		it("should report error when attributes is mixed", () => {
			const report = htmlvalidate.validateString('<div clAss="bar"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "clAss" should be uppercase'
			);
		});

		it("smoketest", () => {
			const report = htmlvalidate.validateFile(
				"test-files/rules/attr-case.html"
			);
			expect(report.results).toMatchSnapshot();
		});
	});

	describe('configured with "pascalcase"', () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "attr-case": ["error", { style: "pascalcase" }] },
			});
		});

		it("should not report error when attributes is PascalCase", () => {
			const report = htmlvalidate.validateString('<div FooBar="baz"></div>');
			expect(report).toBeValid();
		});

		it("should not report error when attributes is UPPERCASE", () => {
			const report = htmlvalidate.validateString('<div FOOBAR="baz"></div>');
			expect(report).toBeValid();
		});

		it("should report error when attributes is lowercase", () => {
			const report = htmlvalidate.validateString('<div foobar="baz"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "foobar" should be PascalCase'
			);
		});

		it("should report error when attributes is camelCase", () => {
			const report = htmlvalidate.validateString('<div fooBar="baz"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "fooBar" should be PascalCase'
			);
		});

		it("smoketest", () => {
			const report = htmlvalidate.validateFile(
				"test-files/rules/attr-case.html"
			);
			expect(report.results).toMatchSnapshot();
		});
	});

	describe('configured with "camelcase"', () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "attr-case": ["error", { style: "camelcase" }] },
			});
		});

		it("should not report error when attributes is camelCase", () => {
			const report = htmlvalidate.validateString('<div fooBar="baz"></div>');
			expect(report).toBeValid();
		});

		it("should not report error when attributes is lowercase", () => {
			const report = htmlvalidate.validateString('<div foobar="baz"></div>');
			expect(report).toBeValid();
		});

		it("should report error when attributes is UPPERCASE", () => {
			const report = htmlvalidate.validateString('<div FOOBAR="baz"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "FOOBAR" should be camelCase'
			);
		});

		it("should report error when attributes is PascalCase", () => {
			const report = htmlvalidate.validateString('<div FooBar="baz"></div>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "FooBar" should be camelCase'
			);
		});

		it("smoketest", () => {
			const report = htmlvalidate.validateFile(
				"test-files/rules/attr-case.html"
			);
			expect(report.results).toMatchSnapshot();
		});
	});

	describe('configured with "ignoreForeign" true', () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "attr-case": ["error", { ignoreForeign: true }] },
			});
		});

		it("should not report error on foreign elements", () => {
			const report = htmlvalidate.validateString('<svg viewBox=""/>');
			expect(report).toBeValid();
		});
	});

	describe('configured with "ignoreForeign" false', () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "attr-case": ["error", { ignoreForeign: false }] },
			});
		});

		it("should report error on foreign elements", () => {
			const report = htmlvalidate.validateString('<svg viewBox=""/>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"attr-case",
				'Attribute "viewBox" should be lowercase'
			);
		});
	});

	it("should handle multiple styles", () => {
		expect.assertions(3);
		htmlvalidate = new HtmlValidate({
			rules: {
				"attr-case": ["error", { style: ["lowercase", "camelcase"] }],
			},
		});
		expect(htmlvalidate.validateString("<div foo-bar></div>")).toBeValid();
		expect(htmlvalidate.validateString("<div fooBar></div>")).toBeValid();
		expect(htmlvalidate.validateString("<div FooBar></div>")).toHaveError(
			"attr-case",
			'Attribute "FooBar" should be lowercase or camelCase'
		);
	});

	it("should not report duplicate errors for dynamic attributes", () => {
		htmlvalidate = new HtmlValidate({
			rules: { "attr-case": "error" },
		});
		const report = htmlvalidate.validateString(
			'<input dynamic-fooBar="foo">',
			null,
			{
				processAttribute,
			}
		);
		expect(report).toBeInvalid();
		expect(report).toHaveErrors([
			{
				ruleId: "attr-case",
				message: 'Attribute "dynamic-fooBar" should be lowercase',
			},
		]);
	});

	it("should throw error if configured with invalid value", () => {
		htmlvalidate = new HtmlValidate({
			rules: { "attr-case": ["error", { style: "foobar" }] },
		});
		expect(() => htmlvalidate.validateString("<foo></foo>")).toThrow(
			`Invalid style "foobar" for attr-case rule`
		);
	});

	it("should contain documentation", () => {
		htmlvalidate = new HtmlValidate({
			rules: { "attr-case": "error" },
		});
		expect(htmlvalidate.getRuleDocumentation("attr-case")).toMatchSnapshot();
	});
});
