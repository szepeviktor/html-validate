import fs from "fs";
import { UserError } from "../error/user-error";
import { Formatter } from "../formatters";
import { Report, Result } from "../reporter";

type WrappedFormatter = (results: Result[]) => string;

const availableFormatters = [
	"checkstyle",
	"codeframe",
	"json",
	"stylish",
	"text",
];

function wrap(
	formatter: Formatter,
	dst: string
): (results: Result[]) => string {
	return (results: Result[]) => {
		const output = formatter(results);
		if (dst) {
			// it is expected for the user to write report output to arbitrary locations
			// tslint:disable-next-line:tsr-detect-non-literal-fs-filename
			fs.writeFileSync(dst, output, "utf-8");
			return null;
		} else {
			return output;
		}
	};
}

export function getFormatter(formatters: string): (report: Report) => string {
	const fn: WrappedFormatter[] = formatters.split(",").map(cur => {
		const [name, dst] = cur.split("=", 2);
		if (!availableFormatters.includes(name)) {
			throw new UserError(`No formatter named "${name}"`);
		}
		// name is matched against whitelist
		// tslint:disable-next-line:tsr-detect-non-literal-require
		const formatter = require(`../formatters/${name}`);
		return wrap(formatter, dst);
	});
	return (report: Report) => {
		return fn
			.map((formatter: WrappedFormatter) => formatter(report.results))
			.filter(Boolean)
			.join("\n");
	};
}
