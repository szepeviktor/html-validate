---
docType: rule
name: capitalize-text
summary: Require text to be capitalized
---

# Require text to be capitalized (`capitalize-text`)

## Rule details

Examples of **incorrect** code for this rule:

<validate name="incorrect" rules="capitalize-text">
    <h1>lorem ipsum</h1>
</validate>

Examples of **correct** code for this rule:

<validate name="correct" rules="capitalize-text">
    <h1>Lorem ipsum</h1>
</validate>

## Options

This rule takes an optional object:

```javascript
{
	include: [
		"button",
		"caption",
		"figcaption",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"label",
		"legend",
		"option",
		"p",
	],
	exclude: null,
	skip: ["code"]
}
```

### `include`

List of elements to test.

### `exclude`

List of elements to ignore.

### `skip`

When the first node (excluding interelement whitespace) is one of the listed elements the parent is ignored.
For instance, if `code` is listed `<h1><code>..</code></h1>` it valid even if the text is not capitalized.

<validate name="ignored" rules="capitalize-text">
    <h1><code>loremIpsum</code> dolor sit amet</h1>
</validate>
