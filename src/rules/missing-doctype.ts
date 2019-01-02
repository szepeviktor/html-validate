import { DOMReadyEvent } from "../event";
import { Rule, RuleDocumentation, ruleDocumentationUrl } from "../rule";

class MissingDoctype extends Rule {
	documentation(): RuleDocumentation {
		return {
			description: "Requires that the document contains a doctype.",
			url: ruleDocumentationUrl(__filename),
		};
	}

	setup() {
		this.on("dom:ready", (event: DOMReadyEvent) => {
			const dom = event.document;
			if (!dom.doctype) {
				this.report(dom.root, "Document is missing doctype");
			}
		});
	}
}

module.exports = MissingDoctype;
