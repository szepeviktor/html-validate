import fs from "fs";
import path from "path";
import Ajv from "ajv";
import deepmerge from "deepmerge";
import { Source } from "../context";
import { NestedError, SchemaValidationError } from "../error";
import { MetaTable } from "../meta";
import { MetaCopyableProperty, MetaDataTable } from "../meta/element";
import { Plugin } from "../plugin";
import schema from "../schema/config.json";
import { TransformContext, Transformer, TRANSFORMER_API } from "../transform";
import { ConfigData, RuleOptions, TransformMap } from "./config-data";
import defaultConfig from "./default";
import { ConfigError } from "./error";
import { parseSeverity, Severity } from "./severity";
import Presets from "./presets";
import { ResolvedConfig } from "./resolved-config";

interface TransformerEntry {
	pattern: RegExp;
	name: string;
	fn: Transformer;
}

/**
 * Internal interface for a loaded plugin.
 */
interface LoadedPlugin extends Plugin {
	name: string;
	originalName: string;
}

let rootDirCache: string | null = null;

const ajv = new Ajv({ strict: true, strictTuples: true, strictTypes: true });
ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

const validator = ajv.compile(schema);

function overwriteMerge<T>(a: T[], b: T[]): T[] {
	return b;
}

function mergeInternal(base: ConfigData, rhs: ConfigData): ConfigData {
	const dst = deepmerge(base, { ...rhs, rules: {} });

	/* rules need some special care, should overwrite arrays instead of
	 * concaternation, i.e. ["error", {...options}] should not be merged by
	 * appending to old value */
	if (rhs.rules) {
		dst.rules = deepmerge(dst.rules, rhs.rules, { arrayMerge: overwriteMerge });
	}

	/* root property is merged with boolean "or" since it should always be truthy
	 * if any config has it set. */
	const root = base.root || rhs.root;
	if (root) {
		dst.root = root;
	}

	return dst;
}

function loadFromFile(filename: string): ConfigData {
	let json;
	try {
		/* remove cached copy so we always load a fresh copy, important for editors
		 * which keep a long-running instance of [[HtmlValidate]] around. */
		delete require.cache[require.resolve(filename)];

		/* load using require as it can process both js and json */
		json = require(filename); // eslint-disable-line import/no-dynamic-require
	} catch (err) {
		throw new ConfigError(`Failed to read configuration from "${filename}"`, err);
	}

	/* expand any relative paths */
	for (const key of ["extends", "elements", "plugins"]) {
		if (!json[key]) continue;
		json[key] = json[key].map((ref: string) => {
			return Config.expandRelative(ref, path.dirname(filename));
		});
	}

	return json;
}

/**
 * Configuration holder.
 *
 * Each file being validated will have a unique instance of this class.
 */
export class Config {
	private config: ConfigData;
	private configurations: Map<string, ConfigData>;
	private initialized: boolean;

	protected metaTable: MetaTable | null;
	protected plugins: LoadedPlugin[];
	protected transformers: TransformerEntry[] = [];
	protected rootDir: string;

	/**
	 * Create a new blank configuration. See also `Config.defaultConfig()`.
	 */
	public static empty(): Config {
		return new Config({
			extends: [],
			rules: {},
			plugins: [],
			transform: {},
		});
	}

	/**
	 * Create configuration from object.
	 */
	public static fromObject(options: ConfigData, filename: string | null = null): Config {
		Config.validate(options, filename);
		return new Config(options);
	}

	/**
	 * Read configuration from filename.
	 *
	 * Note: this reads configuration data from a file. If you intent to load
	 * configuration for a file to validate use `ConfigLoader.fromTarget()`.
	 *
	 * @param filename - The file to read from or one of the presets such as
	 * `html-validate:recommended`.
	 */
	public static fromFile(filename: string): Config {
		const configdata = loadFromFile(filename);
		return Config.fromObject(configdata, filename);
	}

	/**
	 * Validate configuration data.
	 *
	 * Throws SchemaValidationError if invalid.
	 */
	public static validate(options: ConfigData, filename: string | null = null): void {
		const valid = validator(options);
		if (!valid) {
			throw new SchemaValidationError(
				filename,
				`Invalid configuration`,
				options,
				schema,
				validator.errors ?? []
			);
		}
	}

	/**
	 * Load a default configuration object.
	 */
	public static defaultConfig(): Config {
		return new Config(defaultConfig);
	}

