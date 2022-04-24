import { HtmlElement } from "../dom";
import {
	InternalAttributeFlags,
	MetaAttribute,
	MetaData,
	MetaElement,
	PropertyEvaluator,
	PropertyExpression,
} from "./element";

function isSet(value?: unknown): boolean {
	return typeof value !== "undefined";
}

function flag(value?: boolean): true | undefined {
	return value ? true : undefined;
}

function stripUndefined(
	src: MetaAttribute & InternalAttributeFlags
): MetaAttribute & InternalAttributeFlags {
	const entries = Object.entries(src).filter(([, value]) => isSet(value));
	return Object.fromEntries(entries);
}

function migrateSingleAttribute(
	src: MetaData,
	key: string
): MetaAttribute & InternalAttributeFlags {
	const result: MetaAttribute & InternalAttributeFlags = {};

	result.deprecated = flag(src.deprecatedAttributes?.includes(key));
	result.required = flag(src.requiredAttributes?.includes(key));
	result.omit = undefined;

	const attr = src.attributes ? src.attributes[key] : undefined;
	if (typeof attr === "undefined") {
		return stripUndefined(result);
	}

	/* when the attribute is set to null we use a special property "delete" to
	 * flag it, if it is still set during merge (inheritance, overwriting, etc) the attribute will be removed */
	if (attr === null) {
		result.delete = true;
		return stripUndefined(result);
	}

	if (Array.isArray(attr)) {
		if (attr.length === 0) {
			result.boolean = true;
		} else {
			result.enum = attr.filter((it) => it !== "");
			if (attr.includes("")) {
				result.omit = true;
			}
		}
		return stripUndefined(result);
	} else {
		return stripUndefined({ ...result, ...attr });
	}
}

function migrateAttributes(src: MetaData): Record<string, MetaAttribute & InternalAttributeFlags> {
	const keys = [
		...Object.keys(src.attributes ?? {}),
		...(src.requiredAttributes ?? []),
		...(src.deprecatedAttributes ?? []),
	].sort();

	const entries: Array<[string, MetaAttribute & InternalAttributeFlags]> = keys.map((key) => {
		return [key, migrateSingleAttribute(src, key)];
	});

	return Object.fromEntries(entries);
}

function migrateExpression(
	expr: undefined | null | boolean | PropertyExpression | PropertyEvaluator
): boolean | PropertyEvaluator {
	/* coerce static values (especially undefined and null) to boolean */
	if (!expr || typeof expr === "boolean") {
		return Boolean(expr);
	}
	/* functions returned as-is */
	if (typeof expr === "function") {
		return expr;
	}

	/* migrate old string-based expressions */
	const [funcName, options] = typeof expr === "string" ? [expr, {}] : expr;
	switch (funcName) {
		case "isDescendant":
			return (node) => isDescendant(node, options);
		case "hasAttribute":
			return (node) => hasAttribute(node, options);
		case "matchAttribute":
			return (node) => matchAttribute(node, options);
		default:
			throw new Error("");
	}
}

function isDescendant(node: HtmlElement, tagName: any): boolean {
	if (typeof tagName !== "string") {
		throw new Error(
			`Property expression "isDescendant" must take string argument when evaluating metadata for <${node.tagName}>`
		);
	}
	let cur: HtmlElement | null = node.parent;
	while (cur && !cur.isRootElement()) {
		if (cur.is(tagName)) {
			return true;
		}
		cur = cur.parent;
	}
	return false;
}

function hasAttribute(node: HtmlElement, attr: any): boolean {
	if (typeof attr !== "string") {
		throw new Error(
			`Property expression "hasAttribute" must take string argument when evaluating metadata for <${node.tagName}>`
		);
	}
	return node.hasAttribute(attr);
}

function matchAttribute(node: HtmlElement, match: string | [string, string, string]): boolean {
	if (!Array.isArray(match) || match.length !== 3) {
		throw new Error(
			`Property expression "matchAttribute" must take [key, op, value] array as argument when evaluating metadata for <${node.tagName}>`
		);
	}
	const [key, op, value] = match.map((x) => x.toLowerCase());
	const nodeValue = (node.getAttributeValue(key) || "").toLowerCase();
	switch (op) {
		case "!=":
			return nodeValue !== value;
		case "=":
			return nodeValue === value;
		default:
			throw new Error(
				`Property expression "matchAttribute" has invalid operator "${op}" when evaluating metadata for <${node.tagName}>`
			);
	}
}

export function migrateElement(src: MetaData): Omit<MetaElement, "tagName"> {
	const result = {
		...src,
		metadata: migrateExpression(src.metadata),
		flow: migrateExpression(src.flow),
		sectioning: migrateExpression(src.sectioning),
		heading: migrateExpression(src.heading),
		phrasing: migrateExpression(src.phrasing),
		embedded: migrateExpression(src.embedded),
		interactive: migrateExpression(src.interactive),
		labelable: migrateExpression(src.labelable),
		attributes: migrateAttributes(src),
	};

	/* removed properties */
	delete result.deprecatedAttributes;
	delete result.requiredAttributes;

	return result;
}
