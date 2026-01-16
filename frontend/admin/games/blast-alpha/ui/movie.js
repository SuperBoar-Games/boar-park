import { loadHeroDetails } from "./hero/hero.js";
import { Icons } from "../../../../components/icons.js";


const CARD_TYPES = ["HERO", "VILLAIN", "SR1", "SR2", "WC"];

const contentSection = document.getElementById("content-section");

const state = {
  heroId: null,
  movieId: null,

  movies: [], // normalized cards: { ...card, tags: [] }
  tags: [],
  tagsById: {},
};

const api = {
  async getMovies(movieId, heroId) {
    const res = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=card&heroId=${heroId}&movieId=${movieId}`
    );
    if (!res.ok) throw new Error("Movie load failed");
    return (await res.json()).data;
  },

  async getTags() {
    const res = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=tags`
    );
    if (!res.ok) throw new Error("Tags load failed");
    return (await res.json()).data;
  },

  async saveCard(payload, edit) {
    const res = await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`, {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error("Card save failed");
      err.payload = json;
      throw err;
    }
    return json.data;
  },

  async deleteCard(cardId) {
    const res = await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json().catch(() => ({}));
  },

  async toggleReview(cardId, needReviewBool) {
    const res = await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId,
        need_review: needReviewBool ? "F" : "T",
      }),
    });
    if (!res.ok) throw new Error("Review toggle failed");
    return res.json().catch(() => ({}));
  },

  async setTags(cardId, tagIds) {
    const res = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=setTagsForCard`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, tagIds }),
      }
    );
    if (!res.ok) throw new Error("Tag update failed");
    return res.json().catch(() => ({}));
  },
};

function normalizeCard(card) {
  return {
    ...card,
    tags: Array.isArray(card?.tags) ? card.tags : [],
  };
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCardsContainer() {
  return contentSection.querySelector(".movie-cards-container");
}

function ensureCardsContainer() {
  let wrap = getCardsContainer();
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "movie-cards-container";
    contentSection.append(wrap);
  }
  return wrap;
}

function setEmptyStateIfNeeded() {
  const wrap = ensureCardsContainer();
  if (state.movies.length === 0) {
    wrap.replaceChildren();
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "No movie cards found.";
    wrap.append(p);
  } else {
    // remove empty state if present and container has no cards
    const empty = wrap.querySelector(".empty-state");
    if (empty) empty.remove();
  }
}

function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export async function loadMovieDetails(movieId, heroId) {
  try {
    state.movieId = movieId;
    state.heroId = heroId;

    const [movies, tags] = await Promise.all([
      api.getMovies(movieId, heroId),
      api.getTags(),
    ]);

    state.movies = (movies || []).map(normalizeCard);
    state.tags = tags || [];
    state.tagsById = Object.fromEntries(state.tags.map(t => [String(t.id), t]));

    renderPage();
  } catch (err) {
    console.error(err);
    contentSection.innerHTML = `<p>Failed to load movie details</p>`;
  }
}

function renderPage() {
  contentSection.replaceChildren();
  contentSection.append(headerEl());

  const wrap = ensureCardsContainer();
  wrap.replaceChildren();

  if (!state.movies.length) {
    setEmptyStateIfNeeded();
    contentSection.dataset.section = "movie";
    return;
  }

  state.movies.forEach(m => wrap.append(cardEl(m)));

  contentSection.dataset.section = "movie";
}

function headerEl() {
  const el = document.createElement("div");
  el.className = "title-header";
  el.innerHTML = `
    <h2>Movie Details</h2>
    <button id="back-to-movies">Back to Movies</button>
    <button id="add-card">Add Card</button>
  `;
  return el;
}