	public constructor(options?: ConfigData) {
		const initial: ConfigData = {
			extends: [],
			plugins: [],
			rules: {},
			transform: {},
		};
		this.config = mergeInternal(initial, options || {});
		this.metaTable = null;
		this.rootDir = this.findRootDir();
		this.initialized = false;

		/* load plugins */
		this.plugins = this.loadPlugins(this.config.plugins || []);
		this.configurations = this.loadConfigurations(this.plugins);
		this.extendMeta(this.plugins);

		/* process extended configs */
		for (const extend of this.config.extends ?? []) {
			this.config = this.extendConfig(extend);
		}

		/* rules explicitly set by passed options should have precedence over any
		 * extended rules, not the other way around. */
		if (options && options.rules) {
			this.config = mergeInternal(this.config, { rules: options.rules });
		}
	}

	/**
	 * Initialize plugins, transforms etc.
	 *
	 * Must be called before trying to use config. Can safely be called multiple
	 * times.
	 */
	public init(): void {
		if (this.initialized) {
			return;
		}

		/* precompile transform patterns */
		this.transformers = this.precompileTransformers(this.config.transform || {});

		this.initialized = true;
	}

	/**
	 * Returns true if this configuration is marked as "root".
	 */
	public isRootFound(): boolean {
		return Boolean(this.config.root);
	}

	/**
	 * Returns a new configuration as a merge of the two. Entries from the passed
	 * object takes priority over this object.
	 *
	 * @param {Config} rhs - Configuration to merge with this one.
	 */
	public merge(rhs: Config): Config {
		return new Config(mergeInternal(this.config, rhs.config));
	}

	private extendConfig(entry: string): ConfigData {
		let base: ConfigData;
		if (this.configurations.has(entry)) {
			base = this.configurations.get(entry) as ConfigData;
		} else {
			base = Config.fromFile(entry).config;
		}
		return mergeInternal(this.config, base);
	}

	/**
	 * Get element metadata.
	 */
	public getMetaTable(): MetaTable {
		/* use cached table if it exists */
		if (this.metaTable) {
			return this.metaTable;
		}

		const metaTable = new MetaTable();
		const source = this.config.elements || ["html5"];
		const root = path.resolve(__dirname, "..", "..");

		/* extend validation schema from plugins */
		for (const plugin of this.getPlugins()) {
			if (plugin.elementSchema) {
				metaTable.extendValidationSchema(plugin.elementSchema);
			}
		}

		/* load from all entries */
		for (const entry of source) {
			/* load meta directly from entry */
			if (typeof entry !== "string") {
				metaTable.loadFromObject(entry as MetaDataTable);
				continue;
			}

			let filename: string;

			/* try searching builtin metadata */
			filename = `${root}/elements/${entry}.json`;
			if (fs.existsSync(filename)) {
				metaTable.loadFromFile(filename);
				continue;
			}

			/* try as regular file */
			filename = entry.replace("<rootDir>", this.rootDir);
			if (fs.existsSync(filename)) {
				metaTable.loadFromFile(filename);
				continue;
			}

			/* assume it is loadable with require() */
			try {
				// eslint-disable-next-line security/detect-non-literal-require, import/no-dynamic-require
				metaTable.loadFromObject(require(entry));
			} catch (err) {
				throw new ConfigError(`Failed to load elements from "${entry}": ${err.message}`, err);
			}
		}

		metaTable.init();
		return (this.metaTable = metaTable);
	}

	/**
	 * @hidden exposed for testing only
	 */
	public static expandRelative(src: string, currentPath: string): string {
		if (src[0] === ".") {
			return path.normalize(`${currentPath}/${src}`);
		}
		return src;
	}

	/**
	 * Get a copy of internal configuration data.
	 *
	 * @hidden primary purpose is unittests
	 */
	public get(): ConfigData {
		const config = { ...this.config };
		if (config.elements) {
			config.elements = config.elements.map((cur) => {
				if (typeof cur === "string") {
					return cur.replace(this.rootDir, "<rootDir>");
				} else {
					return cur;
				}
			});
		}
		return config;
	}

	/**
	 * Get all configured rules, their severity and options.
	 */
	public getRules(): Map<string, [Severity, RuleOptions]> {
		const rules = new Map<string, [Severity, RuleOptions]>();
		for (const [ruleId, data] of Object.entries(this.config.rules ?? {})) {
			let options = data;
			if (!Array.isArray(options)) {
				options = [options, {}];
			} else if (options.length === 1) {
				options = [options[0], {}];
			}
			const severity = parseSeverity(options[0]);
			rules.set(ruleId, [severity, options[1]]);
		}
		return rules;
	}

