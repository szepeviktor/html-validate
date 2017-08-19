import DOMNode from './domnode';

class DOMTree {
	root: DOMNode;
	active: DOMNode;

	constructor(){
		this.root = DOMNode.rootNode();
		this.active = this.root;
	}

	pushActive(node: DOMNode): void {
		this.active = node;
	}

	popActive(): void {
		if (this.active.isRootElement()){
			return; /* root element should never be popped, continue as if
			         * nothing happened */
		}
		this.active = this.active.parent;
	}

	getActive(): DOMNode {
		return this.active;
	}

	getElementsByTagName(tagName: string) {
		return this.root.getElementsByTagName(tagName);
	}

	visitDepthFirst(callback: (node: DOMNode) => void): void {
		this.root.visitDepthFirst(callback);
	}
}

export default DOMTree;
