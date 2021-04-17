import { HtmlElement, isElement } from "../dom";
import { ElementReadyEvent } from "../event";
import { Rule, RuleDocumentation, ruleDocumentationUrl, SchemaObject } from "../rule";
import { classifyNodeText } from "./helper";
import { TextClassification } from "./helper/text";

interface RuleContext {
	tagName: string;
}

interface RuleOptions {
	include: string[] | null;
	exclude: string[] | null;
	skip: string[] | null;
}

const defaults: RuleOptions = {
	include: [
		"button",
		"caption",
		"figcaption",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"label",
		"legend",
		"option",
		"p",
	],
	exclude: null,
	skip: ["code"],
};

/* Lu: uppercase letter, see https://unicode.org/reports/tr18/#General_Category_Property */
const isCapitalized = /^\p{Lu}/u;
const isNonLetter = /^[^\p{L}]/u;

export default class CapitalizeText extends Rule<RuleContext, RuleOptions> {
	public constructor(options: Partial<RuleOptions>) {
		super({ ...defaults, ...options });
	}

	public static schema(): SchemaObject {
		return {
			exclude: {
				anyOf: [
					{
						items: {
							type: "string",
						},
						type: "array",
					},
					{
						type: "null",
					},
				],
			},
			include: {
				anyOf: [
					{
						items: {
							type: "string",
						},
						type: "array",
					},
					{
						type: "null",
					},
				],
			},
			skip: {
				anyOf: [
					{
						items: {
							type: "string",
						},
						type: "array",
					},
					{
						type: "null",
					},
				],
			},
		};
	}

	public documentation(context?: RuleContext): RuleDocumentation {
		const description: string = context
			? `Text must be capitalized in <${context.tagName}>. Under the current configuration the <${context.tagName}> text is required to begin with a capital letter.`
			: `Text must be capitalized in this element. Under the current configuration the current elements text is required to begin with a capital letter.`;
		return {
			description,
			url: ruleDocumentationUrl(__filename),
		};
	}

	public setup(): void {
		this.on(
			"element:ready",
			(event: ElementReadyEvent) => this.isRelevant(event),
			(event: ElementReadyEvent) => {
				const { target } = event;

				/* ignore elements with empty or dynamic text */
				if (classifyNodeText(target) !== TextClassification.STATIC_TEXT) {
					return;
				}

				/* ignore elements with capitalized text */
				const text = target.textContent.trim();
				if (isCapitalized.test(text) || isNonLetter.test(text)) {
					return;
				}

				/* ignore element if the first child element is ignored */
				if (this.isIgnored(target)) {
					return;
				}

				const tagName = target.tagName;
				const context: RuleContext = { tagName };
				this.report(event.target, `Text must be capitalized in <${tagName}>`, null, context);
			}
		);
	}

	protected isRelevant(event: ElementReadyEvent): boolean {
		const tagName = event.target.tagName;
		return !this.isKeywordIgnored(tagName);
	}

	protected isIgnored(node: HtmlElement): boolean {
		const ignored = this.options.skip;
		if (!ignored) {
			return false;
		}

		for (const child of node.childNodes) {
			if (child.textContent.trim() === "") {
				continue;
			}

			if (isElement(child)) {
				return ignored.includes(child.tagName);
			}

			break;
		}
		return false;
	}
}
