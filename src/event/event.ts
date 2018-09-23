import { DOMNode, DOMTree } from '../dom';
import { Location } from '../context';

export interface Event {
	location: Location;
}

export interface TagOpenEvent extends Event {
	target: DOMNode;
}

export interface TagCloseEvent extends Event {
	target: DOMNode;
	previous: DOMNode;
}

export interface AttributeEvent extends Event {
	key: string;
	value: any;
	quote: '"' | "'" | undefined;
	target: DOMNode;
}

export interface WhitespaceEvent extends Event {
	text: string;
}

export interface ConditionalEvent extends Event {
	condition: string;
}

export interface DirectiveEvent extends Event {
	action: string;
	data: string;
	comment: string;
}

export interface DoctypeEvent extends Event {
	value: string;
}

export interface DOMReadyEvent extends Event {
	document: DOMTree;
}
