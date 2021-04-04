import { DynamicValue } from "../dom";
import { AttributeEvent } from "../event";
import { describePattern, parsePattern, PatternName } from "../pattern";
import { Rule, RuleDocumentation, ruleDocumentationUrl, SchemaObject } from "../rule";

interface RuleOptions {
	pattern: PatternName;
}

const defaults: RuleOptions = {
	pattern: "kebabcase",
};

export default class IdPattern extends Rule<void, RuleOptions> {
	private pattern: RegExp;

	public constructor(options: Partial<RuleOptions>) {
		super({ ...defaults, ...options });
		this.pattern = parsePattern(this.options.pattern);
	}

	public static schema(): SchemaObject {
		return {
			pattern: {
				type: "string",
			},
		};
	}

	public documentation(): RuleDocumentation {
		const pattern = describePattern(this.options.pattern);
		return {
			description: `For consistency all IDs are required to match the pattern ${pattern}.`,
			url: ruleDocumentationUrl(__filename),
		};
	}

	public setup(): void {
		this.on("attr", (event: AttributeEvent) => {
			if (event.key.toLowerCase() !== "id") {
				return;
			}

			/* consider dynamic value as always matching the pattern */
			if (event.value instanceof DynamicValue) {
				return;
			}

			if (!event.value || !event.value.match(this.pattern)) {
				this.report(
					event.target,
					`ID "${event.value}" does not match required pattern "${this.pattern}"`,
					event.valueLocation
				);
			}
		});
	}
}
