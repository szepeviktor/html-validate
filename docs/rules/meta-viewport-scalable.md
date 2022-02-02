---
docType: rule
name: meta-viewport-scalable
category: a17y
summary: Disallow `user-scalable` from being disabled
---

# Disallow `user-scalable` from being disabled (`meta-viewport-scalable`)

`user-scalable` must not be disabled as it interferes with the users ability to zoom on the page.

Either remove the property entirely or set it to one of `yes` or `1`.

## Rule details

Examples of **incorrect** code for this rule:

<validate name="incorrect" rules="meta-viewport-scalable">
	<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1" />
</validate>

Examples of **correct** code for this rule:

<validate name="correct" rules="meta-viewport-scalable">
	<!-- explicily enabled -->
	<meta name="viewport" content="user-scalable=yes" />
	
	<!-- property no set (default enabled) -->
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</validate>

## Options

This rule takes no options.

## Version history

- %version% - Rule added.
