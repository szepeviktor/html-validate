import { HtmlElement } from "../dom";
import { DOMReadyEvent } from "../event";
import { Validator } from "../meta";
import { Rule, RuleDocumentation, ruleDocumentationUrl } from "../rule";

export default class ElementPermittedOccurrences extends Rule {
	public documentation(): RuleDocumentation {
		return {
			description: "Some elements may only be used a fixed amount of times in given context.",
			url: ruleDocumentationUrl(__filename),
		};
	}

	public setup(): void {
		this.on("dom:ready", (event: DOMReadyEvent) => {
			const doc = event.document;
			doc.visitDepthFirst((node: HtmlElement) => {
				if (!node || !node.meta) {
					return;
				}

				const rules = node.meta.permittedContent;
				if (!rules) {
					return;
				}

				Validator.validateOccurrences(
					node.childElements,
					rules,
					(child: HtmlElement, category: string) => {
						this.report(
							child,
							`Element <${category}> can only appear once under ${node.annotatedName}`
						);
					}
				);
			});
		});
	}
}
