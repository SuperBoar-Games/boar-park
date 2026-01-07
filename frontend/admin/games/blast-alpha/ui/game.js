import { loadHeroDetails } from "./hero.js";
import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

let gameState = {
  rawData: [],
  filteredData: [],
  sortState: { key: "name", dir: "asc" },
  filters: {
    name: "",
    category: "",
    total_movies: "",
    pending_movies: "",
    total_cards: ""
  },
  industryList: []
};

export async function renderGameSection() {
  try {
    const res = await fetch("/api-proxy/games/?gameSlug=blast-alpha");
    if (!res.ok) {
      contentSection.innerHTML = `<li>Error: ${res.status}</li>`;
      return;
    }
    const { data: gameData } = await res.json();
    gameState.rawData = gameData || [];
    gameState.industryList = [...new Set(gameState.rawData.map(h => h.category))];
    
    applyFiltersAndSort();
    renderTableStructure();
  } catch (error) {
    console.error("Failed to render game section", error);
    contentSection.innerHTML = "<p>Error loading game data.</p>";
  }
}

/**
 * Generates the Header Cell with Sorting Logic
 */
function th(label, key) {
  let icon = Icons.sort;
  if (gameState.sortState.key === key) {
    icon = gameState.sortState.dir === "asc" ? Icons.sortUp : Icons.sortDown;
  }

  return `
    <th class="sortable" data-sort="${key}">
      <span class="th-label">${label}</span>
      <span class="sort-icon">${icon}</span>
    </th>
  `;
}

/**
 * Generates the Filter Input for a specific key
 */
function filterInput(key) {
  return `
    <td>
      <input type="text" 
             class="column-filter" 
             data-filter="${key}" 
             placeholder="Filter..." 
             value="${gameState.filters[key] || ''}">
    </td>
  `;
}

function renderTableStructure() {
  contentSection.innerHTML = `
    <div class="title-header">
      <h2>Blast Alpha</h2>
      <div class="header-actions">
        <button id="back-to-admin">Back to Admin</button>
        <button id="clear-filters" class="secondary-btn">Clear Filters</button>
        <button class="add-hero">Add Hero</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="movie-table" id="hero-table">
        <thead>
          <tr>
            ${th("Hero Name", "name")}
            ${th("Industry", "category")}
            ${th("Total Movies", "total_movies")}
            ${th("Pending", "pending_movies")}
            ${th("Cards", "total_cards")}
            <th>Actions</th>
          </tr>
          <tr class="filters">
            ${filterInput("name")}
            ${filterInput("category")}
            ${filterInput("total_movies")}
            ${filterInput("pending_movies")}
            ${filterInput("total_cards")}
            <td></td> </tr>
        </thead>
        <tbody id="hero-table-body">${renderTableRows()}</tbody>
      </table>
    </div>
  `;
  attachEventListeners();
}

