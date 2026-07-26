import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { ContactStore } from "../carddav/store";
import { createContactChip } from "./chip";
import { parseContactRef, resolveContactRef } from "./contactRef";

const CONTACT_RE = /@contact\[([^\]]+)\]/g;

class ContactWidget extends WidgetType {
	constructor(private raw: string, private store: ContactStore) {
		super();
	}

	eq(other: ContactWidget): boolean {
		return other.raw === this.raw;
	}

	toDOM(): HTMLElement {
		const ref = parseContactRef(this.raw);
		return createContactChip(resolveContactRef(this.store, ref), ref.name);
	}
}

export function buildContactLivePreviewPlugin(store: ContactStore) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.build(view);
			}

			update(update: ViewUpdate): void {
				if (update.docChanged || update.viewportChanged || update.selectionSet) {
					this.decorations = this.build(update.view);
				}
			}

			build(view: EditorView): DecorationSet {
				const builder = new RangeSetBuilder<Decoration>();
				if (!view.state.field(editorLivePreviewField, false)) {
					return builder.finish();
				}

				const selection = view.state.selection;
				const tree = syntaxTree(view.state);

				for (const { from, to } of view.visibleRanges) {
					const text = view.state.doc.sliceString(from, to);
					CONTACT_RE.lastIndex = 0;
					let match: RegExpExecArray | null;
					while ((match = CONTACT_RE.exec(text))) {
						const start = from + match.index;
						const end = start + match[0].length;

						const nodeType = tree.resolveInner(start, 1).name;
						if (/comment|code/i.test(nodeType)) continue;

						const overlapsSelection = selection.ranges.some((r) => r.from <= end && r.to >= start);
						if (overlapsSelection) continue;

						builder.add(start, end, Decoration.replace({ widget: new ContactWidget(match[1], store) }));
					}
				}

				return builder.finish();
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
}
