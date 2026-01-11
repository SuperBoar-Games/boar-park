import { loadMovieDetails } from "./movie.js";
import { renderGameSection } from "./game.js";
import { renderTagsSection } from "./tags.js";
import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

/* ================= STATE ================= */

let activeHeroId = null;
let activeHeroName = null;

let viewMode = localStorage.getItem("blastAlpha.hero.viewMode") || "movies";

let allMovies = [];
let allCards = [];

let sortState = { key: null, dir: "asc" };

let filtersMovies = {
  title: "",
  totalMin: "",
  reviewMin: "",
  status: "all",
  needReview: "all",
};

let filtersCards = {
  movieTitle: "",
  name: "",
  type: "",
  callSign: "",
  ability1: "",
  ability2: "",
  needReview: "all",
};

let focusedFilterKey = null;
let focusedCursorPos = null;

initDelegatedHandlers();

/* ================= LOAD ================= */

export async function loadHeroDetails(heroId, heroName) {
  activeHeroId = heroId;
  activeHeroName = heroName;

  const url =
    viewMode === "movies"
      ? `/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie&heroId=${heroId}`
      : `/api-proxy/games/?gameSlug=blast-alpha&queryKey=cardsByHero&heroId=${heroId}`;

  const res = await fetch(url);

  if (!res.ok) {
    contentSection.innerHTML = `<p>Error loading data</p>`;
    return;
  }

  const { data } = await res.json();

  if (viewMode === "movies") allMovies = data || [];
  else allCards = data || [];

  render();
}

/* ================= RENDER ================= */

function render() {
  preserveFilterFocus();

  if (viewMode === "movies") {
    const processed = applyMovieFiltersAndSort(allMovies);
    contentSection.innerHTML = generateMoviesTable(processed);
  } else {
    const processed = applyCardFiltersAndSort(allCards);
    contentSection.innerHTML = generateCardsTable(processed);
  }

  restoreFilterFocus();
}

/* ================= FILTER + SORT ================= */

