import { Location } from "../../context";
import { HtmlElement, NodeClosed } from "../htmlelement";
import { firstChild } from "./first-child";

const location: Location = {
	filename: "inline",
	line: 1,
	column: 1,
	offset: 0,
	size: 1,
};

it("should return true if element is first child", () => {
	expect.assertions(2);
	const parent = new HtmlElement("parent", null, NodeClosed.EndTag, null, location);
	const a = new HtmlElement("a", parent, NodeClosed.EndTag, null, location);
	const b = new HtmlElement("b", parent, NodeClosed.EndTag, null, location);
	expect(firstChild(a)).toBeTruthy();
	expect(firstChild(b)).toBeFalsy();
});
