import { MarkdownPostProcessorContext } from "obsidian";
import { ContactStore } from "../carddav/store";
import { createContactChip } from "./chip";

const HRCARD_RE = /\{\{hrcard:([^:}]+):([^}]+)\}\}/g;

export function createContactPostProcessor(store: ContactStore) {
	return (el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
			acceptNode(node) {
				const parent = node.parentElement;
				if (parent && parent.closest("code, pre")) return NodeFilter.FILTER_REJECT;
				return NodeFilter.FILTER_ACCEPT;
			},
		});

		const targets: Text[] = [];
		let node: Node | null;
		while ((node = walker.nextNode())) {
			const text = node.textContent;
			if (!text) continue;
			HRCARD_RE.lastIndex = 0;
			if (HRCARD_RE.test(text)) targets.push(node as Text);
		}

		for (const textNode of targets) {
			replaceInTextNode(textNode, store);
		}
	};
}

function replaceInTextNode(textNode: Text, store: ContactStore): void {
	const text = textNode.textContent ?? "";
	const parent = textNode.parentNode;
	if (!parent) return;

	const fragment = createFragment();
	let lastIndex = 0;
	HRCARD_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = HRCARD_RE.exec(text))) {
		if (match.index > lastIndex) {
			fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
		}
		const [, profileName, uid] = match;
		fragment.appendChild(createContactChip(store.getByUid(uid, profileName), uid));
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
	}
	parent.replaceChild(fragment, textNode);
}