	/**
	 * Get all configured plugins.
	 */
	public getPlugins(): Plugin[] {
		return this.plugins;
	}

	private loadPlugins(plugins: string[]): LoadedPlugin[] {
		return plugins.map((moduleName: string) => {
			try {
				// eslint-disable-next-line security/detect-non-literal-require, import/no-dynamic-require
				const plugin = require(moduleName.replace("<rootDir>", this.rootDir)) as LoadedPlugin;
				plugin.name = plugin.name || moduleName;
				plugin.originalName = moduleName;
				return plugin;
			} catch (err) {
				throw new ConfigError(`Failed to load plugin "${moduleName}": ${err}`, err);
			}
		});
	}

	private loadConfigurations(plugins: LoadedPlugin[]): Map<string, ConfigData> {
		const configs: Map<string, ConfigData> = new Map();

		/* builtin presets */
		for (const [name, config] of Object.entries(Presets)) {
			configs.set(name, config);
		}

		/* presets from plugins */
		for (const plugin of plugins) {
			for (const [name, config] of Object.entries(plugin.configs || {})) {
				if (!config) continue;

				/* add configuration with name provided by plugin */
				configs.set(`${plugin.name}:${name}`, config);

				/* add configuration with name provided by user (in config file) */
				if (plugin.name !== plugin.originalName) {
					configs.set(`${plugin.originalName}:${name}`, config);
				}
			}
		}

		return configs;
	}

	private extendMeta(plugins: LoadedPlugin[]): void {
		for (const plugin of plugins) {
			if (!plugin.elementSchema) {
				continue;
			}

			const { properties } = plugin.elementSchema;
			if (!properties) {
				continue;
			}

			for (const [key, schema] of Object.entries(properties)) {
				if ((schema as any).copyable && !MetaCopyableProperty.includes(key)) {
					MetaCopyableProperty.push(key);
				}
			}
		}
	}

	public resolve(): ResolvedConfig {
		return new ResolvedConfig({
			metaTable: this.getMetaTable(),
			plugins: this.getPlugins(),
			rules: this.getRules(),
		});
	}

	/**
	 * Transform a source.
	 *
	 * When transforming zero or more new sources will be generated.
	 *
	 * @param source - Current source to transform.
	 * @param filename - If set it is the filename used to match
	 * transformer. Default is to use filename from source.
	 * @return A list of transformed sources ready for validation.
	 */
	public transformSource(source: Source, filename?: string): Source[] {
		const transformer = this.findTransformer(filename || source.filename);
		const context: TransformContext = {
			hasChain: (filename: string): boolean => {
				return !!this.findTransformer(filename);
			},
			chain: (source: Source, filename: string) => {
				return this.transformSource(source, filename);
			},
		};
		if (transformer) {
			try {
				return Array.from(transformer.fn.call(context, source), (cur: Source) => {
					/* keep track of which transformers that has been run on this source
					 * by appending this entry to the transformedBy array */
					cur.transformedBy = cur.transformedBy || [];
					cur.transformedBy.push(transformer.name);
					return cur;
				});
			} catch (err) {
				throw new NestedError(`When transforming "${source.filename}": ${err.message}`, err);
			}
		} else {
			return [source];
		}
	}

	/**
	 * Wrapper around [[transformSource]] which reads a file before passing it
	 * as-is to transformSource.
	 *
	 * @param source - Filename to transform (according to configured
	 * transformations)
	 * @return A list of transformed sources ready for validation.
	 */
	public transformFilename(filename: string): Source[] {
		const data = fs.readFileSync(filename, { encoding: "utf8" });
		const source: Source = {
			data,
			filename,
			line: 1,
			column: 1,
			offset: 0,
			originalData: data,
		};
		return this.transformSource(source);
	}

	/**
	 * Returns true if a transformer matches given filename.
	 */
	public canTransform(filename: string): boolean {
		const entry = this.findTransformer(filename);
		return !!entry;
	}

	private findTransformer(filename: string): TransformerEntry | null {
		const match = this.transformers.find((entry: TransformerEntry) => entry.pattern.test(filename));
		return match ?? null;
	}

