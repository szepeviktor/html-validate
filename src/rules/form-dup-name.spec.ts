import HtmlValidate from "../htmlvalidate";
import { processAttribute } from "../transform/mocks/attribute";
import "../jest";

describe("rule form-dup-name", () => {
	let htmlvalidate: HtmlValidate;

	beforeAll(() => {
		htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "form-dup-name": "error" },
		});
	});

	it("should not report when name isn't duplicated", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input name="foo" />
				<input name="bar" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report when different forms have same name", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input name="foo" />
			</form>
			<form>
				<input name="foo" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report when global scope and form have same name", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<input name="foo" />
			<form>
				<input name="foo" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it('should not report when <input type="radio"> have same name', () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input type="radio" value="yes" name="foo" />
				<input type="radio" value="nah" name="foo" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it('should not report when <input type="checkbox"> have same name', () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input type="checkbox" value="yes" name="foo" />
				<input type="checkbox" value="nah" name="foo" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report when name is missing or empty", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input />
				<input />
				<input name />
				<input name />
				<input name="" />
				<input name="" />
				<input type="radio" />
				<input type="checkbox" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toBeValid();
	});

	it("should not report error for interpolated attributes", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input name="{{ expr }}" />
				<input name="{{ expr }}" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup, {
			processAttribute,
		});
		expect(report).toBeValid();
	});

	it("should not report error for dynamic attributes", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input dynamic-name="foo" />
				<input dynamic-name="foo" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup, {
			processAttribute,
		});
		expect(report).toBeValid();
	});

	it("should report when form has duplicate name", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input name="foo" />
				<input name="foo" />
			</form>
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toMatchInlineCodeframe(`
			"error: Duplicate form control name "foo" (form-dup-name) at inline:4:18:
			  2 | 			<form>
			  3 | 				<input name="foo" />
			> 4 | 				<input name="foo" />
			    | 				             ^^^
			  5 | 			</form>
			  6 |
			Selector: form > input:nth-child(2)"
		`);
	});

	it("should report when global scope has duplicate name", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<input name="foo" />
			<input name="foo" />
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toMatchInlineCodeframe(`
			"error: Duplicate form control name "foo" (form-dup-name) at inline:3:17:
			  1 |
			  2 | 			<input name="foo" />
			> 3 | 			<input name="foo" />
			    | 			             ^^^
			  4 |
			Selector: input:nth-child(2)"
		`);
	});

	it("should report when radiobutton has same name as other control", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input name="foo" />
				<input name="foo" type="checkbox" />
			</form>
			<input name="bar" />
			<input name="bar" type="checkbox" />
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toMatchInlineCodeframe(`
			"error: Duplicate form control name "foo" (form-dup-name) at inline:4:18:
			  2 | 			<form>
			  3 | 				<input name="foo" />
			> 4 | 				<input name="foo" type="checkbox" />
			    | 				             ^^^
			  5 | 			</form>
			  6 | 			<input name="bar" />
			  7 | 			<input name="bar" type="checkbox" />
			Selector: form > input:nth-child(2)
			error: Duplicate form control name "bar" (form-dup-name) at inline:7:17:
			  5 | 			</form>
			  6 | 			<input name="bar" />
			> 7 | 			<input name="bar" type="checkbox" />
			    | 			             ^^^
			  8 |
			Selector: input:nth-child(3)"
		`);
	});

	it("should report when checkbox has same name as other control", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input name="foo" />
				<input name="foo" type="checkbox" />
			</form>
			<input name="bar" />
			<input name="bar" type="checkbox" />
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toMatchInlineCodeframe(`
			"error: Duplicate form control name "foo" (form-dup-name) at inline:4:18:
			  2 | 			<form>
			  3 | 				<input name="foo" />
			> 4 | 				<input name="foo" type="checkbox" />
			    | 				             ^^^
			  5 | 			</form>
			  6 | 			<input name="bar" />
			  7 | 			<input name="bar" type="checkbox" />
			Selector: form > input:nth-child(2)
			error: Duplicate form control name "bar" (form-dup-name) at inline:7:17:
			  5 | 			</form>
			  6 | 			<input name="bar" />
			> 7 | 			<input name="bar" type="checkbox" />
			    | 			             ^^^
			  8 |
			Selector: input:nth-child(3)"
		`);
	});

	it("should report when radiobutton and checkbox share the same name", () => {
		expect.assertions(1);
		const markup = /* HTML */ `
			<form>
				<input name="foo" type="checkbox" />
				<input name="foo" type="radio" />
			</form>
			<input name="bar" type="checkbox" />
			<input name="bar" type="radio" />
		`;
		const report = htmlvalidate.validateString(markup);
		expect(report).toMatchInlineCodeframe(`
			"error: Duplicate form control name "foo" (form-dup-name) at inline:4:18:
			  2 | 			<form>
			  3 | 				<input name="foo" type="checkbox" />
			> 4 | 				<input name="foo" type="radio" />
			    | 				             ^^^
			  5 | 			</form>
			  6 | 			<input name="bar" type="checkbox" />
			  7 | 			<input name="bar" type="radio" />
			Selector: form > input:nth-child(2)
			error: Duplicate form control name "bar" (form-dup-name) at inline:7:17:
			  5 | 			</form>
			  6 | 			<input name="bar" type="checkbox" />
			> 7 | 			<input name="bar" type="radio" />
			    | 			             ^^^
			  8 |
			Selector: input:nth-child(3)"
		`);
	});

	describe("should report for", () => {
		const elements = ["button", "fieldset", "input", "object", "output", "select", "textarea"];

		it.each(elements)("%s", (tagName) => {
			expect.assertions(1);
			const markup = /* HTML */ `
				<form>
					<${tagName} name="foo" />
					<${tagName} name="foo" />
				</form>
			`;
			const report = htmlvalidate.validateString(markup);
			expect(report).toHaveError({
				ruleId: "form-dup-name",
				message: 'Duplicate form control name "foo"',
			});
		});
	});

	it("should contain documentation", () => {
		expect.assertions(1);
		const docs = htmlvalidate.getRuleDocumentation("form-dup-name");
		expect(docs).toMatchInlineSnapshot(`
		{
		  "description": "Each form control must have a unique name.",
		  "url": "https://html-validate.org/rules/form-dup-name.html",
		}
	`);
	});
});