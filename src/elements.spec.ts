import HtmlValidate from "./htmlvalidate";
import "./matchers";

const fileDirectory = "test-files/elements";
const tagNames = [
	"a",
	"abbr",
	"acronym",
	"address",
	"applet",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"base",
	"basefont",
	"bdi",
	"bdo",
	"bgsound",
	"big",
	"blink",
	"blockquote",
	"body",
	"br",
	"button",
	"canvas",
	"caption",
	"center",
	"cite",
	"code",
	"col",
	"colgroup",
	"data",
	"datalist",
	"dd",
	"del",
	"dfn",
	"dir",
	"div",
	"dl",
	"dt",
	"em",
	"embed",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"form",
	"frame",
	"frameset",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hgroup",
	"hr",
	"html",
	"i",
	"iframe",
	"img",
	"input",
	"ins",
	"isindex",
	"kbd",
	"keygen",
	"label",
	"legend",
	"li",
	"link",
	"listing",
	"main",
	"map",
	"mark",
	"marquee",
	"math",
	"meta",
	"meter",
	"multicol",
	"nav",
	"nextid",
	"nobr",
	"noembed",
	"noframes",
	"noscript",
	"object",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"param",
	"plaintext",
	"pre",
	"progress",
	"q",
	"rb",
	"rp",
	"rt",
	"rtc",
	"ruby",
	"s",
	"samp",
	"script",
	"section",
	"select",
	"small",
	"source",
	"spacer",
	"span",
	"strike",
	"strong",
	"style",
	"sub",
	"sup",
	"svg",
	"table",
	"tbody",
	"td",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"title",
	"tr",
	"track",
	"tt",
	"u",
	"ul",
	"var",
	"video",
	"wbr",
	"xmp",
];

describe("HTML elements", () => {
	const htmlvalidate = new HtmlValidate({
		rules: {
			deprecated: "error",
			"attribute-allowed-values": "error",
			"element-permitted-content": "error",
			"element-permitted-occurrences": "error",
			"element-permitted-order": "error",
			void: ["error", { style: "any" }],
		},
	});

	describe(`global attributes`, () => {
		it("valid markup", () => {
			const filename = `${fileDirectory}/global-attributes-valid.html`;
			const report = htmlvalidate.validateFile(filename);
			expect(report.results).toMatchSnapshot();
		});

		it("invalid markup", () => {
			const filename = `${fileDirectory}/global-attributes-invalid.html`;
			const report = htmlvalidate.validateFile(filename);
			expect(report.results).toMatchSnapshot();
		});
	});

	for (const tagName of tagNames) {
		const filename = (variant: string) =>
			`${fileDirectory}/${tagName}-${variant}.html`;

		describe(`<${tagName}>`, () => {
			it("valid markup", () => {
				const report = htmlvalidate.validateFile(filename("valid"));
				expect(report.results).toMatchSnapshot();
			});

			it("invalid markup", () => {
				const report = htmlvalidate.validateFile(filename("invalid"));
				expect(report.results).toMatchSnapshot();
			});
		});
	}
});
