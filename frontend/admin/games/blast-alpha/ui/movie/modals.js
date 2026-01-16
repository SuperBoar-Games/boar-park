import { state } from "./state.js";
import { api } from "./api.js";
import { appendCard, updateCard } from "./view.js";
import { attachTagEditor } from "./tags.js";

/* ================= UTIL ================= */

function autoGrowTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

/* ================= PUBLIC ================= */

export async function openCardModal({ edit, data } = {}) {
  const card = data || {};

  // Ensure tags are loaded
  if (!state.tags.length) {
    const res = await api.getTags();
    state.tags = res.data || [];
    state.tagsById = Object.fromEntries(
      state.tags.map(t => [String(t.id), t])
    );
  }

  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" role="button">&times;</span>
      <h2>${edit ? "Edit" : "Add"} Card</h2>

      <form class="card-form">
        <label>
          Name
          <input name="name" required value="${card.name ?? ""}">
        </label>

        <label>
          Type
          <select name="type" required>
            <option value="">Select type</option>
            ${["HERO", "VILLAIN", "SR1", "SR2", "WC"]
              .map(
                t =>
                  `<option value="${t}" ${
                    card.type === t ? "selected" : ""
                  }>${t}</option>`
              )
              .join("")}
          </select>
        </label>

        <label>
          Call Sign
          <input name="call_sign" value="${card.call_sign ?? ""}">
        </label>

        <label>
          Ability
          <textarea name="ability_text" class="autogrow" required>
${card.ability_text ?? ""}
          </textarea>
        </label>

        <label>
          Ability 2
          <textarea name="ability_text2" class="autogrow">
${card.ability_text2 ?? ""}
          </textarea>
        </label>

        <label>
          Needs Review
          <select name="need_review">
            <option value="F" ${
              card.need_review !== "T" ? "selected" : ""
            }>No</option>
            <option value="T" ${
              card.need_review === "T" ? "selected" : ""
            }>Yes</option>
          </select>
        </label>

        <div class="card-tags">
          <label>Tags</label>
          <div class="tags-list"></div>
          <button type="button" class="add-tag-button">
            Add Tag
          </button>
        </div>

        <div class="modal-actions">
          <button type="submit">${edit ? "Update" : "Add"}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  /* ---------- TAG EDITOR ---------- */

  const tagContainer = modal.querySelector(".card-tags");

  attachTagEditor(tagContainer, card);
  
  /* ---------- AUTOGROW ---------- */

  modal.querySelectorAll("textarea.autogrow").forEach(ta => {
    autoGrowTextarea(ta);
    ta.addEventListener("input", () => autoGrowTextarea(ta));
  });

  /* ---------- EVENTS ---------- */

  modal.querySelector(".close").onclick = () => modal.remove();

  modal.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.target);

    const payload = {
      cardId: edit ? card.id : undefined,
      heroId: state.heroId,
      movieId: state.movieId,
      name: String(fd.get("name")).trim(),
      type: String(fd.get("type")).trim(),
      call_sign: String(fd.get("call_sign") || "").trim(),
      ability_text: String(fd.get("ability_text") || "").trim(),
      ability_text2: String(fd.get("ability_text2") || "").trim(),
      need_review: String(fd.get("need_review") || "F"),
    };

    const savedCard = await api.saveCard(payload, edit);

    if (!savedCard?.id) {
      throw new Error("Card ID missing after save");
    }

    if (edit) {
      const idx = state.cards.findIndex(c => c.id === savedCard.id);
      if (idx !== -1) state.cards[idx] = savedCard;
    } else {
      state.cards.push(savedCard);
    }

    if (edit) {
      updateCard(savedCard)
    } else {
      appendCard(savedCard);
    }

    modal.remove();
  };
}