function cardEl(detail) {
  const d = normalizeCard(detail);

  const el = document.createElement("div");
  el.className = "movie-card-details";
  el.dataset.movieCardId = d.id;

  const tagsCsv = d.tags.map(t => t.id).join(",");

  el.innerHTML = `
    <div class="card-header">
      <span class="card-type">${escapeHtml(d.type)}</span>

      <div class="card-actions">
        <button
          class="review-action"
          data-need-review="${d.need_review === "T"}"
          title="${d.need_review === "T" ? "Mark as Resolved" : "Mark for Review"}"
        >
          ${d.need_review === "T" ? Icons.flagSolid : Icons.flagRegular}
        </button>

        <button class="edit" title="Edit Card">
          ${Icons.edit}
        </button>

        <button class="delete" title="Delete Card">
          ${Icons.delete}
        </button>
      </div>
    </div>

    <div class="card-body">
      <h1>${escapeHtml(d.name)}</h1>

      <h4>Call Sign:</h4>
      <span class="call-sign-content">${escapeHtml(d.call_sign || "")}</span>

      <h4>Ability:</h4>
      <div class="ability-content">
        <span>1. ${escapeHtml(d.ability_text || "No ability text available")}</span>
        ${
          d.ability_text2
            ? `<br /><span>2. ${escapeHtml(d.ability_text2)}</span>`
            : ""
        }
      </div>

      <div class="card-footer">
        <div class="card-tags" data-card-id="${d.id}" data-tags="${tagsCsv}">
          <strong>Tags:</strong>
          <div class="tags-list"></div>
          <button class="add-tag-button" type="button">Add Tag</button>
        </div>
      </div>
    </div>
  `;

  renderTags(el.querySelector(".card-tags"));
  return el;
}

function renderTags(container) {
  const list = container.querySelector(".tags-list");
  const ids = (container.dataset.tags || "").split(",").filter(Boolean);

  list.innerHTML = ids.length
    ? ids
        .map(id => {
          const tag = state.tagsById[id];
          if (!tag) return "";
          return `
            <span class="tag">
              ${escapeHtml(tag.name)}
              <button class="remove-tag" data-tag-id="${id}" type="button">${Icons.x}</button>
            </span>
          `;
        })
        .join("")
    : `<span class="tag muted">No tags</span>`;
}

function syncCardTagsInState(cardIdNum, ids) {
  const card = state.movies.find(c => Number(c.id) === Number(cardIdNum));
  if (!card) return;
  card.tags = ids
    .map(id => state.tagsById[String(id)])
    .filter(Boolean);
}

function updateTags(container, ids, { optimisticRollback = true } = {}) {
  const cardId = Number(container.dataset.cardId);

  const prev = container.dataset.tags || "";
  const prevIds = prev.split(",").filter(Boolean);

  container.dataset.tags = ids.join(",");
  renderTags(container);
  syncCardTagsInState(cardId, ids);

  api.setTags(cardId, ids.map(Number))
    .then(() => {
      // ok
    })
    .catch(err => {
      console.error(err);
      alert("Failed to update tags");

      if (optimisticRollback) {
        container.dataset.tags = prevIds.join(",");
        renderTags(container);
        syncCardTagsInState(cardId, prevIds);
      }
    });
}

