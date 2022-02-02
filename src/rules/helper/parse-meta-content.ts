import { Location, sliceLocation } from "../../context";
import { Attribute, DOMNode, isStaticAttribute } from "../../dom";

declare module "../../dom/cache" {
	export interface DOMNodeCache {
		[META_CONTENT]: Map<string, MetaContentParameter>;
	}
}

export interface MetaContentParameter {
	key: string;
	value: string;
	location: Location;
}

/**
 * @internal
 */
export const META_CONTENT = Symbol("metaContent");

function matchParameter(text: string): [leading: string, text: string, key: string, value: string] {
	const full = text.match(/(\s*)((\S+)\s*=\s*(\S+)?)/);
	if (full) {
		const [, leading, text, key, value = ""] = full;
		return [leading, text, key, value];
	}
	const partial = text.match(/(\s*)((\S+)\s*)/);
	if (partial) {
		const [, leading, text, key] = partial;
		return [leading, text, key, ""];
	}
	/* istanbul ignore next: one of the two should match or we should never get here */
	return ["", text, text, ""];
}

function parseParameter(
	location: Location,
	parameter: RegExpMatchArray
): [string, MetaContentParameter] {
	const raw = parameter[1];
	const [leading, text, key, value] = matchParameter(raw);
	const offset = (parameter.index ?? 0) + leading.length;
	const parsed: MetaContentParameter = {
		key: key.trim(),
		value: value.trim(),
		location: sliceLocation(location, offset, offset + text.length),
	};
	return [parsed.key, parsed];
}

/**
 * @internal
 */
export function parseMetaContentImpl(attr: Attribute): Map<string, MetaContentParameter> {
	if (attr.value === null) {
		return new Map();
	}

	if (!isStaticAttribute(attr)) {
		return new Map();
	}

	const location = attr.valueLocation;

	/* istanbul ignore next: will always be set when value is present */
	if (!location) {
		throw new Error("Attribute value location not set when parsing <meta> attribute");
	}

	const content = attr.value.toLowerCase();
	const parameters = Array.from(content.matchAll(/([^,;]+)\s*/g));
	return new Map(parameters.map((it) => parseParameter(location, it)));
}

/**
 * Parse the content attribute of the <meta> element.
 *
 * @internal
 */
export function parseMetaContent(
	node: DOMNode,
	attr: Attribute
): Map<string, MetaContentParameter> {
	const cached = node.cacheGet(META_CONTENT);
	if (cached) {
		return cached;
	}

	const parsed = parseMetaContentImpl(attr);
	node.cacheSet(META_CONTENT, parsed);

	return parsed;
}
