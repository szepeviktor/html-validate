import { AttributeEvent } from "../event";
import { Rule, RuleDocumentation, ruleDocumentationUrl } from "../rule";

const defaults = {
	style: "lowercase",
};

class AttrCase extends Rule {
	pattern: RegExp;
	lettercase: string;

	constructor(options: object){
		super(Object.assign({}, defaults, options));
		[this.pattern, this.lettercase] = parseStyle(this.options.style);
	}

	documentation(): RuleDocumentation {
		return {
			description: `Attribute name must be ${this.options.style}.`,
			url: ruleDocumentationUrl(__filename),
		};
	}

	setup(){
		this.on("attr", (event: AttributeEvent) => {
			const letters = event.key.replace(/[^a-z]+/ig, "");
			if (!letters.match(this.pattern)){
				this.report(event.target, `Attribute "${event.key}" should be ${this.lettercase}`);
			}
		});
	}
}

function parseStyle(style: string): [RegExp, string] {
	switch (style.toLowerCase()){
	case "lowercase": return [/^[a-z]*$/, "lowercase"];
	case "uppercase": return [/^[A-Z]*$/, "uppercase"];
	default:
		throw new Error(`Invalid style "${style}" for "attr-case" rule`);
	}
}

module.exports = AttrCase;
