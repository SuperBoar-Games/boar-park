import { Icons } from "../../../../../components/icons.js";
import { state } from "./state.js";

function headerHtml() {
  return `
    <div class="title-header">
      <h2>${state.heroName || "Movies"}</h2>
      <div class="header-actions">
        <button id="back-to-game" type="button">Back</button>
        <button id="toggle-view" type="button">
          ${state.viewMode === "movies" ? "View Cards" : "View Movies"}
        </button>
        <button id="add-item" type="button">
          ${state.viewMode === "movies" ? "Add Movie" : "Add Card"}
        </button>
        <button id="clear-filters" type="button">Clear Filters</button>
      </div>
    </div>
  `;
}

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
  return `
    <div class="card-actions">
      <button
        class="review-action"
        data-need-review="${row.need_review === "T"}"
        title="${row.need_review === "T" ? "Mark as Resolved" : "Mark for Review"}"
      >
        ${row.need_review === "T" ? Icons.flagSolid : Icons.flagRegular}
      </button>
      <button class="edit" type="button" title="Edit">${Icons.edit}</button>
      <button class="delete" type="button" title="Delete">${Icons.delete}</button>
    </div>
  `;
}

export function renderTableShell() {
  if (!state.ui.tableContainer) return;

  state.ui.tableContainer.innerHTML = `
    ${headerHtml()}
    <div class="table-wrapper">
      ${
        state.viewMode === "movies"
          ? moviesTableShell()
          : cardsTableShell()
      }
    </div>
  `;

  state.ui.tableWrapper = state.ui.tableContainer.querySelector(".table-wrapper");
  state.ui.tableEl = state.ui.tableContainer.querySelector("table");
  state.ui.tbodyEl = state.ui.tableContainer.querySelector("tbody");
}

