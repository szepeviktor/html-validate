import { HtmlValidate } from "../htmlvalidate";
import "../jest";
import { processAttribute } from "../transform/mocks/attribute";
import { Style, matchList, AllowList } from "./allowed-links";

describe("matchList", () => {
	it("should match if no lists are present", () => {
		expect.assertions(1);
		const list: AllowList<RegExp> = {
			include: null,
			exclude: null,
		};
		expect(matchList("foo", list)).toBeTruthy();
	});

	it('should match if value is allowed by one "allow" regexp', () => {
		expect.assertions(5);
		const list: AllowList<RegExp> = {
			include: [/^foo/, /^bar$/],
			exclude: null,
		};
		expect(matchList("foo", list)).toBeTruthy();
		expect(matchList("foobar", list)).toBeTruthy();
		expect(matchList("bar", list)).toBeTruthy();
		expect(matchList("barfoo", list)).toBeFalsy();
		expect(matchList("baz", list)).toBeFalsy();
	});

	it('should match if value is not disallowed by any "disallow" regexp', () => {
		expect.assertions(5);
		const list: AllowList<RegExp> = {
			include: null,
			exclude: [/^foo/, /^bar$/],
		};
		expect(matchList("foo", list)).toBeFalsy();
		expect(matchList("foobar", list)).toBeFalsy();
		expect(matchList("bar", list)).toBeFalsy();
		expect(matchList("barfoo", list)).toBeTruthy();
		expect(matchList("baz", list)).toBeTruthy();
	});

	it('should match if value if both "allow" and "disallow" matches', () => {
		expect.assertions(5);
		const list: AllowList<RegExp> = {
			include: [/^foo/],
			exclude: [/bar$/],
		};
		expect(matchList("foo", list)).toBeTruthy(); // prefix allowed
		expect(matchList("foobar", list)).toBeFalsy(); // suffix disallowd
		expect(matchList("foobaz", list)).toBeTruthy(); // prefix allowed
		expect(matchList("bar", list)).toBeFalsy(); // prefix not allowed
		expect(matchList("barfoo", list)).toBeFalsy(); // prefix not allowed
	});
});

