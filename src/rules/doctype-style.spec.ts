import { HtmlValidate } from "../htmlvalidate";
import "../jest";

describe("rule doctype-style", () => {
	let htmlvalidate: HtmlValidate;

	describe("configured with uppercase", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "doctype-style": ["error", { style: "uppercase" }] },
			});
		});

		it("should not report when doctype is upper", () => {
			expect.assertions(1);
			const markup = "<!DOCTYPE html>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should report error when doctype is lowercase", () => {
			expect.assertions(2);
			const markup = "<!doctype html>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError("doctype-style", "DOCTYPE should be uppercase");
		});

		it("should report error when doctype is mixed case", () => {
			expect.assertions(2);
			const markup = "<!DoCTyPe html>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError("doctype-style", "DOCTYPE should be uppercase");
		});

		it("should contain contextual documentation", async () => {
			expect.assertions(1);
			const context = {
				style: "uppercase",
			};
			const docs = await htmlvalidate.getRuleDocumentation("doctype-style", null, context);
			expect(docs).toMatchSnapshot();
		});
	});

	describe("configured with lowercase", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				rules: { "doctype-style": ["error", { style: "lowercase" }] },
			});
		});

		it("should not report when doctype is lowercase", () => {
			expect.assertions(1);
			const markup = "<!doctype html>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should report error when doctype is uppercase", () => {
			expect.assertions(2);
			const markup = "<!DOCTYPE html>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError("doctype-style", "DOCTYPE should be lowercase");
		});

		it("should report error when doctype is mixed case", () => {
			expect.assertions(2);
			const markup = "<!DoCTyPe html>";
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError("doctype-style", "DOCTYPE should be lowercase");
		});

		it("should contain contextual documentation", async () => {
			expect.assertions(1);
			const context = {
				style: "uppercase",
			};
			const docs = await htmlvalidate.getRuleDocumentation("doctype-style", null, context);
			expect(docs).toMatchSnapshot();
		});
	});

	it("should contain documentation", async () => {
		expect.assertions(1);
		htmlvalidate = new HtmlValidate({
			rules: { "doctype-style": ["error"] },
		});
		const docs = await htmlvalidate.getRuleDocumentation("doctype-style");
		expect(docs).toMatchSnapshot();
	});
});
