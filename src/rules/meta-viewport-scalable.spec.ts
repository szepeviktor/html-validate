import HtmlValidate from "../htmlvalidate";
import "../jest";
import { processAttribute } from "../transform/mocks/attribute";

describe("rule meta-viewport-scalable", () => {
	let htmlvalidate: HtmlValidate;

	beforeAll(() => {
		htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "meta-viewport-scalable": "error" },
		});
	});

	it("should not report error for other elements", () => {
		expect.assertions(1);
		const markup = /* HTML */ `<div name="viewport" content="user-scalable=no"></div>`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when <meta> is missing name", () => {
		expect.assertions(1);
		const markup = /* HTML */ `<meta />`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when <meta> is missing content", () => {
		expect.assertions(1);
		const markup = /* HTML */ `<meta name="viewport" />`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when <meta> has omitted content", () => {
		expect.assertions(1);
		const markup = /* HTML */ `<meta name="viewport" content />`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when <meta> is not viewport", () => {
		expect.assertions(1);
		const markup = /* HTML */ `<meta name="foobar" content="user-scalable=no"></meta>`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when user-scalable is omitted", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<meta name="viewport" content="width=device-width, initial-scale=1" />
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when user-scalable is enabled", () => {
		expect.assertions(1);
		const markup = /* HTML */ `<meta name="viewport" content="user-scalable=yes" />`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error when user-scalable is set to 1", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<meta name="viewport" content="user-scalable=1" />
			<meta name="viewport" content="user-scalable=1.0" />
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error for dynamic attributes", () => {
		expect.assertions(1);
		const markup = /* HTML */ `<meta name="viewport" dynamic-content="myContent" />`;
		const report = htmlvalidate.validateString(markup, {
			processAttribute,
		});
		expect(report).toBeValid();
	});

	it("should report error when user-scalable is disabled", () => {
		expect.assertions(2);
		const markup = /* HTML */ `<meta name="viewport" content="user-scalable=no" />`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeInvalid();
		expect(report).toHaveError("meta-viewport-scalable", '"user-scalable" must not be disabled');
	});

	it("should report error when user-scalable is not 1", () => {
		expect.assertions(2);
		const markup = /* HTML */ `<meta name="viewport" content="user-scalable=2" />`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeInvalid();
		expect(report).toHaveError("meta-viewport-scalable", '"user-scalable" must not be disabled');
	});

	it("should contain documentation", () => {
		expect.assertions(1);
		expect(htmlvalidate.getRuleDocumentation("meta-viewport-scalable")).toMatchSnapshot();
	});
});
