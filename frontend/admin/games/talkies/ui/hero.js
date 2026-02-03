import { Icons } from "../../../../components/icons.js";
import { renderGameSection } from "./game.js";
import { loadMovieDetails } from "./movie.js";
import { renderTagsSection, resetTagsSection } from "./tags.js";
import { createTagEditor } from "./common/tagEditor.js";
import {
  getMoviesByHeroId,
  getAllCardsByHero,
  getTags,
  updateCard,
  createMovie,
  updateMovieTitle,
  updateMovieReview,
  deleteMovie,
  createCard,
  deleteCard
} from "../api.js";


/* =========================================================
   state
   ========================================================= */
export const state = {
  heroId: null,
  heroName: null,

  viewMode: localStorage.getItem("blastAlpha.hero.viewMode") || "movies",

  movies: [],
  cards: [],
  tags: [],

  sort: { key: null, dir: "asc" },

  filters: {
    movies: {
      title: "",
      totalMin: "",
      reviewMin: "",
      status: "all",
      needReview: "all",
    },
    cards: {
      movieTitle: "",
      name: "",
      type: "",
      callSign: "",
      ability1: "",
      ability2: "",
      tag: "",
      needReview: "all",
    },
  },

  ui: {
    contentSection: null,
    tableContainer: null,
    tagsContainer: null,
    tableWrapper: null,
    tableEl: null,
    tbodyEl: null,
  },

  scroll: {
    wrapperLeft: 0,
    wrapperTop: 0,
    pageTop: 0,
  },
};

/* =========================================================
   api
   ========================================================= */
export const api = {
  async getHeroDataset(viewMode, heroId) {
    if (viewMode === "movies") {
      return getMoviesByHeroId(heroId);
    } else {
      return getAllCardsByHero(heroId);
    }
  },

  async getMoviesForHero(heroId) {
    return getMoviesByHeroId(heroId);
  },

  async getTags() {
    return getTags();
  },

  async setTagsForCard(cardId, tagIds) {
    return updateCard(cardId, { tagIds });
  },

  async saveMovie({ id, title, heroId }, edit) {
    if (edit) {
      return updateMovieTitle(id, { title });
    } else {
      return createMovie({ title, heroId });
    }
  },

  async deleteMovie(id) {
    return deleteMovie(id);
  },

  async toggleMovieReview({ id, need_review }) {
    return updateMovieReview(id, need_review);
  },

  async saveCard(payload, edit) {
    if (edit) {
      return updateCard(payload.cardId || payload.id, payload);
    } else {
      return createCard(payload);
    }
  },

  async deleteCard(cardId) {
    return deleteCard(cardId);
  },

  async toggleCardReview({ cardId, need_review }) {
    return updateCard(cardId, { need_review });
  },
};

/* =========================================================
   dom
   ========================================================= */
function getPageScrollTop() {
  return window.pageYOffset || document.documentElement.scrollTop || 0;
}

export function preserveScroll() {
  const wrap = state.ui.tableWrapper;
  if (wrap) {
    state.scroll.wrapperLeft = wrap.scrollLeft;
    state.scroll.wrapperTop = wrap.scrollTop;
  }
  state.scroll.pageTop = getPageScrollTop();
}

export function restoreScroll() {
  const wrap = state.ui.tableWrapper;
  if (wrap) {
    wrap.scrollLeft = state.scroll.wrapperLeft;
    wrap.scrollTop = state.scroll.wrapperTop;
  }
  window.scrollTo(0, state.scroll.pageTop);
}

/* =========================================================
   filters
   ========================================================= */
export function applySort(data, sort) {
  if (!sort.key) return data;
  const dir = sort.dir === "asc" ? 1 : -1;

  return [...data].sort((a, b) => {
    const A = a[sort.key] ?? "";
    const B = b[sort.key] ?? "";
    if (A < B) return -1 * dir;
    if (A > B) return 1 * dir;
    return 0;
  });
}

export function filterMovies(data, f) {
  return data.filter((m) => {
    if (f.title && !String(m.title || "").toLowerCase().includes(f.title.toLowerCase())) return false;
    if (f.totalMin !== "" && (m.total_cards || 0) < Number(f.totalMin)) return false;
    if (f.reviewMin !== "" && (m.total_cards_need_review || 0) < Number(f.reviewMin)) return false;

    if (f.status !== "all") {
      const done = m.done === true;
      if (f.status === "done" && !done) return false;
      if (f.status === "pending" && done) return false;
    }

    if (f.needReview !== "all") {
      const needs = m.need_review === true;
      if (f.needReview === "yes" && !needs) return false;
      if (f.needReview === "no" && needs) return false;
    }

    return true;
  });
}

