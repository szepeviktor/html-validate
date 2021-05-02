import { sliceLocation } from "../context";
import { HtmlElement, Pattern } from "../dom";
import { DOMInternalID } from "../dom/domnode";
import { SelectorContext } from "../dom/selector-context";
import { TagCloseEvent, TagReadyEvent, TagStartEvent } from "../event";
import { Rule, RuleDocumentation, ruleDocumentationUrl, SchemaObject } from "../rule";

interface RuleOptions {
	allowMultipleH1: boolean;
	sectioningRoots: string[];
}

interface SectioningRoot {
	node: DOMInternalID | null;
	current: number;
	h1Count: number;
}

const defaults: RuleOptions = {
	allowMultipleH1: false,
	sectioningRoots: ["dialog", '[role="dialog"]'],
};

function isRelevant(event: TagStartEvent): boolean {
	const node = event.target;
	return Boolean(node.meta && node.meta.heading);
}

function extractLevel(node: HtmlElement): number | null {
	const match = node.tagName.match(/^[hH](\d)$/);
	if (match) {
		return parseInt(match[1], 10);
	} else {
		return null;
	}
}

export default class HeadingLevel extends Rule<void, RuleOptions> {
	private sectionRoots: Pattern[];
	private stack: SectioningRoot[] = [];

	public constructor(options: Partial<RuleOptions>) {
		super({ ...defaults, ...options });
		this.sectionRoots = this.options.sectioningRoots.map((it) => new Pattern(it));

		/* add a global sectioning root used by default */
		this.stack.push({
			node: null,
			current: 0,
			h1Count: 0,
		});
	}

	public static schema(): SchemaObject {
		return {
			allowMultipleH1: {
				type: "boolean",
			},
			sectioningRoots: {
				items: {
					type: "string",
				},
				type: "array",
			},
		};
	}

	public documentation(): RuleDocumentation {
		const text: string[] = [];
		text.push("Headings must start at <h1> and can only increase one level at a time.");
		text.push("The headings should form a table of contents and make sense on its own.");
		if (!this.options.allowMultipleH1) {
			text.push("");
			text.push(
				"Under the current configuration only a single <h1> can be present at a time in the document."
			);
		}
		return {
			description: text.join("\n"),
			url: ruleDocumentationUrl(__filename),
		};
	}

	public setup(): void {
		this.on("tag:start", isRelevant, (event: TagStartEvent) => this.onTagStart(event));
		this.on("tag:ready", (event: TagReadyEvent) => this.onTagReady(event));
		this.on("tag:close", (event: TagCloseEvent) => this.onTagClose(event));
	}

	private onTagStart(event: TagStartEvent): void {
		/* extract heading level from tagName (e.g "h1" -> 1)*/
		const level = extractLevel(event.target);
		if (!level) return;

		/* fetch the current sectioning root */
		const root = this.getCurrentRoot();

		/* do not allow multiple h1 */
		if (!this.options.allowMultipleH1 && level === 1) {
			if (root.h1Count >= 1) {
				const location = sliceLocation(event.location, 1);
				this.report(event.target, `Multiple <h1> are not allowed`, location);
				return;
			}
			root.h1Count++;
		}

		/* allow same level or decreasing to any level (e.g. from h4 to h2) */
		if (level <= root.current) {
			root.current = level;
			return;
		}

		/* validate heading level was only incremented by one */
		const expected = root.current + 1;
		if (level !== expected) {
			const location = sliceLocation(event.location, 1);
			if (root.current > 0) {
				const msg = `Heading level can only increase by one, expected <h${expected}> but got <h${level}>`;
				this.report(event.target, msg, location);
			} else if (this.stack.length === 1) {
				const msg = `Initial heading level must be <h${expected}> but got <h${level}>`;
				this.report(event.target, msg, location);
			}
		}

		root.current = level;
	}

	/**
	 * Check if the current element is a sectioning root and push a new root entry
	 * on the stack if it is.
	 */
	private onTagReady(event: TagReadyEvent): void {
		const { target } = event;
		if (this.isSectioningRoot(target)) {
			this.stack.push({
				node: target.unique,
				current: 0,
				h1Count: 0,
			});
		}
	}

	/**
	 * Check if the current element being closed is the element which opened the
	 * current sectioning root, in which case the entry is popped from the stack.
	 */
	private onTagClose(event: TagCloseEvent): void {
		const { previous: target } = event;
		const root = this.getCurrentRoot();
		if (target.unique !== root.node) {
			return;
		}
		this.stack.pop();
	}

	private getCurrentRoot(): SectioningRoot {
		return this.stack[this.stack.length - 1];
	}

	private isSectioningRoot(node: HtmlElement): boolean {
		const context: SelectorContext = {
			scope: node,
		};
		return this.sectionRoots.some((it) => it.match(node, context));
	}
}