function applyMovieFiltersAndSort(data) {
  let result = [...data];

  if (filtersMovies.title) {
    result = result.filter((m) =>
      m.title?.toLowerCase().includes(filtersMovies.title.toLowerCase())
    );
  }

  if (filtersMovies.totalMin !== "") {
    result = result.filter(
      (m) => (m.total_cards || 0) >= Number(filtersMovies.totalMin)
    );
  }

  if (filtersMovies.reviewMin !== "") {
    result = result.filter(
      (m) => (m.total_cards_need_review || 0) >= Number(filtersMovies.reviewMin)
    );
  }

  if (filtersMovies.status !== "all") {
    result = result.filter((m) =>
      filtersMovies.status === "done" ? m.done === "T" : m.done !== "T"
    );
  }

  if (filtersMovies.needReview !== "all") {
    result = result.filter((m) =>
      filtersMovies.needReview === "yes"
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

function applyCardFiltersAndSort(data) {
  let result = [...data];

  const f = filtersCards;

  if (f.movieTitle) {
    result = result.filter((c) =>
      (c.movie_title || "").toLowerCase().includes(f.movieTitle.toLowerCase())
    );
  }
  if (f.name) {
    result = result.filter((c) =>
      (c.name || "").toLowerCase().includes(f.name.toLowerCase())
    );
  }
  if (f.type) {
    result = result.filter((c) =>
      (c.type || "").toLowerCase().includes(f.type.toLowerCase())
    );
  }
  if (f.callSign) {
    result = result.filter((c) =>
      (c.call_sign || "").toLowerCase().includes(f.callSign.toLowerCase())
    );
  }
  if (f.ability1) {
    result = result.filter((c) =>
      (c.ability_text || "").toLowerCase().includes(f.ability1.toLowerCase())
    );
  }
  if (f.ability2) {
    result = result.filter((c) =>
      (c.ability_text2 || "").toLowerCase().includes(f.ability2.toLowerCase())
    );
  }

  if (f.needReview !== "all") {
    result = result.filter((c) =>
      f.needReview === "yes" ? c.need_review === "T" : c.need_review !== "T"
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
        <button id="toggle-view" type="button">
          ${viewMode === "movies" ? "View Cards" : "View Movies"}
        </button>
        <button id="add-item" type="button">
          ${viewMode === "movies" ? "Add Movie" : "Add Card"}
        </button>
        <button id="view-tags" type="button">View Tags</button>
        <button id="clear-filters" type="button">Clear Filters</button>
      </div>
    </div>
  `;
}

function th(label, key) {
  let icon = Icons.sort;

  if (sortState.key === key) {
    icon = sortState.dir === "asc" ? Icons.sortUp : Icons.sortDown;
  }

  return `
    <th data-sort="${key}" class="sortable">
      <span class="th-label">${label}</span>
      <span class="sort-icon">${icon}</span>
    </th>
  `;
}

/* ================= MOVIES TABLE ================= */

function generateMoviesTable(movies) {
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
          ${th("Review", "need_review")}
          <th>Actions</th>
        </tr>
        <tr class="filters">
          <th>
            <input
              data-filter="movies.title"
              placeholder="Filter title"
              value="${filtersMovies.title}"
            >
          </th>
          <th>
            <input
              type="number"
              min="0"
              data-filter="movies.totalMin"
              value="${filtersMovies.totalMin}"
            >
          </th>
          <th>
            <input
              type="number"
              min="0"
              data-filter="movies.reviewMin"
              value="${filtersMovies.reviewMin}"
            >
          </th>
          <th>
            <select data-filter="movies.status">
              <option value="all" ${filtersMovies.status === "all" ? "selected" : ""}>All</option>
              <option value="done" ${filtersMovies.status === "done" ? "selected" : ""}>Done</option>
              <option value="pending" ${filtersMovies.status === "pending" ? "selected" : ""}>Pending</option>
            </select>
          </th>
          <th>
            <select data-filter="movies.needReview">
              <option value="all" ${filtersMovies.needReview === "all" ? "selected" : ""}>All</option>
              <option value="yes" ${filtersMovies.needReview === "yes" ? "selected" : ""}>Needs Review</option>
              <option value="no" ${filtersMovies.needReview === "no" ? "selected" : ""}>Clean</option>
            </select>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${movies.map(movieRow).join("")}
      </tbody>
    </table>
    </div>
  `;
}

function movieRow(m) {
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
      <td>${actions("movie", m)}</td>
    </tr>
  `;
}

/* ================= CARDS TABLE ================= */

function generateCardsTable(cards) {
  return `
    ${header()}
    <div class="table-wrapper">
    <table class="movie-table">
      <colgroup>
        <col style="width: 18%; min-width: 160px">  <!-- Movie -->
        <col style="width: 14%; min-width: 140px">  <!-- Name -->
        <col style="width: 10%; min-width: 100px">  <!-- Type -->
        <col style="width: 14%; min-width: 140px">  <!-- Call Sign -->
        <col style="width: 18%; min-width: 180px">  <!-- Ability -->
        <col style="width: 18%; min-width: 180px">  <!-- Ability 2 -->
        <col style="width: 8%;  min-width: 90px">   <!-- Review -->
        <col style="width: 10%; min-width: 120px">  <!-- Actions -->
      </colgroup>
      <thead>
        <tr>
          ${th("Movie", "movie_title")}
          ${th("Name", "name")}
          ${th("Type", "type")}
          ${th("Call Sign", "call_sign")}
          ${th("Ability", "ability_text")}
          ${th("Ability 2", "ability_text2")}
          ${th("Review", "need_review")}
          <th>Actions</th>
        </tr>
        <tr class="filters">
          <th><input data-filter="cards.movieTitle" placeholder="Filter movie" value="${filtersCards.movieTitle}"></th>
          <th><input data-filter="cards.name" placeholder="Filter name" value="${filtersCards.name}"></th>
          <th>
            <select data-filter="cards.type">
              <option value="" ${filtersCards.type === "" ? "selected" : ""}>All</option>
              <option value="HERO" ${filtersCards.type === "HERO" ? "selected" : ""}>Hero</option>
              <option value="VILLAIN" ${filtersCards.type === "VILLAIN" ? "selected" : ""}>Villain</option>
              <option value="SR1" ${filtersCards.type === "SR1" ? "selected" : ""}>SR1</option>
              <option value="SR2" ${filtersCards.type === "SR2" ? "selected" : ""}>SR2</option>
              <option value="WC" ${filtersCards.type === "WC" ? "selected" : ""}>WC</option>
            </select>
          </th>
          <th><input data-filter="cards.callSign" placeholder="Filter call sign" value="${filtersCards.callSign}"></th>
          <th><input data-filter="cards.ability1" placeholder="Filter ability" value="${filtersCards.ability1}"></th>
          <th><input data-filter="cards.ability2" placeholder="Filter ability 2" value="${filtersCards.ability2}"></th>
          <th>
            <select data-filter="cards.needReview">
              <option value="all" ${filtersCards.needReview === "all" ? "selected" : ""}>All</option>
              <option value="yes" ${filtersCards.needReview === "yes" ? "selected" : ""}>Needs Review</option>
              <option value="no" ${filtersCards.needReview === "no" ? "selected" : ""}>Clean</option>
            </select>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${cards.map(cardRow).join("")}
      </tbody>
    </table>
    </div>
  `;
}

function cardRow(c) {
  return `
    <tr data-card-id="${c.id}">
      <td>${c.movie_title || ""}</td>
      <td>${c.name || ""}</td>
      <td>${c.type || ""}</td>
      <td>${c.call_sign || ""}</td>
      <td>${c.ability_text || ""}</td>
      <td>${c.ability_text2 || ""}</td>
      <td>${c.need_review === "T" ? Icons.review : ""}</td>
      <td>${actions("card", c)}</td>
    </tr>
  `;
}

/* ================= ACTIONS ================= */

function actions(kind, row) {
  return `
    <div class="card-actions">
      <button class="edit" type="button" title="Edit">${Icons.edit}</button>
      <div class="dropdown">
        <button class="dropdown-button" type="button">⋮</button>
        <div class="dropdown-content">
          <button class="review-action" type="button" data-kind="${kind}" data-need-review="${
    row.need_review === "T"
  }">
            ${row.need_review === "T" ? "Mark Resolved" : "Mark for Review"}
          </button>
          <button class="delete" type="button" data-kind="${kind}">Delete</button>
        </div>
      </div>
    </div>
  `;
}

/* ================= EVENTS ================= */

function initDelegatedHandlers() {
  contentSection.addEventListener("click", async (e) => {
    const movieRowEl = e.target.closest("[data-movie-id]");
    const cardRowEl = e.target.closest("[data-card-id]");
    const movieId = movieRowEl?.dataset.movieId;
    const cardId = cardRowEl?.dataset.cardId;

    if (e.target.closest("#clear-filters")) {
      filtersMovies = {
        title: "",
        totalMin: "",
        reviewMin: "",
        status: "all",
        needReview: "all",
      };
      filtersCards = {
        movieTitle: "",
        name: "",
        type: "",
        callSign: "",
        ability1: "",
        ability2: "",
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

    if (e.target.closest("#toggle-view")) {
      viewMode = viewMode === "movies" ? "cards" : "movies";
      localStorage.setItem("blastAlpha.hero.viewMode", viewMode);

      sortState = { key: null, dir: "asc" };
      render();
      // ensure correct dataset is loaded for view
      await loadHeroDetails(activeHeroId, activeHeroName);
      return;
    }

    if (e.target.closest("#add-item")) {
      if (viewMode === "movies") {
        addOrEditMovieModal(false, null, activeHeroId);
      } else {
        addOrEditCardModal(false, null, activeHeroId);
      }
      return;
    }

    if (e.target.closest("#view-tags")) {
      await renderTagsSection();
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

    if (viewMode === "movies") {
      if (e.target.closest(".movie-clickable") && movieId) {
        history.pushState(
          {},
          "",
          `/admin/games/blast-alpha/?heroId=${activeHeroId}&movieId=${movieId}`
        );
        await loadMovieDetails(movieId, activeHeroId);
        return;
      }

      const editBtn = e.target.closest(".edit");
      if (editBtn && movieId) {
        const title =
          movieRowEl.querySelector(".movie-title-row")?.textContent || "";
        addOrEditMovieModal(true, { id: movieId, title }, activeHeroId);
        return;
      }

      const deleteBtn = e.target.closest(".delete");
      if (deleteBtn && movieId) {
        if (!confirm("Delete this movie?")) return;

        await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: movieId }),
        });

        loadHeroDetails(activeHeroId, activeHeroName);
        return;
      }

      const reviewBtn = e.target.closest(".review-action");
      if (reviewBtn && movieId) {
        const needReview = reviewBtn.dataset.needReview === "true";

        await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: movieId,
            need_review: needReview ? "F" : "T",
            heroId: activeHeroId,
          }),
        });

        loadHeroDetails(activeHeroId, activeHeroName);
        return;
      }
    }

    if (viewMode === "cards") {
      const editBtn = e.target.closest(".edit");
      if (editBtn && cardId) {
        const card = allCards.find((c) => String(c.id) === String(cardId));
        addOrEditCardModal(true, card, activeHeroId);
        return;
      }

      const deleteBtn = e.target.closest(".delete");
      if (deleteBtn && cardId) {
        if (!confirm("Delete this card?")) return;

        await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId }),
        });

        loadHeroDetails(activeHeroId, activeHeroName);
        return;
      }

      const reviewBtn = e.target.closest(".review-action");
      if (reviewBtn && cardId) {
        const needReview = reviewBtn.dataset.needReview === "true";

        await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: cardId,
            need_review: needReview ? "F" : "T",
          }),
        });

        loadHeroDetails(activeHeroId, activeHeroName);
        return;
      }
    }
  });

  contentSection.addEventListener("input", (e) => {
    const key = e.target.dataset.filter;
    if (!key) return;

    const [scope, field] = key.split(".");
    if (scope === "movies") filtersMovies[field] = e.target.value;
    if (scope === "cards") filtersCards[field] = e.target.value;

    render();
  });

  contentSection.addEventListener("change", (e) => {
    const key = e.target.dataset.filter;
    if (!key) return;

    const [scope, field] = key.split(".");
    if (scope === "movies") filtersMovies[field] = e.target.value;
    if (scope === "cards") filtersCards[field] = e.target.value;

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

  const el = contentSection.querySelector(`[data-filter="${focusedFilterKey}"]`);
  if (!el) return;

  el.focus();
  if (typeof focusedCursorPos === "number") {
    el.setSelectionRange(focusedCursorPos, focusedCursorPos);
  }
}

/* ================= MODALS ================= */

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

    await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie`, {
      method: editFlag ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editFlag ? editData.id : undefined,
        title,
        heroId,
      }),
    });

    modal.remove();
    loadHeroDetails(heroId, activeHeroName);
  };
}