export function filterCards(data, f) {
  return data.filter((c) => {
    if (f.movieTitle && !String(c.movie_title || "").toLowerCase().includes(f.movieTitle.toLowerCase())) return false;
    if (f.name && !String(c.name || "").toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.type && c.type !== f.type) return false;
    if (f.callSign && !String(c.call_sign || "").toLowerCase().includes(f.callSign.toLowerCase())) return false;
    if (f.ability1 && !String(c.ability_text || "").toLowerCase().includes(f.ability1.toLowerCase())) return false;
    if (f.ability2 && !String(c.ability_text2 || "").toLowerCase().includes(f.ability2.toLowerCase())) return false;

    let tagList = [];

    if (Array.isArray(c.tags)) {
      tagList = c.tags.map(t => String(t.name || "").toLowerCase());
    } else if (typeof c.tags === "string") {
      tagList = c.tags
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
    }

    if (f.tag) {
      if (!tagList.includes(f.tag.toLowerCase())) return false;
    }

    if (f.needReview !== "all") {
      const needs = c.need_review === true;
      if (f.needReview === "yes" && !needs) return false;
      if (f.needReview === "no" && needs) return false;
    }

    return true;
  });
}

/* =========================================================
   table
   ========================================================= */
function th(label, key) {
  let icon = Icons.sort;
  if (state.sort.key === key) {
    icon = state.sort.dir === "asc" ? Icons.sortUp : Icons.sortDown;
  }

  return `
    <th data-sort="${key}" class="sortable">
      <span class="th-label">${label}</span>
      <span class="sort-icon">${icon}</span>
    </th>
  `;
}

function actions(row) {
  if (row.locked || row.movie_locked) {
    return `
      <div class="card-actions locked">
        <span title="Locked">${Icons.lock}</span>
      </div>
    `;
  }

  return `
    <div class="card-actions">
      <button class="review-action" data-need-review="${row.need_review === true}">
        ${row.need_review === true ? Icons.flagSolid : Icons.flagRegular}
      </button>
      <button class="edit">${Icons.edit}</button>
      <button class="delete">${Icons.delete}</button>
    </div>
  `;
}

function moviesTableShell() {
  const f = state.filters.movies;

  return `
    <table class="movie-table">
      <thead>
        <tr>
          ${th("Title", "title")}
          ${th("# Cards", "total_cards")}
          ${th("# Review Cards", "total_cards_need_review")}
          ${th("Status", "done")}
          ${th("Review", "need_review")}
          <th>Actions</th>
        </tr>
        <tr class="filters">
          <th><input data-filter="movies.title" placeholder="Filter..." value="${f.title}"></th>
          <th><input type="number" data-filter="movies.totalMin" placeholder="Filter..." value="${f.totalMin}"></th>
          <th><input type="number" data-filter="movies.reviewMin" placeholder="Filter..." value="${f.reviewMin}"></th>
          <th>
            <select data-filter="movies.status">
              <option value="all">All</option>
              <option value="done">Done</option>
              <option value="pending">Pending</option>
            </select>
          </th>
          <th>
            <select data-filter="movies.needReview">
              <option value="all">All</option>
              <option value="yes">Needs Review</option>
              <option value="no">Clean</option>
            </select>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
}

function cardsTableShell() {
  const f = state.filters.cards;

  return `
    <table class="movie-table">
      <thead>
        <tr>
          ${th("Movie", "movie_title")}
          ${th("Name", "name")}
          ${th("Type", "type")}
          ${th("Call Sign", "call_sign")}
          ${th("Ability", "ability_text")}
${th("Ability 2", "ability_text2")}
          ${th("Tags", "tags")}
          ${th("Review", "need_review")}
          <th>Actions</th>
        </tr>
        <tr class="filters">
          <th><input data-filter="cards.movieTitle" value="${f.movieTitle}"></th>
          <th><input data-filter="cards.name" value="${f.name}"></th>
          <th><input data-filter="cards.type" value="${f.type}"></th>
          <th><input data-filter="cards.callSign" value="${f.callSign}"></th>
          <th><input data-filter="cards.ability1" value="${f.ability1}"></th>
          <th><input data-filter="cards.ability2" value="${f.ability2}"></th>
          <th>
            <select data-filter="cards.tag">
              <option value="">All</option>
              ${state.tags.map(tag => `<option value="${tag}">${tag}</option>`)}
            </select>
          </th>
          <th>
            <select data-filter="cards.needReview">
              <option value="all">All</option>
              <option value="yes">Needs Review</option>
              <option value="no">Clean</option>
            </select>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
}

