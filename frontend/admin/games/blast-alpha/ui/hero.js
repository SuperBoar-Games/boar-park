import { loadMovieDetails } from "./movie.js";
import { renderGameSection } from "./game.js";
import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

/* ================= STATE ================= */

let activeHeroId = null;
let activeHeroName = null;

let allMovies = [];

let sortState = { key: null, dir: "asc" };

let filters = {
  title: "",
  totalMin: "",
  reviewMin: "",
  status: "all",
  needReview: "all",
};

// focus preservation
let focusedFilterKey = null;
let focusedCursorPos = null;

initDelegatedHandlers();

/* ================= LOAD ================= */

export async function loadHeroDetails(heroId, heroName) {
  activeHeroId = heroId;
  activeHeroName = heroName;

  const res = await fetch(
    `/api-proxy/games/?gameSlug=blast-alpha&heroId=${heroId}`
  );

  if (!res.ok) {
    contentSection.innerHTML = `<p>Error loading movies</p>`;
    return;
  }

  const { data } = await res.json();
  allMovies = data || [];

  render();
}

/* ================= RENDER ================= */

function render() {
  preserveFilterFocus();

  const processed = applyFiltersAndSort(allMovies);

  contentSection.innerHTML = generateTableLayout(processed);

  restoreFilterFocus();
}

/* ================= FILTER + SORT ================= */