async function addOrEditCardModal(editFlag, editData, heroId) {
  
  if (!allMovies.length) {
    const res = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=movie&heroId=${heroId}`
    );
    const { data } = await res.json();
    allMovies = data || [];
  }

  if (!allMovies.length) {
    alert("Please add a movie before adding cards.");
    return;
  }

  const d = editData || {};
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" role="button">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Card</h2>
      <form class="card-form">
        <label>
          Movie
          <select name="movie_id" required>
            <option value="">Select movie</option>
            ${allMovies
              .map(
                (m) => `
                  <option value="${m.id}"
                    ${Number(d.movie_id) === Number(m.id) ? "selected" : ""}>
                    ${m.title}
                  </option>
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

        <button type="submit">${editFlag ? "Update" : "Add"}</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector(".close").onclick = () => modal.remove();

  modal.querySelectorAll("textarea.autogrow").forEach((ta) => {
    autoGrowTextarea(ta);
    ta.addEventListener("input", () => autoGrowTextarea(ta));
  });

  modal.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    const payload = {
      cardId: editFlag ? d.id : undefined,
      movieId: Number(fd.get("movie_id")),
      heroId,
      name: String(fd.get("name") || "").trim(),
      type: String(fd.get("type") || "").trim().toUpperCase(),
      call_sign: String(fd.get("call_sign") || "").trim(),
      ability_text: String(fd.get("ability_text") || "").trim(),
      ability_text2: String(fd.get("ability_text2") || "").trim(),
      need_review: String(fd.get("need_review") || "F"),
    };

    await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`, {
      method: editFlag ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    modal.remove();
    loadHeroDetails(heroId, activeHeroName);
  };
}

function autoGrowTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