function openTagInput(container) {
  if (container.querySelector(".tag-input-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "tag-input-wrapper";

  const input = document.createElement("input");
  input.className = "tag-input";
  input.placeholder = "Add tag...";

  const dropdown = document.createElement("div");
  dropdown.className = "tag-suggestions";

  wrapper.append(input, dropdown);
  container.append(wrapper);

  const ac = new AbortController();
  const { signal } = ac;

  const close = () => {
    if (!wrapper.isConnected) return;
    wrapper.remove();
    ac.abort();
  };

  const getIds = () =>
    (container.dataset.tags || "").split(",").filter(Boolean);

  let index = -1;

  const renderSuggestions = () => {
    const value = input.value.toLowerCase();
    const used = new Set(getIds());

    const matches = state.tags
      .filter(
        t =>
          t?.name?.toLowerCase().includes(value) &&
          !used.has(String(t.id))
      )
      .slice(0, 6);

    dropdown.innerHTML = matches
      .map(
        (t, i) =>
          `<div class="suggestion" data-i="${i}" data-id="${t.id}">${escapeHtml(t.name)}</div>`
      )
      .join("");

    index = -1;
  };

  const commit = tagId => {
    const idStr = String(tagId);
    const ids = getIds();
    if (ids.includes(idStr)) return;
    updateTags(container, [...ids, idStr]);
    close();
  };

  input.addEventListener("input", renderSuggestions, { signal });
  input.addEventListener("focus", renderSuggestions, { signal });

  input.addEventListener(
    "keydown",
    e => {
      const items = dropdown.children;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        index = Math.min(index + 1, items.length - 1);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        index = Math.max(index - 1, 0);
      }

      if (e.key === "Enter" && index >= 0 && items[index]) {
        e.preventDefault();
        commit(items[index].dataset.id);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }

      [...items].forEach((el, i) =>
        el.classList.toggle("active", i === index)
      );
    },
    { signal }
  );

  dropdown.addEventListener(
    "mousedown",
    e => {
      const id = e.target?.dataset?.id;
      if (!id) return;
      e.preventDefault();
      commit(id);
    },
    { signal }
  );

  // Close on outside click
  setTimeout(() => {
    document.addEventListener(
      "mousedown",
      e => {
        if (!wrapper.contains(e.target)) close();
      },
      { signal }
    );
  });

  input.focus();
}

contentSection.addEventListener("click", async e => {
  const backBtn = e.target.closest("#back-to-movies");
  const addBtn = e.target.closest("#add-card");

  if (backBtn) {
    history.pushState(
      { section: "hero", heroId: state.heroId },
      "",
      `/admin/games/blast-alpha/?heroId=${state.heroId}`
    );
    loadHeroDetails(state.heroId);
    return;
  }

  if (addBtn) {
    addOrEditCardModal(false, {});
    return;
  }

  const cardDom = e.target.closest(".movie-card-details");
  if (!cardDom) return;

  const cardId = Number(cardDom.dataset.movieCardId);

  const deleteBtn = e.target.closest(".delete");
  if (deleteBtn) {
    const card = state.movies.find(c => Number(c.id) === cardId);
    const name = card?.name || cardDom.querySelector("h1")?.textContent?.trim() || "";

    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteCard(cardId);
      state.movies = state.movies.filter(c => Number(c.id) !== cardId);
      cardDom.remove();
      setEmptyStateIfNeeded();
    } catch (err) {
      console.error(err);
      alert("Failed to delete card");
    }
    return;
  }

  const editBtn = e.target.closest(".edit");
  if (editBtn) {
    const card = state.movies.find(c => Number(c.id) === cardId);
    if (!card) {
      alert("Could not find card data");
      return;
    }

    const editData = {
      id: card.id,
      type: card.type || "",
      name: card.name || "",
      call_sign: card.call_sign || "",
      ability_text: String(card.ability_text || "").replace(/^\d+\.\s*/, "").trim(),
      ability_text2: String(card.ability_text2 || "").replace(/^\d+\.\s*/, "").trim(),
    };

    addOrEditCardModal(true, editData);
    return;
  }

  const reviewBtn = e.target.closest(".review-action");
  if (reviewBtn) {
    const needReview = reviewBtn.dataset.needReview === "true";

    try {
      await api.toggleReview(cardId, needReview);

      reviewBtn.dataset.needReview = String(!needReview);
      reviewBtn.innerHTML = !needReview ? Icons.flagSolid : Icons.flagRegular;
      reviewBtn.title = !needReview ? "Mark as Resolved" : "Mark for Review";

      const card = state.movies.find(c => Number(c.id) === cardId);
      if (card) card.need_review = card.need_review === "T" ? "F" : "T";
    } catch (err) {
      console.error(err);
      alert("Failed to update review status");
    }
    return;
  }

  const addTagBtn = e.target.closest(".add-tag-button");
  if (addTagBtn) {
    const container = addTagBtn.closest(".card-tags");
    if (container) openTagInput(container);
    return;
  }

  const removeTagBtn = e.target.closest(".remove-tag");
  if (removeTagBtn) {
    const container = removeTagBtn.closest(".card-tags");
    const tagId = String(removeTagBtn.dataset.tagId);

    if (!container || !tagId) return;

    const ids = (container.dataset.tags || "")
      .split(",")
      .filter(Boolean)
      .filter(id => id !== tagId);

    updateTags(container, ids);
    return;
  }
});