function renderTableRows() {
  if (gameState.filteredData.length === 0) {
    return `<tr><td colspan="6" style="text-align:center;">No heroes found.</td></tr>`;
  }
  return gameState.filteredData.map(hero => `
    <tr class="hero-row" data-hero-id="${hero.id}">
      <td class="movie-clickable movie-title-row">${hero.name}</td>
      <td class="movie-clickable">${hero.category}</td>
      <td class="movie-clickable">${hero.total_movies || 0}</td>
      <td class="movie-clickable">${hero.pending_movies || 0}</td>
      <td class="movie-clickable">${hero.total_cards || 0}</td>
      <td>
        <div class="card-actions">
          <button class="edit-btn" type="button">${Icons.edit}</button>
          <button class="delete-btn" type="button">${Icons.delete}</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function applyFiltersAndSort() {
  gameState.filteredData = gameState.rawData.filter(hero => {
    return Object.keys(gameState.filters).every(key => {
      const dataKey = key === 'category' ? 'category' : key;
      const val = String(hero[dataKey] || "").toLowerCase();
      return val.includes(gameState.filters[key].toLowerCase());
    });
  });

  const { key, dir } = gameState.sortState;
  gameState.filteredData.sort((a, b) => {
    let valA = a[key], valB = b[key];
    if (!isNaN(valA) && !isNaN(valB)) { valA = Number(valA); valB = Number(valB); }
    if (valA < valB) return dir === "asc" ? -1 : 1;
    if (valA > valB) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

function attachEventListeners() {
  // 1. Filter Inputs logic
  contentSection.querySelectorAll(".column-filter").forEach(input => {
    // Stop the click from even reaching the TH or TBODY
    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    input.addEventListener("input", (e) => {
      e.stopPropagation();
      const key = e.target.getAttribute("data-filter");
      gameState.filters[key] = e.target.value;
      applyFiltersAndSort();
      document.getElementById("hero-table-body").innerHTML = renderTableRows();
    });
  });

  // 2. Sorting Logic (Updated with Guard)
  contentSection.querySelectorAll("th.sortable").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      // HARD GUARD: If the click target is an input, do nothing.
      if (e.target.closest(".column-filter")) return;

      const key = el.getAttribute("data-sort");
      gameState.sortState.dir = (gameState.sortState.key === key && gameState.sortState.dir === "asc") ? "desc" : "asc";
      gameState.sortState.key = key;
      refreshUI();
    });
  });

  // 3. Row Navigation (Updated with Hard Guard)
  const tbody = document.getElementById("hero-table-body");
    tbody.addEventListener("click", async (e) => {
    // HARD EXIT: only allow clicks originating from tbody cells
    if (!e.target.closest("tbody")) return;

    // Exit if clicking buttons or action UI
    if (e.target.closest("button") || e.target.closest(".card-actions")) return;

    const cell = e.target.closest(".movie-clickable");
    if (!cell) return;

    const row = cell.closest("tr");
    const heroId = row?.getAttribute("data-hero-id");
    if (!heroId) return;

    const heroName = row.querySelector(".movie-title-row").textContent.trim();
    await loadHeroDetails(heroId, heroName);
  });

  // 4. Action Buttons logic (Delegated)
  tbody.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (editBtn || deleteBtn) {
      e.stopPropagation(); // Stop navigation from triggering
      const heroId = e.target.closest("tr").getAttribute("data-hero-id");
      const hero = gameState.rawData.find(h => String(h.id) === String(heroId));

      if (editBtn) {
        addOrEditHeroModal(true, { ...hero, industry: hero.category, industryList: gameState.industryList });
      } else if (deleteBtn) {
        handleDelete(hero);
      }
    }
  });

  // 5. Clear Filters
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    Object.keys(gameState.filters).forEach(key => gameState.filters[key] = "");
    contentSection.querySelectorAll(".column-filter").forEach(input => input.value = "");
    applyFiltersAndSort();
    document.getElementById("hero-table-body").innerHTML = renderTableRows();
  });

  // 6. Global Actions
  document.getElementById("back-to-admin")?.addEventListener("click", () => {
    window.location.href = "/admin";
  });

  document.querySelector(".add-hero")?.addEventListener("click", () => {
    addOrEditHeroModal(false, { industryList: gameState.industryList });
  });
}

function refreshUI() {
  applyFiltersAndSort();
  renderTableStructure();
}

async function handleDelete(hero) {
  if (!confirm(`Delete ${hero.name}?`)) return;
  const res = await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=hero`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: hero.id }),
  });
  if (res.ok) renderGameSection();
}

function addOrEditHeroModal(editFlag, editData = null) {
  const modal = document.createElement("div");
  modal.className = "modal";
  const options = editData?.industryList?.map(ind => 
    `<option value="${ind}" ${editFlag && editData.industry === ind ? "selected" : ""}>${ind}</option>`
  ).join("");

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Hero</h2>
      <form id="hero-form">
        <label>Hero Name:</label>
        <input type="text" name="hero-name" required value="${editFlag ? editData.name : ""}">
        <label>Industry:</label>
        <select name="hero-industry">${options}${!editFlag ? '<option value="new">Add New Industry</option>' : ""}</select>
        <div id="new-industry-input" style="display: none;"><input type="text" name="new-industry-name" placeholder="New Industry"></div>
        <button type="submit" class="submit-btn">${editFlag ? "Update" : "Add"}</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  const form = modal.querySelector("#hero-form");
  form["hero-industry"].onchange = (e) => modal.querySelector("#new-industry-input").style.display = e.target.value === "new" ? "block" : "none";
  modal.querySelector(".close").onclick = () => modal.remove();
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = form["hero-name"].value;
    let industry = form["hero-industry"].value;
    if (industry === "new") industry = form["new-industry-name"].value;
    const res = await fetch(`/api-proxy/games/?gameSlug=blast-alpha&queryKey=hero`, {
      method: editFlag ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editData?.id, name, industry }),
    });
    if (res.ok) { modal.remove(); renderGameSection(); }
  };
}