function applyFiltersAndSort(data) {
  let result = [...data];

  if (filters.title) {
    result = result.filter((m) =>
      m.title?.toLowerCase().includes(filters.title.toLowerCase())
    );
  }

  if (filters.totalMin !== "") {
    result = result.filter(
      (m) => (m.total_cards || 0) >= Number(filters.totalMin)
    );
  }

  if (filters.reviewMin !== "") {
    result = result.filter(
      (m) =>
        (m.total_cards_need_review || 0) >= Number(filters.reviewMin)
    );
  }

  if (filters.status !== "all") {
    result = result.filter((m) =>
      filters.status === "done" ? m.done === "T" : m.done !== "T"
    );
  }

  if (filters.needReview !== "all") {
    result = result.filter((m) =>
      filters.needReview === "yes"
        ? m.need_review === "T"
        : m.need_review !== "T"
    );
  }

  if (sortState.key) {
    result.sort((a, b) => {
      const A = a[sortState.key] ?? "";
      const B = b[sortState.key] ?? "";

      if (A < B) return sortState.dir === "asc" ? -1 : 1;
      if (A > B) return sortState.dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  return result;
}

/* ================= UI ================= */

function header() {
  return `
    <div class="title-header">
      <h2>${activeHeroName || "Movies"}</h2>
      <div class="header-actions">
        <button id="back-to-hero" type="button">Back</button>
        <button id="add-movie" type="button">Add Movie</button>
        <button id="clear-filters" type="button">Clear Filters</button>
      </div>
    </div>
  `;
}

function th(label, key) {
  let icon = Icons.sort;
  
  if (sortState.key === key) {
    icon =
      sortState.dir === "asc" ? Icons.sortUp : Icons.sortDown;
  }

  return `
    <th data-sort="${key}" class="sortable">
      <span class="th-label">${label}</span>
      <span class="sort-icon">${icon}</span>
    </th>
  `;
}

function generateTableLayout(movies) {
  return `
    ${header()}
    <div class="table-wrapper">
    <table class="movie-table">
      <thead>
        <tr>
          ${th("Title", "title")}
          ${th("Total Cards", "total_cards")}
          ${th("Needs Review", "total_cards_need_review")}
          ${th("Status", "done")}
          ${th("Review Flag", "need_review")}
          <th>Actions</th>
        </tr>
        <tr class="filters">
          <th>
            <input
              data-filter="title"
              placeholder="Filter title"
              value="${filters.title}"
            >
          </th>
          <th>
            <input
              type="number"
              min="0"
              data-filter="totalMin"
              value="${filters.totalMin}"
            >
          </th>
          <th>
            <input
              type="number"
              min="0"
              data-filter="reviewMin"
              value="${filters.reviewMin}"
            >
          </th>
          <th>
            <select data-filter="status">
              <option value="all" ${filters.status === "all" ? "selected" : ""}>All</option>
              <option value="done" ${filters.status === "done" ? "selected" : ""}>Done</option>
              <option value="pending" ${filters.status === "pending" ? "selected" : ""}>Pending</option>
            </select>
          </th>
          <th>
            <select data-filter="needReview">
              <option value="all" ${filters.needReview === "all" ? "selected" : ""}>All</option>
              <option value="yes" ${filters.needReview === "yes" ? "selected" : ""}>Needs Review</option>
              <option value="no" ${filters.needReview === "no" ? "selected" : ""}>Clean</option>
            </select>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${movies.map(tableRow).join("")}
      </tbody>
    </table>
    </div>
  `;
}

function tableRow(m) {
  const statusClass = m.done === "T" ? "row-done" : "row-pending";

  return `
    <tr data-movie-id="${m.id}" class="${statusClass}">
      <td class="movie-clickable movie-title-row">${m.title || "Untitled"}</td>
      <td class="movie-clickable">${m.total_cards || 0}</td>
      <td class="movie-clickable">${m.total_cards_need_review || 0}</td>
      <td class="movie-clickable">${m.done === "T" ? "Done" : "Pending"}</td>
      <td class="movie-clickable">
        ${m.need_review === "T" ? Icons.review : ""}
      </td>
      <td>${actions(m)}</td>
    </tr>
  `;
}

/* ================= ACTIONS ================= */

function actions(movie) {
  return `
    <div class="card-actions">
      <button class="edit" type="button" title="Edit">
        ${Icons.edit}
      </button>
      <div class="dropdown">
        <button class="dropdown-button" type="button">⋮</button>
        <div class="dropdown-content">
          <button class="review-action" type="button" data-need-review="${
            movie.need_review === "T"
          }">
            ${movie.need_review === "T" ? "Mark Resolved" : "Mark for Review"}
          </button>
          <button class="delete" type="button">Delete</button>
        </div>
      </div>
    </div>
  `;
}

/* ================= EVENTS ================= */

function initDelegatedHandlers() {
  contentSection.addEventListener("click", async (e) => {
    const row = e.target.closest("[data-movie-id]");
    const movieId = row?.dataset.movieId;

    if (e.target.closest("#clear-filters")) {
      filters = {
        title: "",
        totalMin: "",
        reviewMin: "",
        status: "all",
        needReview: "all",
      };
      sortState = { key: null, dir: "asc" };
      render();
      return;
    }

    if (e.target.closest("#back-to-hero")) {
      history.pushState({}, "", "/admin/games/blast-alpha");
      renderGameSection();
      return;
    }

    if (e.target.closest("#add-movie")) {
      addOrEditMovieModal(false, null, activeHeroId);
      return;
    }

    const sortTh = e.target.closest("th[data-sort]");
    if (sortTh) {
      const key = sortTh.dataset.sort;
      sortState.dir =
        sortState.key === key && sortState.dir === "asc" ? "desc" : "asc";
      sortState.key = key;
      render();
      return;
    }

    if (e.target.closest(".movie-clickable") && movieId) {
      await loadMovieDetails(movieId, activeHeroId);
      return;
    }

    const editBtn = e.target.closest(".edit");
    if (editBtn && movieId) {
      const title =
        row.querySelector(".movie-title-row")?.textContent || "";
      addOrEditMovieModal(true, { id: movieId, title }, activeHeroId);
      return;
    }

    const deleteBtn = e.target.closest(".delete");
    if (deleteBtn && movieId) {
      if (!confirm("Delete this movie?")) return;

      await fetch(
        `/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: movieId }),
        }
      );

      loadHeroDetails(activeHeroId, activeHeroName);
      return;
    }

    const reviewBtn = e.target.closest(".review-action");
    if (reviewBtn && movieId) {
      const needReview = reviewBtn.dataset.needReview === "true";

      await fetch(
        `/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: movieId,
            need_review: needReview ? "F" : "T",
            heroId: activeHeroId,
          }),
        }
      );

      loadHeroDetails(activeHeroId, activeHeroName);
    }
  });

  contentSection.addEventListener("input", (e) => {
    const key = e.target.dataset.filter;
    if (!key) return;
    filters[key] = e.target.value;
    render();
  });

  contentSection.addEventListener("change", (e) => {
    const key = e.target.dataset.filter;
    if (!key) return;
    filters[key] = e.target.value;
    render();
  });
}

/* ================= FOCUS PRESERVATION ================= */

function preserveFilterFocus() {
  const el = document.activeElement;
  if (!el?.dataset?.filter) return;

  focusedFilterKey = el.dataset.filter;
  focusedCursorPos = el.selectionStart;
}

function restoreFilterFocus() {
  if (!focusedFilterKey) return;

  const el = contentSection.querySelector(
    `[data-filter="${focusedFilterKey}"]`
  );
  if (!el) return;

  el.focus();
  if (typeof focusedCursorPos === "number") {
    el.setSelectionRange(focusedCursorPos, focusedCursorPos);
  }
}

/* ================= MODAL ================= */

function addOrEditMovieModal(editFlag, editData, heroId) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" role="button">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Movie</h2>
      <form>
        <input name="title" required value="${editFlag ? editData.title : ""}">
        <button type="submit">${editFlag ? "Update" : "Add"}</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").onclick = () => modal.remove();

  modal.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const title = e.target.title.value;

    await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie`,
      {
        method: editFlag ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editFlag ? editData.id : undefined,
          title,
          heroId,
        }),
      }
    );

    modal.remove();
    loadHeroDetails(heroId, activeHeroName);
  };
}