describe("rule allowed-links", () => {
	let htmlvalidate: HtmlValidate;

	describe("should report error for", () => {
		it.each`
			description       | markup
			${"<a href>"}     | ${'<a href="/foo"></a>'}
			${"<img src>"}    | ${'<img src="/foo">'}
			${"<link href>"}  | ${'<link href="/foo">'}
			${"<script src>"} | ${'<script src="/foo"></script>'}
		`("$description", ({ markup }) => {
			expect.assertions(1);
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: { "allowed-links": ["error", { allowAbsolute: false }] },
			});
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
		});
	});

	it("should not report error for anchor links", () => {
		expect.assertions(1);
		htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "allowed-links": ["error", { allowAbsolute: false }] },
		});
		const report = htmlvalidate.validateString('<a href="#foo"></a>');
		expect(report).toBeValid();
	});

	it("should not report error for link is dynamic", () => {
		expect.assertions(1);
		htmlvalidate = new HtmlValidate({
			root: true,
			rules: {
				"allowed-links": ["error", { allowRelative: false }],
			},
		});
		const report = htmlvalidate.validateString('<a dynamic-src="{{ expr }}"></a>', {
			processAttribute,
		});
		expect(report).toBeValid();
	});

	describe("allowExternal: false", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: { "allowed-links": ["error", { allowExternal: false }] },
			});
		});

		it("should report error when link is external using //", () => {
			expect.assertions(2);
			const report = htmlvalidate.validateString('<a href="//example.net/foo"></a>');
			expect(report).toBeInvalid();
			expect(report).toHaveError("allowed-links", "Link destination must not be external url");
		});

		it("should report error when link is external using protocol://", () => {
			expect.assertions(2);
			const report = htmlvalidate.validateString('<a href="http://example.net/foo"></a>');
			expect(report).toBeInvalid();
			expect(report).toHaveError("allowed-links", "Link destination must not be external url");
		});

		it("should not report error when link is absolute", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="/foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is relative to path", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="./foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is relative to base", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="foo"></a>');
			expect(report).toBeValid();
		});
	});

	describe("allowRelative: false", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: { "allowed-links": ["error", { allowRelative: false }] },
			});
		});

		it("should not report error when link is external using //", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="//example.net/foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is external using protocol://", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="http://example.net/foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is absolute", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="/foo"></a>');
			expect(report).toBeValid();
		});

		it("should report error when link is relative to path", () => {
			expect.assertions(2);
			const report = htmlvalidate.validateString('<a href="./foo"></a>');
			expect(report).toBeInvalid();
			expect(report).toHaveError("allowed-links", "Link destination must not be relative url");
		});

		it("should report error when link is relative to base", () => {
			expect.assertions(2);
			const report = htmlvalidate.validateString('<a href="foo"></a>');
			expect(report).toBeInvalid();
			expect(report).toHaveError("allowed-links", "Link destination must not be relative url");
		});
	});

	describe("allowBase: false", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: { "allowed-links": ["error", { allowBase: false }] },
			});
		});

		it("should not report error when link is external using //", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="//example.net/foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is external using protocol://", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="http://example.net/foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is absolute", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="/foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is relative to path", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="./foo"></a>');
			expect(report).toBeValid();
		});

		it("should report error when link is relative to base", () => {
			expect.assertions(2);
			const report = htmlvalidate.validateString('<a href="foo"></a>');
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"Relative links must be relative to current folder"
			);
		});
	});

	describe("allowAbsolute: false", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: { "allowed-links": ["error", { allowAbsolute: false }] },
			});
		});

		it("should not report error when link is external using //", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="//example.net/foo"></a>');
			expect(report).toBeValid();
		});

		it("should not report error when link is external using protocol://", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="http://example.net/foo"></a>');
			expect(report).toBeValid();
		});

		it("should report error when link is absolute", () => {
			expect.assertions(2);
			const report = htmlvalidate.validateString('<a href="/foo"></a>');
			expect(report).toBeInvalid();
			expect(report).toHaveError("allowed-links", "Link destination must not be absolute url");
		});

		it("should not report error when link is relative to path", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="./foo"></a>');
			expect(report).toBeValid();
		});

		it("should report error when link is relative to base", () => {
			expect.assertions(1);
			const report = htmlvalidate.validateString('<a href="foo"></a>');
			expect(report).toBeValid();
		});
	});

	describe("include", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: {
					"allowed-links": [
						"error",
						{
							allowExternal: { include: ["^//example.net"] },
							allowRelative: { include: ["\\.png$"] },
							allowAbsolute: { include: ["^/foobar/"] },
						},
					],
				},
			});
		});

		it("should report error when external link is not allowed", () => {
			expect.assertions(2);
			const markup = '<a href="//example.org/foo"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"External link to this destination is not allowed by current configuration"
			);
		});

		it("should report error when relative link is not allowed", () => {
			expect.assertions(2);
			const markup = '<img src="../foo.jpg">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"Relative link to this destination is not allowed by current configuration"
			);
		});

		it("should report error when base relative link is not allowed", () => {
			expect.assertions(2);
			const markup = '<img src="foo.jpg">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"Relative link to this destination is not allowed by current configuration"
			);
		});

		it("should report error when absolute link is not allowed", () => {
			expect.assertions(2);
			const markup = '<a href="/folder"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"Absolute link to this destination is not allowed by current configuration"
			);
		});

		it("should not report error when external link is allowed", () => {
			expect.assertions(1);
			const markup = '<a href="//example.net/foo"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should not report error when relative link is allowed", () => {
			expect.assertions(1);
			const markup = '<img src="../foo.png">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should not report error when base relative link is allowed", () => {
			expect.assertions(1);
			const markup = '<img src="foo.png">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should not report error when absolute link is allowed", () => {
			expect.assertions(1);
			const markup = '<a href="/foobar/baz"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});
	});

	describe("exclude", () => {
		beforeAll(() => {
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: {
					"allowed-links": [
						"error",
						{
							allowExternal: { exclude: ["^//example.net"] },
							allowRelative: { exclude: ["\\.png$"] },
							allowAbsolute: { exclude: ["^/foobar/"] },
						},
					],
				},
			});
		});

		it("should report error when external link is not allowed", () => {
			expect.assertions(2);
			const markup = '<a href="//example.net/foo"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"External link to this destination is not allowed by current configuration"
			);
		});

		it("should report error when relative link is not allowed", () => {
			expect.assertions(2);
			const markup = '<img src="../foo.png">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"Relative link to this destination is not allowed by current configuration"
			);
		});

		it("should report error when base relative link is not allowed", () => {
			expect.assertions(2);
			const markup = '<img src="foo.png">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"Relative link to this destination is not allowed by current configuration"
			);
		});

		it("should report error when absolute link is not allowed", () => {
			expect.assertions(2);
			const markup = '<a href="/foobar/baz"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeInvalid();
			expect(report).toHaveError(
				"allowed-links",
				"Absolute link to this destination is not allowed by current configuration"
			);
		});

		it("should not report error when external link is allowed", () => {
			expect.assertions(1);
			const markup = '<a href="//example.org/foo"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should not report error when relative link is allowed", () => {
			expect.assertions(1);
			const markup = '<img src="../foo.jpg">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should not report error when base relative link is allowed", () => {
			expect.assertions(1);
			const markup = '<img src="foo.jpg">';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});

		it("should not report error when absolute link is allowed", () => {
			expect.assertions(1);
			const markup = '<a href="/folder"></a>';
			const report = htmlvalidate.validateString(markup);
			expect(report).toBeValid();
		});
	});

	it("should contain documentation", async () => {
		expect.assertions(1);
		htmlvalidate = new HtmlValidate({
			root: true,
			rules: { "allowed-links": "error" },
		});
		const docs = await htmlvalidate.getRuleDocumentation("allowed-links");
		expect(docs).toMatchSnapshot();
	});

	describe("should contain contextual documentation", () => {
		it.each`
			style                 | value
			${"external"}         | ${Style.EXTERNAL}
			${"relative to base"} | ${Style.RELATIVE_BASE}
			${"relative to path"} | ${Style.RELATIVE_PATH}
			${"absolute"}         | ${Style.ABSOLUTE}
		`("$style", async ({ value }) => {
			expect.assertions(1);
			htmlvalidate = new HtmlValidate({
				root: true,
				rules: { "allowed-links": "error" },
			});
			const docs = await htmlvalidate.getRuleDocumentation("allowed-links", null, value);
			expect(docs).toMatchSnapshot();
		});
	});
});
