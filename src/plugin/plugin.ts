import { ConfigData } from "../config";
import { Source } from "../context";
import { EventHandler } from "../event";
import { RuleConstructor } from "../rule";
import { Transformer } from "../transform";

export interface SchemaValidationPatch {
	properties?: object;
	definitions?: object;
}

export interface Plugin {
	/**
	 * Name of the plugin.
	 *
	 * If specified this is the name used when referring to the plugin. Default is
	 * to use the name/path the user used when loading the plugin. To be less
	 * confusing for users you should use the same name as your package.
	 *
	 * The name must be a valid package name according to NPM (basically lowercase
	 * characters, must not begin with dot, slash or non-url safe characters).
	 *
	 * Hint: import and use the name from `package.json`.
	 */
	name?: string;

	/**
	 * Initialization callback.
	 *
	 * Called once per plugin during initialization.
	 */
	init?: () => void;

	/**
	 * Setup callback.
	 *
	 * Called once per source after engine is initialized.
	 *
	 * @param source The source about to be validated. Readonly.
	 * @param eventhandler Eventhandler from parser. Can be used to listen for
	 * parser events.
	 */
	setup?: (source: Source, eventhandler: EventHandler) => void;

	/**
	 * Configuration presets.
	 *
	 * Each key should be the unprefixed name which a configuration later can
	 * access using `${plugin}:${key}`, e.g. if a plugin named "my-plugin" exposes
	 * a preset named "foobar" it can be accessed using:
	 *
	 * "extends": ["my-plugin:foobar"]
	 */
	configs?: Record<string, ConfigData>;

	/**
	 * List of new rules present.
	 */
	rules?: Record<string, RuleConstructor<any, any>>;

	/**
	 * Transformer available in this plugin.
	 *
	 * Can be given either as a single unnamed transformer or an object with
	 * multiple named.
	 *
	 * Unnamed transformers use the plugin name similar to how a standalone
	 * transformer would work:
	 *
	 * "transform": {
	 *   "^.*\\.foo$": "my-plugin"
	 * }
	 *
	 * For named transformers each key should be the unprefixed name which a
	 * configuration later can access using `${plugin}:${key}`, e.g. if a plugin
	 * named "my-plugin" exposes a transformer named "foobar" it can be accessed
	 * using:
	 *
	 * "transform": {
	 *   "^.*\\.foo$": "my-plugin:foobar"
	 * }
	 */
	transformer?: Transformer | Record<string, Transformer>;

	/**
	 * Extend metadata validation schema.
	 */
	elementSchema?: SchemaValidationPatch;
}