function buildTypeOptionsHtml(selectedType) {
  return `
    <option value="">Select type</option>
    ${CARD_TYPES.map(
      t =>
        `<option value="${t}" ${selectedType === t ? "selected" : ""}>${t}</option>`
    ).join("")}
  `;
}

function addOrEditCardModal(editFlag, editData = {}) {
  editData = editData || {};

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("tabindex", "-1");

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Card</h2>

      <form id="card-form">
        <label>
          Type
          <select name="type" required>
            ${buildTypeOptionsHtml(editData.type)}
          </select>
        </label>

        <label>
          Name
          <input name="name" required value="${escapeHtml(editData.name ?? "")}">
        </label>

        <label>
          Call Sign
          <input name="call_sign" value="${escapeHtml(editData.call_sign ?? "")}">
        </label>

        <label>
          Ability
          <textarea name="ability_text" class="autogrow" required>${escapeHtml(editData.ability_text ?? "")}</textarea>
        </label>

        <label>
          Ability 2
          <textarea name="ability_text2" class="autogrow">${escapeHtml(editData.ability_text2 ?? "")}</textarea>
        </label>

        <span class="error-text"></span>

        <button type="submit">${editFlag ? "Update" : "Add"} Card</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#card-form");
  const errorEl = modal.querySelector(".error-text");
  const closeBtn = modal.querySelector(".close");

  const ac = new AbortController();
  const { signal } = ac;

  const close = () => {
    if (!modal.isConnected) return;
    modal.remove();
    ac.abort();
  };

  // Auto-grow textareas
  modal.querySelectorAll("textarea.autogrow").forEach(ta => {
    autoGrow(ta);
    ta.addEventListener("input", () => autoGrow(ta), { signal });
  });

  // Close on X
  closeBtn.addEventListener("click", close, { signal });

  // Close on outside click
  modal.addEventListener(
    "click",
    e => {
      if (e.target === modal) close();
    },
    { signal }
  );

  // Close on ESC (and cleanly remove listener when modal closes)
  window.addEventListener(
    "keydown",
    e => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    },
    { capture: true, signal }
  );

  // Focus modal
  modal.focus();

  form.addEventListener(
    "submit",
    async e => {
      e.preventDefault();
      errorEl.textContent = "";

      const fd = new FormData(form);
      const type = fd.get("type");
      const name = fd.get("name");

      if (!type) {
        errorEl.textContent = "Type is required.";
        return;
      }
      if (!name) {
        errorEl.textContent = "Name is required.";
        return;
      }

      const payload = {
        cardId: editFlag ? editData.id : undefined,
        heroId: state.heroId,
        movieId: state.movieId,
        type,
        name,
        call_sign: fd.get("call_sign") || "",
        ability_text: fd.get("ability_text") || "",
        ability_text2: fd.get("ability_text2") || "",
      };

      try {
        const saved = normalizeCard(await api.saveCard(payload, editFlag));

        // Preserve existing tags if backend doesn't return them on save
        if (editFlag) {
          const existing = state.movies.find(c => Number(c.id) === Number(saved.id));
          if (existing && (!saved.tags || saved.tags.length === 0)) {
            saved.tags = existing.tags || [];
          }
        } else {
          saved.tags = []; // new cards start empty (until tag updates)
        }

        const wrap = ensureCardsContainer();

        if (editFlag) {
          const idx = state.movies.findIndex(c => Number(c.id) === Number(saved.id));
          if (idx >= 0) state.movies[idx] = saved;

          const oldDom = contentSection.querySelector(
            `[data-movie-card-id="${saved.id}"]`
          );
          if (oldDom) oldDom.replaceWith(cardEl(saved));
        } else {
          state.movies.push(saved);

          // If empty-state is showing, clear it before appending first card
          setEmptyStateIfNeeded();
          wrap.append(cardEl(saved));
        }

        setEmptyStateIfNeeded();
        close();
      } catch (err) {
        console.error(err);
        errorEl.textContent = "Failed to save card.";
      }
    },
    { signal }
  );

  return modal;
}