export function renderTableShell() {
  state.ui.tableContainer.innerHTML = `
    <div class="title-header">
      <h2>${state.heroName || "Movies"}</h2>
      <div class="hero-top-actions">
        <button id="back-to-game" class="btn-secondary hide-on-mobile">${Icons.arrowLeft} <span>Back</span></button>
        <button id="toggle-view" class="btn-secondary hide-on-mobile">${Icons.toggle} <span>${state.viewMode === "movies" ? "View Cards" : "View Movies"}</span></button>
        <button id="add-item" class="btn-primary">${Icons.plus} <span>${state.viewMode === "movies" ? "Add Movie" : "Add Card"}</span></button>
        <button id="clear-filters" class="btn-secondary">${Icons.filter} <span>Clear Filters</span></button>
      </div>
    </div>
    <div class="table-wrapper">
      ${state.viewMode === "movies" ? moviesTableShell() : cardsTableShell()}
    </div>
    <div class="hero-bottom-nav">
      <button id="back-to-game" class="btn-secondary">${Icons.arrowLeft} <span>Back</span></button>
      <button id="toggle-view" class="btn-secondary">${Icons.toggle} <span>${state.viewMode === "movies" ? "View Cards" : "View Movies"}</span></button>
    </div>
  `;

  state.ui.tableWrapper = state.ui.tableContainer.querySelector(".table-wrapper");
  state.ui.tableEl = state.ui.tableContainer.querySelector("table");
  state.ui.tbodyEl = state.ui.tableContainer.querySelector("tbody");
}

export function renderTbodyRows(rows) {
  state.ui.tbodyEl.innerHTML =
    state.viewMode === "movies"
      ? rows.map(m => {
        const statusClass = m.done === true ? "row-done" : "row-pending";

        return `
            <tr data-movie-id="${m.id}" class="${statusClass}">
              <td class="movie-clickable">${m.title}</td>
              <td>${m.total_cards || 0}</td>
              <td>${m.total_cards_need_review || 0}</td>
              <td>${m.done === true ? "Done" : "Pending"}</td>
              <td class="need-review-cell">
                ${m.need_review === true ? Icons.flagSolid : ""}
              </td>
              <td>${actions(m)}</td>
            </tr>
          `;
      }).join("")
      : rows.map(c => `
          <tr data-card-id="${c.id}">
            <td>${c.movie_title || ""}</td>
            <td>${c.name || ""}</td>
            <td>${c.type || ""}</td>
            <td>${c.call_sign || ""}</td>
            <td>${c.ability_text || ""}</td>
            <td>${c.ability_text2 || ""}</td>
            <td>${Array.isArray(c.tags) ? c.tags.map(t => t.name).join(", ") : ""}</td>
            <td class="need-review">${c.need_review === true ? Icons.flagSolid : ""}</td>
            <td>${actions(c)}</td>
          </tr>
        `).join("");
}

export function syncHeaderControls() {
  const root = state.ui.tableContainer;
  root.querySelectorAll("[data-filter]").forEach(el => {
    const [scope, key] = el.dataset.filter.split(".");
    el.value = state.filters[scope][key];
  });
}

/* =========================================================
   modals
   ========================================================= */
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
      <span class="close">&times;</span>
      <h2>${edit ? "Edit" : "Add"} Movie</h2>
      <form>
        <input name="title" required value="${d.title ?? ""}">
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
    const saved = await api.saveMovie({ id: d.id, title, heroId: state.heroId }, edit);
    modal.remove();
    onDone?.(saved?.data ?? saved);
  };
}

