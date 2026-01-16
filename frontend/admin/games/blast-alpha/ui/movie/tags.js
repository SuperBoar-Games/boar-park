import { api } from "./api.js";
import { state } from "./state.js";
import { createTagEditor } from "../common/tagEditor.js";

export function attachTagEditor(container, card) {
  const initialTagIds = (card.tags || []).map(t => String(t.id));

  createTagEditor({
    container,
    allTags: state.tags,
    tagsById: state.tagsById,
    initialTagIds,

    onChange: async (ids, rollback, prev) => {
      try {
        await api.setTags(card.id, ids.map(Number));

        // sync card in state
        card.tags = ids
          .map(id => state.tagsById[String(id)])
          .filter(Boolean);
      } catch (err) {
        console.error(err);
        alert("Failed to update tags");

        if (rollback && prev != null) {
          rollback(prev.split(",").filter(Boolean));
        }
      }
    },
  });
}

