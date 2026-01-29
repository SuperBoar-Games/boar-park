import { createTagEditor } from "./common/tagEditor.js";
import { loadHeroDetails } from "./hero.js";
import { Icons } from "../../../../components/icons.js";

/* =========================================================
   state
   ========================================================= */
export const state = {
  heroId: null,
  movieId: null,
  movieTitle: null,
  movieIsLocked: false,

  cards: [],
  tags: [],
  tagsById: {},

  ui: {
    contentSection: null,
    cardsContainer: null,
  },
};

/* =========================================================
   api
   ========================================================= */
const BASE = "/api-proxy/games/?gameSlug=blast-alpha";

async function json(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export const api = {
  async getCards(heroId, movieId) {
    const res = await json(
      `${BASE}&queryKey=card&heroId=${heroId}&movieId=${movieId}`
    );
    return res.data || [];
  },

  async getTags() {
    const res = await json(`${BASE}&queryKey=tags`);
    return res.data || [];
  },

  async saveCard(payload, edit) {
    const res = await json(`${BASE}&queryKey=card`, {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteCard(cardId) {
    const res = await json(`${BASE}&queryKey=card`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
    return res.data;
  },

  async toggleReview(cardId, needReview) {
    const res = await json(`${BASE}&queryKey=card`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId,
        need_review: needReview ? "F" : "T",
      }),
    });
    return res.data;
  },

  async setTags(cardId, tagIds) {
    const res = await json(`${BASE}&queryKey=setTagsForCard`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, tagIds }),
    });
    return res.data;
  },

  async updateMovieLockedStatus(movieId, isLocked) {
    const res = await json(`${BASE}&queryKey=updateMovieLockedStatus`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: movieId, locked: isLocked }),
    });
    return res.data;
  },
};

/* =========================================================
   dom
   ========================================================= */
export function ensureLayout() {
  const root = state.ui.contentSection;
  root.replaceChildren();

  const header = document.createElement("div");
  header.className = "title-header";

  const cards = document.createElement("div");
  cards.className = "movie-cards-container";

  root.append(header, cards);

  state.ui.cardsContainer = cards;
  return header;
}

/* =========================================================
   tags
   ========================================================= */
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

    disableEditing: state.movieIsLocked,
  });
}

function reattachAllTagEditors() {
  state.cards.forEach(card => {
    const cardEl = state.ui.cardsContainer.querySelector(
      `[data-card-id="${card.id}"]`
    );
    if (!cardEl) return;

    const container = cardEl.querySelector(".card-tags");
    if (!container) return;

    // reset container but keep structure
    container.innerHTML = `
      <label>Tags</label>
      <div class="tags-list"></div>
      <button type="button" class="add-tag-button">Add Tag</button>
    `;

    attachTagEditor(container, card);
  });
}

/* =========================================================
   view
   ========================================================= */
export function renderMoviePage() {
  renderHeader();
  renderCards();
}

function renderHeader() {
  const header = state.ui.contentSection.querySelector(".title-header");

  header.innerHTML = `
    <h2>${state.movieTitle || "Movie Details"}</h2>

    <div class="header-actions">
      <div class="left-actions">
        <button id="back-to-hero">Back</button>
        <button id="add-card">Add Card</button>
      </div>

      <button
        id="toggle-lock"
        class="lock-button ${state.movieIsLocked ? "locked" : "unlocked"}"
        aria-pressed="${state.movieIsLocked}"
      >
        ${state.movieIsLocked ? Icons.lock : Icons.unlock}
        <span>${state.movieIsLocked ? "Locked" : "Unlocked"}</span>
      </button>
    </div>
  `;
}


function renderCards() {
  const wrap = state.ui.cardsContainer;
  wrap.replaceChildren();

  if (!state.cards.length) {
    wrap.innerHTML = `<p class="empty-state">No movie cards found.</p>`;
    return;
  }

  state.cards.forEach(card => wrap.append(cardEl(card)));
}

