import { AttributeEvent } from "../event";
import { Rule, RuleDocumentation, ruleDocumentationUrl } from "../rule";

export default class NoDeprecatedAttr extends Rule {
	public documentation(): RuleDocumentation {
		return {
			description: "HTML5 deprecated many old attributes.",
			url: ruleDocumentationUrl(__filename),
		};
	}

	public setup(): void {
		this.on("attr", (event: AttributeEvent) => {
			const node = event.target;
			const meta = node.meta;
			const attr = event.key.toLowerCase();

			/* cannot validate if meta isn't known */
			if (meta === null) {
				return;
			}

			const deprecated = meta.deprecatedAttributes || [];
			if (deprecated.includes(attr)) {
				this.report(node, `Attribute "${event.key}" is deprecated on <${node.tagName}> element`);
			}
		});
	}
}
