import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { ContactStore } from "../carddav/store";
import { createContactChip } from "./chip";

const HRCARD_RE = /\{\{hrcard:([^:}]+):([^}]+)\}\}/g;

class ContactWidget extends WidgetType {
	constructor(private profileName: string, private uid: string, private store: ContactStore) {
		super();
	}

	eq(other: ContactWidget): boolean {
		return other.profileName === this.profileName && other.uid === this.uid;
	}

	toDOM(): HTMLElement {
		return createContactChip(this.store.getByUid(this.uid, this.profileName), this.uid);
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
				const livePreviewChanged =
					update.startState.field(editorLivePreviewField, false) !==
					update.state.field(editorLivePreviewField, false);
				if (update.docChanged || update.viewportChanged || update.selectionSet || livePreviewChanged) {
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
					HRCARD_RE.lastIndex = 0;
					let match: RegExpExecArray | null;
					while ((match = HRCARD_RE.exec(text))) {
						const start = from + match.index;
						const end = start + match[0].length;

						const nodeType = tree.resolveInner(start, 1).name;
						if (/comment|code/i.test(nodeType)) continue;

						const overlapsSelection = selection.ranges.some((r) => r.from <= end && r.to >= start);
						if (overlapsSelection) continue;

						const [, profileName, uid] = match;
						builder.add(start, end, Decoration.replace({ widget: new ContactWidget(profileName, uid, store) }));
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
