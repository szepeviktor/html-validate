import { HtmlElement } from "../dom";
import { DOMReadyEvent } from "../event";
import { Validator } from "../meta";
import { Rule, RuleDocumentation } from "../rule";

class AttributeAllowedValues extends Rule {
	documentation(): RuleDocumentation {
		return {
			description: "Validates attributes for allowed values.",
			url: "https://html-validate.org/rules/attribute-allowed-values.html",
		};
	}

	setup(){
		this.on("dom:ready", (event: DOMReadyEvent) => {
			const doc = event.document;
			doc.visitDepthFirst((node: HtmlElement) => {
				const meta = node.meta;

				/* ignore rule if element has no meta or meta does not specify attribute
				 * allowed values */
				if (!meta || !meta.attributes) return;

				for (const [key, attr] of Object.entries(node.attr)){
					if (!Validator.validateAttribute(key, attr.value, meta.attributes)){
						this.report(node, `Attribute "${key}" has invalid value "${attr.value}"`, attr.location);
					}
				}
			});
		});
	}
}

module.exports = AttributeAllowedValues;
