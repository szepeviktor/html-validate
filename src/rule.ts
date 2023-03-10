import Ajv, { ErrorObject, SchemaObject, ValidateFunction } from "ajv";
import ajvSchemaDraft from "ajv/lib/refs/json-schema-draft-06.json";
import { ConfigData } from "./config/config-data";
import { Severity } from "./config/severity";
import { Location } from "./context";
import { DOMNode } from "./dom";
import { Event, ListenEventMap } from "./event";
import { Parser } from "./parser";
import { Reporter } from "./reporter";
import { MetaTable, MetaLookupableProperty, MetaElement } from "./meta";
import { SchemaValidationError } from "./error";
import { interpolate } from "./utils/interpolate";
import { type IncludeExcludeOptions, isKeywordIgnored } from "./rules/helper";

export { type SchemaObject } from "ajv";

const remapEvents: Record<string, string> = {
	"tag:open": "tag:start",
	"tag:close": "tag:end",
};

const ajv = new Ajv({ strict: true, strictTuples: true, strictTypes: true });
ajv.addMetaSchema(ajvSchemaDraft);

interface ErrorDescriptor<ContextType> {
	node: DOMNode | null;
	message: string;
	location?: Location | null | undefined;
	context?: ContextType;
}

/**
 * @public
 */
export interface RuleDocumentation {
	description: string;
	url?: string;
}

export interface RuleConstructor<T, U> {
	new (options?: any): Rule<T, U>;
	schema(): SchemaObject | null | undefined;
}

/**
 * Get (cached) schema validator for rule options.
 *
 * @param ruleId - Rule ID used as key for schema lookups.
 * @param properties - Uncompiled schema.
 */
function getSchemaValidator(ruleId: string, properties: SchemaObject): ValidateFunction {
	const $id = `rule/${ruleId}`;

	const cached = ajv.getSchema($id);
	if (cached) {
		return cached;
	}

	const schema = {
		$id,
		type: "object",
		additionalProperties: false,
		properties,
	};

	return ajv.compile(schema);
}

function isErrorDescriptor<T>(
	value:
		| [ErrorDescriptor<T>]
		| [DOMNode | null, string]
		| [DOMNode | null, string, Location | null | undefined]
		| [DOMNode | null, string, Location | null | undefined, T]
): value is [ErrorDescriptor<T>] {
	return Boolean(value[0] && (value[0] as unknown as Record<string, unknown>).message);
}

function unpackErrorDescriptor<T>(
	value:
		| [ErrorDescriptor<T>]
		| [DOMNode | null, string]
		| [DOMNode | null, string, Location | null | undefined]
		| [DOMNode | null, string, Location | null | undefined, T]
): ErrorDescriptor<T> {
	if (isErrorDescriptor(value)) {
		return value[0];
	} else {
		const [node, message, location, context] = value;
		return { node, message, location, context };
	}
}

/**
 * @public
 */
export abstract class Rule<ContextType = void, OptionsType = void> {
	private reporter: Reporter;
	private parser: Parser;
	private meta: MetaTable;
	private enabled: boolean; // rule enabled/disabled, irregardless of severity
	private severity: number; // rule severity, 0: off, 1: warning 2: error
	private event: Event;

	/**
	 * Rule name. Defaults to filename without extension but can be overwritten by
	 * subclasses.
	 */
	public name: string;

	/**
	 * Rule options.
	 */
	public readonly options: OptionsType;

	public constructor(options: OptionsType) {
		/* faux initialization, properly initialized by init(). This is to keep TS happy without adding null-checks everywhere */
		this.reporter = null as unknown as Reporter;
		this.parser = null as unknown as Parser;
		this.meta = null as unknown as MetaTable;
		this.event = null as unknown as Event;

		this.options = options;
		this.enabled = true;
		this.severity = 0;
		this.name = "";
	}

	public getSeverity(): number {
		return this.severity;
	}

	public setServerity(severity: number): void {
		this.severity = severity;
	}

