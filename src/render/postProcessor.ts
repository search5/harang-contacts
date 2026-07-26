import { MarkdownPostProcessorContext } from "obsidian";
import { ContactStore } from "../carddav/store";
import { createContactChip } from "./chip";
import { parseContactRef, resolveContactRef } from "./contactRef";

const CONTACT_RE = /@contact\[([^\]]+)\]/g;

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
			CONTACT_RE.lastIndex = 0;
			if (CONTACT_RE.test(text)) targets.push(node as Text);
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
	CONTACT_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = CONTACT_RE.exec(text))) {
		if (match.index > lastIndex) {
			fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
		}
		const ref = parseContactRef(match[1]);
		fragment.appendChild(createContactChip(resolveContactRef(store, ref), ref.name));
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
	}
	parent.replaceChild(fragment, textNode);
}
