import { Source } from "../../context";
import { Transformer, TransformContext, TRANSFORMER_API } from "..";

/**
 * Mock transformer chaining to a new transformer by chopping of the current
 * extension. E.g. "my-file.bar.foo" -> "my-file.bar".
 */
function* mockTransformOptionalChain(
	this: TransformContext,
	source: Source
): Iterable<Source> {
	const next = source.filename.replace(/\.[^.]*$/, "");
	if (this.hasChain(next)) {
		yield* this.chain(
			{
				data: `data from mock-transform-optional-chain (was: ${source.data})`,
				filename: source.filename,
				line: 1,
				column: 1,
				originalData: source.originalData || source.data,
			},
			next
		);
	}
}

/* mocks are always written against current version */
mockTransformOptionalChain.api = TRANSFORMER_API.VERSION;

module.exports = mockTransformOptionalChain as Transformer;