	public setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	/**
	 * Returns `true` if rule is deprecated.
	 *
	 * Overridden by subclasses.
	 */
	public get deprecated(): boolean {
		return false;
	}

	/**
	 * Test if rule is enabled.
	 *
	 * To be considered enabled the enabled flag must be true and the severity at
	 * least warning.
	 */
	public isEnabled(): boolean {
		return this.enabled && this.severity >= Severity.WARN;
	}

	/**
	 * Check if keyword is being ignored by the current rule configuration.
	 *
	 * This method requires the [[RuleOption]] type to include two properties:
	 *
	 * - include: string[] | null
	 * - exclude: string[] | null
	 *
	 * This methods checks if the given keyword is included by "include" but not
	 * excluded by "exclude". If any property is unset it is skipped by the
	 * condition. Usually the user would use either one but not both but there is
	 * no limitation to use both but the keyword must satisfy both conditions. If
	 * either condition fails `true` is returned.
	 *
	 * For instance, given `{ include: ["foo"] }` the keyword `"foo"` would match
	 * but not `"bar"`.
	 *
	 * Similarly, given `{ exclude: ["foo"] }` the keyword `"bar"` would match but
	 * not `"foo"`.
	 *
	 * @param keyword - Keyword to match against `include` and `exclude` options.
	 * @param matcher - Optional function to compare items with.
	 * @returns `true` if keyword is not present in `include` or is present in
	 * `exclude`.
	 */
	public isKeywordIgnored<T extends IncludeExcludeOptions>(
		this: { options: T },
		keyword: string,
		matcher: (list: string[], it: string) => boolean = (list, it) => list.includes(it)
	): boolean {
		return isKeywordIgnored(this.options, keyword, matcher);
	}

	/**
	 * Get [[MetaElement]] for the given tag. If no specific metadata is present
	 * the global metadata is returned or null if no global is present.
	 *
	 * @public
	 * @returns A shallow copy of metadata.
	 */
	public getMetaFor(tagName: string): MetaElement | null {
		return this.meta.getMetaFor(tagName);
	}

	/**
	 * Find all tags which has enabled given property.
	 */
	public getTagsWithProperty(propName: MetaLookupableProperty): string[] {
		return this.meta.getTagsWithProperty(propName);
	}

	/**
	 * Find tag matching tagName or inheriting from it.
	 */
	public getTagsDerivedFrom(tagName: string): string[] {
		return this.meta.getTagsDerivedFrom(tagName);
	}

	/**
	 * JSON schema for rule options.
	 *
	 * Rules should override this to return an object with JSON schema to validate
	 * rule options. If `null` or `undefined` is returned no validation is
	 * performed.
	 */
	public static schema(): SchemaObject | null | undefined {
		return null;
	}

	/**
	 * Report a new error.
	 *
	 * Rule must be enabled both globally and on the specific node for this to
	 * have any effect.
	 */
	public report(error: ErrorDescriptor<ContextType>): void;
	public report(node: DOMNode | null, message: string): void;
	public report(node: DOMNode | null, message: string, location: Location | null | undefined): void;
	public report(
		node: DOMNode | null,
		message: string,
		location: Location | null | undefined,
		context: ContextType
	): void;
	public report(
		...args:
			| [ErrorDescriptor<ContextType>]
			| [DOMNode | null, string]
			| [DOMNode | null, string, Location | null | undefined]
			| [DOMNode | null, string, Location | null | undefined, ContextType]
	): void {
		const { node, message, location, context } = unpackErrorDescriptor(args);
		if (this.isEnabled() && (!node || node.ruleEnabled(this.name))) {
			const where = this.findLocation({ node, location, event: this.event });
			const interpolated = interpolate(message, context ?? {});
			this.reporter.add(this, interpolated, this.severity, node, where, context);
		}
	}

	private findLocation(src: {
		node: DOMNode | null;
		location?: Location | null;
		event: Event | null;
	}): Location {
		if (src.location) {
			return src.location;
		}
		if (src.event && src.event.location) {
			return src.event.location;
		}
		if (src.node && src.node.location) {
			return src.node.location;
		}
		return {} as Location;
	}