function moviesTableShell() {
  const f = state.filters.movies;

  return `
    <table class="movie-table">
      <thead>
        <tr>
          ${th("Title", "title")}
          ${th("Total Cards", "total_cards")}
          ${th("Needs Review", "total_cards_need_review")}
          ${th("Status", "done")}
          ${th("Review", "need_review")}
          <th>Actions</th>
        </tr>
        <tr class="filters">
          <th>
            <input data-filter="movies.title" placeholder="Filter title" value="${f.title}">
          </th>
          <th>
            <input type="number" min="0" data-filter="movies.totalMin" value="${f.totalMin}">
          </th>
          <th>
            <input type="number" min="0" data-filter="movies.reviewMin" value="${f.reviewMin}">
          </th>
          <th>
            <select data-filter="movies.status">
              <option value="all" ${f.status === "all" ? "selected" : ""}>All</option>
              <option value="done" ${f.status === "done" ? "selected" : ""}>Done</option>
              <option value="pending" ${f.status === "pending" ? "selected" : ""}>Pending</option>
            </select>
          </th>
          <th>
            <select data-filter="movies.needReview">
              <option value="all" ${f.needReview === "all" ? "selected" : ""}>All</option>
              <option value="yes" ${f.needReview === "yes" ? "selected" : ""}>Needs Review</option>
              <option value="no" ${f.needReview === "no" ? "selected" : ""}>Clean</option>
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
      <colgroup>
        <col style="min-width: 160px">
        <col style="min-width: 140px">
        <col style="min-width: 100px">
        <col style="min-width: 140px">
        <col style="min-width: 180px">
        <col style="min-width: 180px">
        <col style="min-width: 120px">
        <col style="min-width: 90px">
        <col style="min-width: 120px">
      </colgroup>
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
          <th><input data-filter="cards.movieTitle" placeholder="Filter movie" value="${f.movieTitle}"></th>
          <th><input data-filter="cards.name" placeholder="Filter name" value="${f.name}"></th>
          <th>
            <select data-filter="cards.type">
              <option value="" ${f.type === "" ? "selected" : ""}>All</option>
              <option value="HERO" ${f.type === "HERO" ? "selected" : ""}>Hero</option>
              <option value="VILLAIN" ${f.type === "VILLAIN" ? "selected" : ""}>Villain</option>
              <option value="SR1" ${f.type === "SR1" ? "selected" : ""}>SR1</option>
              <option value="SR2" ${f.type === "SR2" ? "selected" : ""}>SR2</option>
              <option value="WC" ${f.type === "WC" ? "selected" : ""}>WC</option>
            </select>
          </th>
          <th><input data-filter="cards.callSign" placeholder="Filter call sign" value="${f.callSign}"></th>
          <th><input data-filter="cards.ability1" placeholder="Filter ability" value="${f.ability1}"></th>
          <th><input data-filter="cards.ability2" placeholder="Filter ability 2" value="${f.ability2}"></th>
          <th>
            <select data-filter="cards.tag">
              <option value="" ${f.tag === "" ? "selected" : ""}>All</option>
              ${
                state.tags
                  .map(
                    (tag) => `
                      <option value="${tag}" ${f.tag === tag ? "selected" : ""}>${tag}</option>
                    `
                  )
                  .join("")
              }
            </select>
          </th>
          <th>
            <select data-filter="cards.needReview">
              <option value="all" ${f.needReview === "all" ? "selected" : ""}>All</option>
              <option value="yes" ${f.needReview === "yes" ? "selected" : ""}>Needs Review</option>
              <option value="no" ${f.needReview === "no" ? "selected" : ""}>Clean</option>
            </select>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
}

export function renderTbodyRows(rows) {
  const tbody = state.ui.tbodyEl;
  if (!tbody) return;

  const html =
    state.viewMode === "movies"
      ? rows.map(movieRowHtml).join("")
      : rows.map(cardRowHtml).join("");

  // Only update TBODY (no full table rerender)
  tbody.innerHTML = html;
}

function movieRowHtml(m) {
  const statusClass = m.done === "T" ? "row-done" : "row-pending";

  return `
    <tr data-movie-id="${m.id}" class="${statusClass}">
      <td class="movie-clickable movie-title-row">${m.title || "Untitled"}</td>
      <td class="movie-clickable">${m.total_cards || 0}</td>
      <td class="movie-clickable">${m.total_cards_need_review || 0}</td>
      <td class="movie-clickable">${m.done === "T" ? "Done" : "Pending"}</td>
      <td class="movie-clickable need-review-cell">
        ${m.need_review === "T" ? Icons.flagSolid : ""}
      </td>
      <td>${actions(m)}</td>
    </tr>
  `;
}

function cardRowHtml(c) {
  return `
    <tr data-card-id="${c.id}">
      <td>${c.movie_title || ""}</td>
      <td>${c.name || ""}</td>
      <td>${c.type || ""}</td>
      <td>${c.call_sign || ""}</td>
      <td>${c.ability_text || ""}</td>
      <td>${c.ability_text2 || ""}</td>
      <td>
        ${Array.isArray(c.tags)
          ? c.tags.map((t) => t.name).join(", ")
          : (c.tags || "")
        }
      </td>
      <td class="need-review">${c.need_review === "T" ? Icons.flagSolid : ""}</td>
      <td>${actions(c)}</td>
    </tr>
  `;
}

export function syncHeaderControls() {
  // Used for Clear Filters: update existing inputs/selects without rerendering whole table shell
  const root = state.ui.tableContainer;
  if (!root) return;

  root.querySelectorAll("[data-filter]").forEach((el) => {
    const key = el.dataset.filter;
    const [scope, field] = key.split(".");
    const val = state.filters[scope][field];

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = val;
    if (el.tagName === "SELECT") el.value = val;
  });

  // Update sort icons
  root.querySelectorAll("th[data-sort]").forEach((thEl) => {
    const key = thEl.dataset.sort;
    const iconEl = thEl.querySelector(".sort-icon");
    if (!iconEl) return;

    if (state.sort.key !== key) {
      iconEl.innerHTML = Icons.sort;
    } else {
      iconEl.innerHTML = state.sort.dir === "asc" ? Icons.sortUp : Icons.sortDown;
    }
  });
}