	private precompileTransformers(transform: TransformMap): TransformerEntry[] {
		return Object.entries(transform).map(([pattern, name]) => {
			try {
				const fn = this.getTransformFunction(name);
				const version = (fn as any).api || 0;

				/* check if transformer version is supported */
				if (version !== TRANSFORMER_API.VERSION) {
					throw new ConfigError(
						`Transformer uses API version ${version} but only version ${TRANSFORMER_API.VERSION} is supported`
					);
				}

				return {
					// eslint-disable-next-line security/detect-non-literal-regexp
					pattern: new RegExp(pattern),

					name,
					fn,
				};
			} catch (err) {
				if (err instanceof ConfigError) {
					throw new ConfigError(`Failed to load transformer "${name}": ${err.message}`, err);
				} else {
					throw new ConfigError(`Failed to load transformer "${name}"`, err);
				}
			}
		});
	}

	/**
	 * Get transformation function requested by configuration.
	 *
	 * Searches:
	 *
	 * - Named transformers from plugins.
	 * - Unnamed transformer from plugin.
	 * - Standalone modules (local or node_modules)
	 *
	 * @param name - Key from configuration
	 */
	private getTransformFunction(name: string): Transformer {
		/* try to match a named transformer from plugin */
		const match = name.match(/(.*):(.*)/);
		if (match) {
			const [, pluginName, key] = match;
			return this.getNamedTransformerFromPlugin(name, pluginName, key);
		}

		/* try to match an unnamed transformer from plugin */
		const plugin = this.plugins.find((cur) => cur.name === name);
		if (plugin) {
			return this.getUnnamedTransformerFromPlugin(name, plugin);
		}

		/* assume transformer refers to a regular module */
		return this.getTransformerFromModule(name);
	}

	/**
	 * @param name - Original name from configuration
	 * @param pluginName - Name of plugin
	 * @param key - Name of transform (from plugin)
	 */
	private getNamedTransformerFromPlugin(
		name: string,
		pluginName: string,
		key: string
	): Transformer {
		const plugin = this.plugins.find((cur) => cur.name === pluginName);
		if (!plugin) {
			throw new ConfigError(`No plugin named "${pluginName}" has been loaded`);
		}

		if (!plugin.transformer) {
			throw new ConfigError(`Plugin does not expose any transformer`);
		}

		if (typeof plugin.transformer === "function") {
			throw new ConfigError(
				`Transformer "${name}" refers to named transformer but plugin exposes only unnamed, use "${pluginName}" instead.`
			);
		}

		const transformer = plugin.transformer[key];
		if (!transformer) {
			throw new ConfigError(`Plugin "${pluginName}" does not expose a transformer named "${key}".`);
		}

		return transformer;
	}

	/**
	 * @param name - Original name from configuration
	 * @param plugin - Plugin instance
	 */
	private getUnnamedTransformerFromPlugin(name: string, plugin: Plugin): Transformer {
		if (!plugin.transformer) {
			throw new ConfigError(`Plugin does not expose any transformer`);
		}

		if (typeof plugin.transformer !== "function") {
			if (plugin.transformer.default) {
				return plugin.transformer.default;
			}
			throw new ConfigError(
				`Transformer "${name}" refers to unnamed transformer but plugin exposes only named.`
			);
		}

		return plugin.transformer;
	}

	private getTransformerFromModule(name: string): Transformer {
		/* expand <rootDir> */
		const moduleName = name.replace("<rootDir>", this.rootDir);

		// eslint-disable-next-line security/detect-non-literal-require, import/no-dynamic-require
		const fn = require(moduleName);

		/* sanity check */
		if (typeof fn !== "function") {
			/* this is not a proper transformer, is it a plugin exposing a transformer? */
			if (fn.transformer) {
				throw new ConfigError(
					`Module is not a valid transformer. This looks like a plugin, did you forget to load the plugin first?`
				);
			}

			throw new ConfigError(`Module is not a valid transformer.`);
		}

		return fn;
	}

	protected findRootDir(): string {
		if (rootDirCache !== null) {
			return rootDirCache;
		}

		/* try to locate package.json */
		let current = process.cwd();
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const search = path.join(current, "package.json");
			if (fs.existsSync(search)) {
				return (rootDirCache = current);
			}

			/* get the parent directory */
			const child = current;
			current = path.dirname(current);

			/* stop if this is the root directory */
			if (current === child) {
				break;
			}
		}

		/* default to working directory if no package.json is found */
		return (rootDirCache = process.cwd());
	}
}