	/**
	 * Listen for events.
	 *
	 * Adding listeners can be done even if the rule is disabled but for the
	 * events to be delivered the rule must be enabled.
	 *
	 * If the optional filter callback is used it must be a function taking an
	 * event of the same type as the listener. The filter is called before the
	 * listener and if the filter returns false the event is discarded.
	 *
	 * @param event - Event name
	 * @param filter - Optional filter function. Callback is only called if filter functions return true.
	 * @param callback - Callback to handle event.
	 * @returns A function to unregister the listener
	 */
	public on<K extends keyof ListenEventMap>(
		event: K,
		callback: (event: ListenEventMap[K]) => void
	): () => void;
	public on<K extends keyof ListenEventMap>(
		event: K,
		filter: (event: ListenEventMap[K]) => boolean,
		callback: (event: ListenEventMap[K]) => void
	): () => void;
	public on(
		event: string,
		...args: [(event: Event) => void] | [(event: Event) => boolean, (event: Event) => void]
	): () => void {
		/* handle deprecated aliases */
		const remap = remapEvents[event];
		if (remap) {
			event = remap;
		}

		const callback = args.pop() as (event: Event) => void;
		const filter = (args.pop() as (event: Event) => boolean) ?? (() => true);

		return this.parser.on(event, (_event: string, data: Event) => {
			if (this.isEnabled() && filter(data)) {
				this.event = data;
				callback(data);
			}
		});
	}

	/**
	 * Called by [[Engine]] when initializing the rule.
	 *
	 * Do not override this, use the `setup` callback instead.
	 *
	 * @internal
	 */
	public init(parser: Parser, reporter: Reporter, severity: number, meta: MetaTable): void {
		this.parser = parser;
		this.reporter = reporter;
		this.severity = severity;
		this.meta = meta;
	}

	/**
	 * Validate rule options against schema. Throws error if object does not validate.
	 *
	 * For rules without schema this function does nothing.
	 *
	 * @throws {@link SchemaValidationError}
	 * Thrown when provided options does not validate against rule schema.
	 *
	 * @param cls - Rule class (constructor)
	 * @param ruleId - Rule identifier
	 * @param jsonPath - JSON path from which [[options]] can be found in [[config]]
	 * @param options - User configured options to be validated
	 * @param filename - Filename from which options originated
	 * @param config - Configuration from which options originated
	 *
	 * @internal
	 */
	public static validateOptions(
		cls: RuleConstructor<unknown, unknown> | undefined,
		ruleId: string,
		jsonPath: string,
		options: unknown,
		filename: string | null,
		config: ConfigData
	): void {
		if (!cls) {
			return;
		}

		const schema = cls.schema();
		if (!schema) {
			return;
		}

		const isValid = getSchemaValidator(ruleId, schema);
		if (!isValid(options)) {
			/* istanbul ignore next: it is always set when validation fails */
			const errors = isValid.errors ?? [];
			const mapped = errors.map((error: ErrorObject) => {
				error.instancePath = `${jsonPath}${error.instancePath}`;
				return error;
			});
			throw new SchemaValidationError(filename, `Rule configuration error`, config, schema, mapped);
		}
	}

	/**
	 * Rule setup callback.
	 *
	 * Override this to provide rule setup code.
	 */
	public abstract setup(): void;

	/**
	 * Rule documentation callback.
	 *
	 * Called when requesting additional documentation for a rule. Some rules
	 * provide additional context to provide context-aware suggestions.
	 *
	 * @param context - Error context given by a reported error.
	 * @returns Rule documentation and url with additional details or `null` if no
	 * additional documentation is available.
	 */
	/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
	public documentation(context?: ContextType): RuleDocumentation | null {
		return null;
	}
}

/**
 * @internal
 */
export function ruleDocumentationUrl(filename: string): string {
	const getRuleUrl: (filename: string) => string = require("./utils/get-rule-url");
	return getRuleUrl(filename);
}
