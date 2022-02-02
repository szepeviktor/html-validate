import { Location } from "../../context";
import { Attribute, DOMNode, DynamicValue, NodeType } from "../../dom";
import {
	MetaContentParameter,
	META_CONTENT,
	parseMetaContent,
	parseMetaContentImpl,
} from "./parse-meta-content";

const filename = "file";

const keyLocation: Location = {
	filename,
	offset: 1,
	line: 1,
	column: 2,
	size: 3,
};

const baseOffset = 6;
const valueLocation: Location = {
	filename,
	offset: baseOffset,
	line: 1,
	column: baseOffset + 1,
	size: 3,
};

function createContentAttribute(value: string): Attribute {
	return new Attribute("content", value, keyLocation, {
		...valueLocation,
		size: value.length,
	});
}

it("should return parsed properties", () => {
	expect.assertions(1);
	const attr = createContentAttribute("foo=bar, spam=ham");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "bar",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 7,
			},
		},
		spam: {
			key: "spam",
			value: "ham",
			location: {
				filename,
				offset: baseOffset + 9,
				line: 1,
				column: baseOffset + 10,
				size: 8,
			},
		},
	});
});

it("should handle comma as separator", () => {
	expect.assertions(1);
	const attr = createContentAttribute("foo=1, bar=2");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "1",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 5,
			},
		},
		bar: {
			key: "bar",
			value: "2",
			location: {
				filename,
				offset: baseOffset + 7,
				line: 1,
				column: baseOffset + 8,
				size: 5,
			},
		},
	});
});

it("should handle semi-colon as separator", () => {
	expect.assertions(1);
	const attr = createContentAttribute("foo=1; bar=2");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "1",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 5,
			},
		},
		bar: {
			key: "bar",
			value: "2",
			location: {
				filename,
				offset: baseOffset + 7,
				line: 1,
				column: baseOffset + 8,
				size: 5,
			},
		},
	});
});

it("should handle missing whitespace", () => {
	expect.assertions(1);
	const attr = createContentAttribute("foo=1,bar=2");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "1",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 5,
			},
		},
		bar: {
			key: "bar",
			value: "2",
			location: {
				filename,
				offset: baseOffset + 6,
				line: 1,
				column: baseOffset + 7,
				size: 5,
			},
		},
	});
});

it("should handle excessive whitespace", () => {
	expect.assertions(1);
	const attr = createContentAttribute(" foo = 1 , bar = 2 ");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "1",
			location: {
				filename,
				offset: baseOffset + 1,
				line: 1,
				column: baseOffset + 2,
				size: 7,
			},
		},
		bar: {
			key: "bar",
			value: "2",
			location: {
				filename,
				offset: baseOffset + 11,
				line: 1,
				column: baseOffset + 12,
				size: 7,
			},
		},
	});
});

it("should handle missing value", () => {
	expect.assertions(1);
	const attr = createContentAttribute("foo, bar");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 3,
			},
		},
		bar: {
			key: "bar",
			value: "",
			location: {
				filename,
				offset: baseOffset + 5,
				line: 1,
				column: baseOffset + 6,
				size: 3,
			},
		},
	});
});

it("should handle empty value", () => {
	expect.assertions(1);
	const attr = createContentAttribute("foo=, bar=");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 4,
			},
		},
		bar: {
			key: "bar",
			value: "",
			location: {
				filename,
				offset: baseOffset + 6,
				line: 1,
				column: baseOffset + 7,
				size: 4,
			},
		},
	});
});

it("should handle mixed combination", () => {
	expect.assertions(1);
	const attr = createContentAttribute("foo=1, bar=, baz");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({
		foo: {
			key: "foo",
			value: "1",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 5,
			},
		},
		bar: {
			key: "bar",
			value: "",
			location: {
				filename,
				offset: baseOffset + 7,
				line: 1,
				column: baseOffset + 8,
				size: 4,
			},
		},
		baz: {
			key: "baz",
			value: "",
			location: {
				filename,
				offset: baseOffset + 13,
				line: 1,
				column: baseOffset + 14,
				size: 3,
			},
		},
	});
});

it("should handle dynamic attribute", () => {
	expect.assertions(1);
	const value = new DynamicValue("foo");
	const attr = new Attribute("content", value, keyLocation, valueLocation);
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({});
});

it("should handle empty attribute", () => {
	expect.assertions(1);
	const attr = createContentAttribute("");
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({});
});

it("should handle omitted value", () => {
	expect.assertions(1);
	const attr = new Attribute("content", null, keyLocation, null);
	expect(Object.fromEntries(parseMetaContentImpl(attr))).toEqual({});
});

it("should cached result", () => {
	expect.assertions(2);
	const node = new DOMNode(NodeType.ELEMENT_NODE, "meta", keyLocation);
	const attr = createContentAttribute("foo=1, bar=2");
	const cacheSet = jest.spyOn(node, "cacheSet");
	expect(Object.fromEntries(parseMetaContent(node, attr))).toEqual({
		foo: {
			key: "foo",
			value: "1",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 5,
			},
		},
		bar: {
			key: "bar",
			value: "2",
			location: {
				filename,
				offset: baseOffset + 7,
				line: 1,
				column: baseOffset + 8,
				size: 5,
			},
		},
	});
	expect(cacheSet).toHaveBeenCalledWith(
		META_CONTENT,
		new Map([
			[
				"foo",
				{
					key: "foo",
					value: "1",
					location: {
						filename,
						offset: baseOffset,
						line: 1,
						column: baseOffset + 1,
						size: 5,
					},
				},
			],
			[
				"bar",
				{
					key: "bar",
					value: "2",
					location: {
						filename,
						offset: baseOffset + 7,
						line: 1,
						column: baseOffset + 8,
						size: 5,
					},
				},
			],
		])
	);
});

it("should return cached result", () => {
	expect.assertions(3);
	const node = new DOMNode(NodeType.ELEMENT_NODE, "meta", keyLocation);
	const attr = createContentAttribute("foo=1, bar=2");
	const cache = new Map<string, MetaContentParameter>([
		[
			"a",
			{
				key: "a",
				value: "1",
				location: {
					filename,
					offset: baseOffset,
					line: 1,
					column: baseOffset + 1,
					size: 5,
				},
			},
		],
	]);
	const cacheGet = jest.spyOn(node, "cacheGet").mockReturnValue(cache);
	const cacheSet = jest.spyOn(node, "cacheSet");
	expect(Object.fromEntries(parseMetaContent(node, attr))).toEqual({
		a: {
			key: "a",
			value: "1",
			location: {
				filename,
				offset: baseOffset,
				line: 1,
				column: baseOffset + 1,
				size: 5,
			},
		},
	});
	expect(cacheGet).toHaveBeenCalledWith(META_CONTENT);
	expect(cacheSet).not.toHaveBeenCalled();
});
