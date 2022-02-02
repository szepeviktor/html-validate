import { TagReadyEvent } from "../event";
import { Rule, RuleDocumentation, ruleDocumentationUrl } from "../rule";
import { parseMetaContent } from "./helper";

export default class MetaViewportScalableRule extends Rule {
	public documentation(): RuleDocumentation {
		return {
			description: [
				"`user-scalable` must not be disabled as it interferes with the users ability to zoom on the page.",
				"",
				"Either remove the property entirely or set it to one of `yes` or `1`.",
			].join("\n"),
			url: ruleDocumentationUrl(__filename),
		};
	}

	public setup(): void {
		this.on("tag:ready", this.isRelevant, (event: TagReadyEvent) => {
			const { target } = event;

			/* ignore if content attribute isn't set */
			const attr = target.getAttribute("content");
			if (!attr) {
				return;
			}

			const parsed = parseMetaContent(target, attr);
			const userScalable = parsed.get("user-scalable");

			/* ignore if the user-scalable parameter isn't set */
			if (!userScalable) {
				return;
			}

			/* ignore if user-scalable is set to yes or 1.0 */
			if (userScalable.value === "yes" || parseFloat(userScalable.value) === 1) {
				return;
			}

			this.report(target, '"user-scalable" must not be disabled', userScalable.location);
		});
	}

	protected isRelevant(event: TagReadyEvent): boolean {
		const { target } = event;
		return target.is("meta") && target.getAttributeValue("name") === "viewport";
	}
}