function cardEl(card) {
  const el = document.createElement("div");
  el.className = "movie-card-details";
  el.dataset.cardId = card.id;

  el.innerHTML = `
    <div class="card-header">
      <span class="card-type">${card.type}</span>
      <div class="card-actions">
        <button class="review-action" data-review="${card.need_review === "T"}">
          ${card.need_review === "T" ? Icons.flagSolid : Icons.flagRegular}
        </button>
        <button class="edit">${Icons.edit}</button>
        <button class="delete">${Icons.delete}</button>
      </div>
    </div>

    <div class="card-body">
      <h1>${card.name}</h1>

      <h4>Call Sign:</h4>
      <span class="call-sign-content">${card.call_sign || ""}</span>

      <h4>Ability:</h4>
      <div class="ability-content">
        <span>1. ${card.ability_text || ""}</span>
        ${
          card.ability_text2
            ? `<br /><span>2. ${card.ability_text2}</span>`
            : ""
        }
      </div>

      <div class="card-footer">
        <div class="card-tags">
          <label>Tags</label>
          <div class="tags-list"></div>
          <button type="button" class="add-tag-button">Add Tag</button>
        </div>
      </div>
    </div>
  `;

  attachTagEditor(el.querySelector(".card-tags"), card);
  return el;
}

export function appendCard(card) {
  state.cards.push(card);
  state.ui.cardsContainer.append(cardEl(card));
}

export function updateCard(card) {
  const idx = state.cards.findIndex(c => c.id === card.id);
  if (idx !== -1) state.cards[idx] = card;

  const el = state.ui.cardsContainer.querySelector(
    `[data-card-id="${card.id}"]`
  );
  if (!el) return;

  el.replaceWith(cardEl(card));
}

export function removeCard(cardId) {
  state.cards = state.cards.filter(c => c.id !== cardId);
  state.ui.cardsContainer
    .querySelector(`[data-card-id="${cardId}"]`)
    ?.remove();
}

/* =========================================================
   modals
   ========================================================= */
function autoGrowTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export async function openCardModal({ edit, data } = {}) {
  const card = data || {};

  if (!state.tags.length) {
    const res = await api.getTags();
    state.tags = res || [];
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
          <textarea name="ability_text" class="autogrow" required>${card.ability_text ?? ""}</textarea>
        </label>

        <label>
          Ability 2
          <textarea name="ability_text2" class="autogrow">${card.ability_text2 ?? ""}</textarea>
        </label>

        <label>
          Needs Review
          <select name="need_review">
            <option value="F" ${card.need_review !== "T" ? "selected" : ""}>No</option>
            <option value="T" ${card.need_review === "T" ? "selected" : ""}>Yes</option>
          </select>
        </label>

        <div class="card-tags">
          <label>Tags</label>
          <div class="tags-list"></div>
          <button type="button" class="add-tag-button">Add Tag</button>
        </div>

        <div class="modal-actions">
          <button type="submit">${edit ? "Update" : "Add"}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  attachTagEditor(modal.querySelector(".card-tags"), card);

  modal.querySelectorAll("textarea.autogrow").forEach(ta => {
    autoGrowTextarea(ta);
    ta.addEventListener("input", () => autoGrowTextarea(ta));
  });

  modal.querySelector(".close").onclick = () => modal.remove();

  modal.querySelector("form").onsubmit = async e => {
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
    if (!savedCard?.id) throw new Error("Card ID missing after save");

    if (edit) updateCard(savedCard);
    else appendCard(savedCard);

    modal.remove();
  };
}

/* =========================================================
   events
   ========================================================= */
export function initMovieEvents() {
  const root = state.ui.contentSection;

  root.addEventListener("click", async e => {

    if (state.movieIsLocked) {
      if (
        e.target.closest("#add-card") ||
        e.target.closest(".review-action") ||
        e.target.closest(".edit") ||
        e.target.closest(".delete") ||
        e.target.closest(".add-tag-button") ||
        e.target.closest(".remove-tag")
      ) {
        return;
      }
    }

    if (e.target.closest("#back-to-hero")) {
      history.pushState(
        { section: "hero", heroId: state.heroId },
        "",
        `/admin/games/blast-alpha/?heroId=${state.heroId}`
      );
      loadHeroDetails(state.heroId);
      return;
    }

    if (e.target.closest("#add-card")) {
      if (state.movieIsLocked) return;
      openCardModal({ edit: false });
      return;
    }

    if (e.target.closest("#toggle-lock")) {
      const btn = e.target.closest("#toggle-lock");
      const newLockedStatus = !state.movieIsLocked;

      try {
        const res = await api.updateMovieLockedStatus(state.movieId, newLockedStatus);
      
        state.movieIsLocked = newLockedStatus;
        btn.className = `lock-button ${newLockedStatus ? "locked" : "unlocked"}`;
        btn.setAttribute("aria-pressed", String(newLockedStatus));
        btn.innerHTML = `
          ${newLockedStatus ? Icons.lock : Icons.unlock}
          <span>${newLockedStatus ? "Locked" : "Unlocked"}</span>
        `;
        patchLockedUI();
        reattachAllTagEditors();
      } catch (err) {
        console.error(err);
        alert("Failed to update movie lock status");
      }
      return;
    }

    // -----------------------
    const cardEl = e.target.closest("[data-card-id]");
    if (!cardEl) return;

    const cardId = Number(cardEl.dataset.cardId);
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    if (e.target.closest(".delete")) {
      if (!confirm("Delete this card?")) return;
      const deleted = await api.deleteCard(cardId);
      removeCard(deleted?.id);
    }

    if (e.target.closest(".edit")) {
      if (state.movieIsLocked) return;
      openCardModal({ edit: true, data: card });
    }

    if (e.target.closest(".review-action")) {
      const needReview = card.need_review === "T";
      await api.toggleReview(cardId, needReview);
      card.need_review = needReview ? "F" : "T";

      const btn = e.target.closest(".review-action");
      btn.dataset.review = String(!needReview);
      btn.innerHTML = needReview ? Icons.flagRegular : Icons.flagSolid;
    }
  });
}

function patchLockedUI() {
  const addCardBtn = state.ui.contentSection.querySelector("#add-card");
  if (addCardBtn) {
    addCardBtn.disabled = state.movieIsLocked;
    addCardBtn.classList.toggle("is-hidden", state.movieIsLocked);
  }

  // card actions
  const cardActions = state.ui.contentSection.querySelectorAll(
    ".movie-card-details .card-actions button"
  );
  for (const btn of cardActions) {
    btn.disabled = state.movieIsLocked;
    btn.classList.toggle("is-hidden", state.movieIsLocked);
  }

  // add tag button
  const addTagButtons = state.ui.contentSection.querySelectorAll(
    ".movie-card-details .add-tag-button"
  );
  for (const btn of addTagButtons) {
    btn.disabled = state.movieIsLocked;
    btn.classList.toggle("is-hidden", state.movieIsLocked);
  }

  // remove tag buttons
  const removeTagButtons = state.ui.contentSection.querySelectorAll(
    ".movie-card-details .tags-list .remove-tag"
  );
  for (const btn of removeTagButtons) {
    btn.disabled = state.movieIsLocked;
    btn.classList.toggle("is-hidden", state.movieIsLocked);
  }
}

/* =========================================================
   entry point
   ========================================================= */
let eventsInit = false;

export async function loadMovieDetails(movieId, heroId, movieTitle, locked) {
  state.heroId = heroId;

  state.ui.contentSection = document.getElementById("content-section");

  ensureLayout();

  if (!eventsInit) {
    initMovieEvents();
    eventsInit = true;
  }

  const [cardsRes, tagsRes] = await Promise.all([
    api.getCards(heroId, movieId),
    api.getTags(),
  ]);

  state.movieId = movieId;
  state.movieTitle = cardsRes.movie.title || movieTitle;
  state.movieIsLocked = cardsRes.movie.is_locked;

  state.cards = cardsRes.cards || [];
  state.tags = tagsRes || [];
  state.tagsById = Object.fromEntries(
    state.tags.map(t => [String(t.id), t])
  );

  renderMoviePage();
  patchLockedUI();
}

