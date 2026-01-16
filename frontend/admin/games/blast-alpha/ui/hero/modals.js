import { state } from "./state.js";
import { api } from "./api.js";
import { preserveScroll } from "./dom.js";
import { createTagEditor } from "../common/tagEditor.js";

function autoGrowTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export function openMovieModal({ edit, data, onDone }) {
  const d = data || {};

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" role="button">&times;</span>
      <h2>${edit ? "Edit" : "Add"} Movie</h2>
      <form>
        <input name="title" required value="${edit ? (d.title || "") : ""}">
        <button type="submit">${edit ? "Update" : "Add"}</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").onclick = () => modal.remove();

  modal.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    preserveScroll();

    const title = e.target.title.value;

    const saved = await api.saveMovie(
      { id: d.id, title, heroId: state.heroId },
      edit
    );

    modal.remove();
    onDone?.(saved?.data ?? saved);
  };
}

export async function openCardModal({ edit, data, onDone }) {
  const d = data || {};

  const [tagsRes] = await Promise.all([
    api.getTags(),
  ]);

  const allTags = tagsRes.data || [];
  const tagsById = Object.fromEntries(allTags.map(t => [String(t.id), t]));
  const initialTagIds =
    (d.tags || []).map(t => String(t.id));

  let selectedTagIds = [...initialTagIds];

  // Ensure movies list exists for selector (same behavior as original)
  let moviesForSelect = state.movies;
  if (!Array.isArray(moviesForSelect) || moviesForSelect.length === 0) {
    const res = await api.getMoviesForHero(state.heroId);
    moviesForSelect = res.data || [];
    // do not overwrite hero dataset if currently in cards view; just for select
  }

  if (!moviesForSelect.length) {
    alert("Please add a movie before adding cards.");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" role="button">&times;</span>
      <h2>${edit ? "Edit" : "Add"} Card</h2>
      <form class="card-form">
        <label>
          Movie
          <select name="movie_id" required>
            <option value="">Select movie</option>
            ${moviesForSelect
              .map(
                (m) => `
                  <option value="${m.id}" ${
                    Number(d.movie_id) === Number(m.id) ? "selected" : ""
                  }>${m.title}</option>
                `
              )
              .join("")}
          </select>
        </label>

        <label>
          Name
          <input name="name" required value="${d.name ?? ""}">
        </label>

        <label>
          Type
          <select name="type" required>
            <option value="">Select type</option>
            <option value="HERO" ${d.type === "HERO" ? "selected" : ""}>HERO</option>
            <option value="VILLAIN" ${d.type === "VILLAIN" ? "selected" : ""}>VILLAIN</option>
            <option value="SR1" ${d.type === "SR1" ? "selected" : ""}>SR1</option>
            <option value="SR2" ${d.type === "SR2" ? "selected" : ""}>SR2</option>
            <option value="WC" ${d.type === "WC" ? "selected" : ""}>WC</option>
          </select>
        </label>

        <label>
          Call Sign
          <input name="call_sign" value="${d.call_sign ?? ""}">
        </label>

        <label>
          Ability
          <textarea name="ability_text" class="autogrow" required>${d.ability_text ?? ""}</textarea>
        </label>

        <label>
          Ability 2
          <textarea name="ability_text2" class="autogrow">${d.ability_text2 ?? ""}</textarea>
        </label>

        <label>
          Needs Review
          <select name="need_review">
            <option value="F" ${(d.need_review ?? "F") === "F" ? "selected" : ""}>No</option>
            <option value="T" ${(d.need_review ?? "F") === "T" ? "selected" : ""}>Yes</option>
          </select>
        </label>

        <div class="card-tags">
          <label>Tags</label>
          <div class="tags-list"></div>
          <button type="button" class="add-tag-button">
            Add Tag
          </button>
        </div>

        <button type="submit">${edit ? "Update" : "Add"}</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  
  const tagsContainer = modal.querySelector(".card-tags");

  createTagEditor({
    container: tagsContainer,
    allTags,
    tagsById,
    initialTagIds,
    onChange: (ids, rollback, prev) => {
      selectedTagIds = ids;

      api.setTagsForCard?.(d.id, ids.map(Number)).catch(() => {
        if (rollback) {
          tagsContainer.dataset.tags = prev;
        }
      });
    },
  });

  modal.querySelector(".close").onclick = () => modal.remove();

  modal.querySelectorAll("textarea.autogrow").forEach((ta) => {
    autoGrowTextarea(ta);
    ta.addEventListener("input", () => autoGrowTextarea(ta));
  });

  modal.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    preserveScroll();

    const fd = new FormData(e.target);

    const payload = {
      cardId: edit ? d.id : undefined,
      movieId: Number(fd.get("movie_id")),
      heroId: state.heroId,
      name: String(fd.get("name") || "").trim(),
      type: String(fd.get("type") || "").trim().toUpperCase(),
      call_sign: String(fd.get("call_sign") || "").trim(),
      ability_text: String(fd.get("ability_text") || "").trim(),
      ability_text2: String(fd.get("ability_text2") || "").trim(),
      need_review: String(fd.get("need_review") || "F"),
    };

    const res = await api.saveCard(payload, edit);

    const cardData = res?.data ?? res;

    if (!cardData) {
      alert("Error saving card.");
      return;
    }

    if (selectedTagIds.length) {
      await api.setTagsForCard(cardData.id, selectedTagIds.map(Number));
    }

    modal.remove();
    onDone?.(cardData);
  };

  modal.querySelector(".close").onclick = () => modal.remove();
}

