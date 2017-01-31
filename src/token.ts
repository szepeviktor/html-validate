'use strict';

enum Token {
	WHITESPACE = 1,
	NEWLINE,
	DOCTYPE_OPEN,
	DOCTYPE_VALUE,
	DOCTYPE_CLOSE,
	TAG_OPEN,
	TAG_CLOSE,
	ATTR_NAME,
	ATTR_VALUE,
	TEXT,
}

export default Token;