export async function openCardModal({ edit, data, onDone }) {
  const d = data || {};
  const tagsRes = await api.getTags();
  const allTags = tagsRes.data || [];
  const tagsById = Object.fromEntries(allTags.map(t => [String(t.id), t]));
  const initialTagIds = (d.tags || []).map(t => String(t.id));
  let selectedTagIds = [...initialTagIds];

  let movies = state.movies;
  if (!movies.length) {
    const res = await api.getMoviesForHero(state.heroId);
    movies = res.data || [];
  }

  if (!movies.length) {
    alert("Please add a movie first.");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${edit ? "Edit" : "Add"} Card</h2>
      <form class="card-form">
        <select name="movie_id" required>
          ${movies.map(m =>
    `<option value="${m.id}" ${Number(d.movie_id) === Number(m.id) ? "selected" : ""}>${m.title}</option>`
  ).join("")}
        </select>
        <input name="name" required value="${d.name ?? ""}">
        <select name="type">
          ${["HERO", "VILLAIN", "SR1", "SR2", "WC"].map(t =>
    `<option value="${t}" ${d.type === t ? "selected" : ""}>${t}</option>`
  ).join("")}
        </select>
        <input name="call_sign" value="${d.call_sign ?? ""}">
        <textarea name="ability_text" class="autogrow">${d.ability_text ?? ""}</textarea>
        <textarea name="ability_text2" class="autogrow">${d.ability_text2 ?? ""}</textarea>
        <select name="need_review">
          <option value="F">No</option>
          <option value="T">Yes</option>
        </select>
        <div class="card-tags">
          <div class="tags-list"></div>
          <button type="button" class="add-tag-button">Add Tag</button>
        </div>
        <button type="submit">${edit ? "Update" : "Add"}</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector(".close").onclick = () => modal.remove();

  createTagEditor({
    container: modal.querySelector(".card-tags"),
    allTags,
    tagsById,
    initialTagIds,
    onChange: ids => (selectedTagIds = ids),
  });

  modal.querySelectorAll(".autogrow").forEach(ta => {
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
      name: fd.get("name"),
      type: fd.get("type"),
      call_sign: fd.get("call_sign"),
      ability_text: fd.get("ability_text"),
      ability_text2: fd.get("ability_text2"),
      need_review: fd.get("need_review"),
    };

    const res = await api.saveCard(payload, edit);
    const card = res?.data ?? res;

    if (selectedTagIds.length) {
      await api.setTagsForCard(card.id, selectedTagIds.map(Number));
    }

    modal.remove();
    onDone?.(card);
  };
}

/* =========================================================
   events
   ========================================================= */
export function initDelegatedHandlers() {
  const root = state.ui.contentSection;

  root.addEventListener("click", async (e) => {
    const movieRow = e.target.closest("[data-movie-id]");
    const cardRow = e.target.closest("[data-card-id]");

    if (e.target.closest("#back-to-game")) {
      history.pushState({}, "", "/admin/games/talkies");
      renderGameSection();
      return;
    }

    if (e.target.closest("#toggle-view")) {
      state.viewMode = state.viewMode === "movies" ? "cards" : "movies";
      localStorage.setItem("blastAlpha.hero.viewMode", state.viewMode);
      state.sort = { key: null, dir: "asc" };
      await fullRender({ reloadData: true, reloadTags: true });
      return;
    }

    if (e.target.closest("#add-item")) {
      if (state.viewMode === "movies") {
        openMovieModal({
          edit: false,
          onDone: m => {
            state.movies.push(m);
            computeAndRenderBody({ syncHeader: true });
          },
        });
      } else {
        openCardModal({
          edit: false,
          onDone: c => {
            state.cards.push(c);
            computeAndRenderBody();
          },
        });
      }
      return;
    }

    if (e.target.closest("#clear-filters")) {
      Object.values(state.filters.movies).forEach((_, k) => state.filters.movies[k] = "");
      Object.values(state.filters.cards).forEach((_, k) => state.filters.cards[k] = "");
      state.sort = { key: null, dir: "asc" };
      computeAndRenderBody({ syncHeader: true });
      return;
    }

    const sortTh = e.target.closest("th[data-sort]");
    if (sortTh) {
      const key = sortTh.dataset.sort;
      state.sort.dir = state.sort.key === key && state.sort.dir === "asc" ? "desc" : "asc";
      state.sort.key = key;
      computeAndRenderBody({ syncHeader: true });
      return;
    }

    if (movieRow && state.viewMode === "movies") {
      const id = movieRow.dataset.movieId;

      const m = state.movies.find(x => String(x.id) === String(id));
      if (!m) return;

      if (e.target.closest(".movie-clickable")) {
        history.pushState({}, "", `?heroId=${state.heroId}&movieId=${id}`);
        const movieTitle = m.title || "Movie";
        const movieLocked = Number(m.locked) === 1;
        loadMovieDetails(id, state.heroId, movieTitle, movieLocked);
        return;
      }

      if (e.target.closest(".edit")) {
        openMovieModal({
          edit: true,
          data: m,
          onDone: m => {
            const i = state.movies.findIndex(x => x.id === m.id);
            state.movies[i] = m;
            computeAndRenderBody();
          },
        });
      }

      if (e.target.closest(".delete")) {
        if (!confirm("Delete movie?")) return;
        await api.deleteMovie(id);
        state.movies = state.movies.filter(m => String(m.id) !== String(id));
        computeAndRenderBody();
      }

      if (e.target.closest(".review-action")) {
        const needs = m.need_review === true;
        await api.toggleMovieReview({ id, heroId: state.heroId, need_review: needs ? "F" : "T" });
        m.need_review = !needs;
        computeAndRenderBody();
      }
    }

    if (cardRow && state.viewMode === "cards") {
      const id = cardRow.dataset.cardId;
      const c = state.cards.find(x => String(x.id) === String(id));

      if (e.target.closest(".edit")) {
        openCardModal({
          edit: true,
          data: c,
          onDone: updated => {
            const i = state.cards.findIndex(x => x.id === updated.id);
            state.cards[i] = updated;
            computeAndRenderBody();
          },
        });
      }

      if (e.target.closest(".delete")) {
        if (!confirm("Delete card?")) return;
        await api.deleteCard(id);
        state.cards = state.cards.filter(c => String(c.id) !== String(id));
        computeAndRenderBody();
      }

      if (e.target.closest(".review-action")) {
        const needs = c.need_review === true;
        await api.toggleCardReview({ cardId: id, need_review: needs ? "F" : "T" });
        c.need_review = !needs;
        computeAndRenderBody();
      }
    }
  });

  const onFilter = (e) => {
    const key = e.target.dataset.filter;
    if (!key) return;
    const [scope, field] = key.split(".");
    state.filters[scope][field] = e.target.value;
    computeAndRenderBody();
  };

  root.addEventListener("input", onFilter);
  root.addEventListener("change", onFilter);
}

/* =========================================================
   hero
   ========================================================= */
const contentSection = document.getElementById("content-section");
let handlersInit = false;

function ensureLayout() {
  contentSection.replaceChildren();

  const table = document.createElement("div");
  table.className = "hero-table-container";

  const tags = document.createElement("div");
  tags.className = "tags-section";

  contentSection.append(table, document.createElement("hr"), tags);

  state.ui.contentSection = contentSection;
  state.ui.tableContainer = table;
  state.ui.tagsContainer = tags;
}

export function computeAndRenderBody({ syncHeader = false } = {}) {
  const base =
    state.viewMode === "movies"
      ? filterMovies(state.movies, state.filters.movies)
      : filterCards(state.cards, state.filters.cards);

  renderTbodyRows(applySort(base, state.sort));
  if (syncHeader) syncHeaderControls();
}

export async function fullRender({ reloadData = true, reloadTags = true } = {}) {
  preserveScroll();
  ensureLayout();

  if (!handlersInit) {
    initDelegatedHandlers();
    handlersInit = true;
  }

  if (reloadData) {
    const res = await api.getHeroDataset(state.viewMode, state.heroId);
    if (state.viewMode === "movies") state.movies = res.data || [];
    else state.cards = res.data || [];
  }

  if (reloadTags) {
    const tagsRes = await api.getTags();
    state.tags = (tagsRes.data || []).map(t => t.name);
  }

  renderTableShell();
  computeAndRenderBody({ syncHeader: true });

  resetTagsSection();
  await renderTagsSection(state.ui.tagsContainer, state.heroId);

  restoreScroll();
}

export async function loadHeroDetails(heroId, heroName) {
  state.heroId = heroId;
  state.heroName = heroName;
  await fullRender({ reloadData: true, reloadTags: true });
}



