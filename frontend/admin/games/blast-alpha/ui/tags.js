import { Icons } from "../../../../components/icons.js";

/* ---------------- STATE ---------------- */

let tagState = {
  rawData: [],
  filteredData: [],
  sortState: { key: "name", dir: "asc" },
  filters: { name: "", total_cards: "" },
  container: null
};

/* ---------------- PUBLIC API ---------------- */

export async function renderTagsSection(container, heroId = null) {
  if (!container) throw new Error("contentSection container is required");
  tagState.container = container;

  const res = await fetch(
    `/api-proxy/games/?gameSlug=blast-alpha&queryKey=tagsCountByHero&heroId=${heroId}`
  );
  const { data } = await res.json();

  tagState.rawData = data || [];
  applyFiltersAndSort();
  renderTable();
}

/* ---------------- TABLE ---------------- */

function renderTable() {
  tagState.container.innerHTML = `
    <div class="title-header">
      <h2>Tags</h2>
      <div class="header-actions">
        <button id="add-tag">Add Tag</button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="movie-table">
        <thead>
          <tr>
            ${th("Tag", "name")}
            ${th("Cards", "total_cards")}
            <th>Actions</th>
          </tr>
          <tr class="filters">
            ${filterInput("name")}
            ${filterInput("total_cards")}
            <td></td>
          </tr>
        </thead>
        <tbody>${renderRows()}</tbody>
      </table>
    </div>
  `;
  attachEvents();
}

function renderRows() {
  if (!tagState.filteredData.length) {
    return `<tr><td colspan="3" style="text-align:center;">No tags</td></tr>`;
  }

  return tagState.filteredData
    .map(
      t => `
    <tr data-id="${t.tag_id}">
      <td>${t.tag_name}</td>
      <td>${t.card_count || 0}</td>
      <td>
        <button class="edit-btn">${Icons.edit}</button>
        <button class="delete-btn">${Icons.delete}</button>
      </td>
    </tr>
  `
    )
    .join("");
}

/* ---------------- SORT / FILTER ---------------- */

function th(label, key) {
  const icon =
    tagState.sortState.key === key
      ? tagState.sortState.dir === "asc"
        ? Icons.sortUp
        : Icons.sortDown
      : Icons.sort;

  return `<th class="sortable" data-sort="${key}">
    ${label} <span>${icon}</span>
  </th>`;
}

function filterInput(key) {
  return `<td>
    <input
      class="column-filter"
      data-filter="${key}"
      value="${tagState.filters[key]}"
    />
  </td>`;
}

function applyFiltersAndSort() {
  tagState.filteredData = tagState.rawData.filter(t =>
    Object.keys(tagState.filters).every(k =>
      String(t[k] || "")
        .toLowerCase()
        .includes(tagState.filters[k].toLowerCase())
    )
  );

  const { key, dir } = tagState.sortState;
  tagState.filteredData.sort((a, b) =>
    dir === "asc"
      ? String(a[key]).localeCompare(String(b[key]), undefined, {
          numeric: true
        })
      : String(b[key]).localeCompare(String(a[key]), undefined, {
          numeric: true
        })
  );
}

/* ---------------- EVENTS ---------------- */

function attachEvents() {
  const container = tagState.container;

  container.querySelectorAll(".column-filter").forEach(input => {
    input.oninput = e => {
      tagState.filters[e.target.dataset.filter] = e.target.value;
      applyFiltersAndSort();
      container.querySelector("tbody").innerHTML = renderRows();
    };
  });

  container.querySelectorAll("th.sortable").forEach(th => {
    th.onclick = () => {
      const key = th.dataset.sort;
      tagState.sortState.dir =
        tagState.sortState.key === key &&
        tagState.sortState.dir === "asc"
          ? "desc"
          : "asc";
      tagState.sortState.key = key;
      applyFiltersAndSort();
      container.querySelector("tbody").innerHTML = renderRows();
    };
  });

  container.querySelector("#add-tag").onclick = () => openModal();

  container.querySelector("tbody").onclick = e => {
    const row = e.target.closest("tr");
    if (!row) return;

    const id = row.dataset.id;
    const tag = tagState.rawData.find(t => t.tag_id == id);

    if (e.target.closest(".edit-btn")) openModal(tag);
    if (e.target.closest(".delete-btn")) deleteTag(tag);
  };
}

/* ---------------- CRUD ---------------- */

function openModal(tag = null) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${tag ? "Edit" : "Add"} Tag</h3>
      <input id="tag-name" value="${tag?.name || ""}" />
      <button id="save">Save</button>
      <button id="cancel">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#cancel").onclick = () => modal.remove();

  modal.querySelector("#save").onclick = async () => {
    const name = modal.querySelector("#tag-name").value.trim();
    if (!name) return;

    await fetch(
      "/api-proxy/games/?gameSlug=blast-alpha&queryKey=tags",
      {
        method: tag ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tag ? { tagId: tag.tag_id, name } : { name })
      }
    );

    modal.remove();
    renderTagsSection(tagState.container);
  };
}

async function deleteTag(tag) {
  if (!confirm(`Delete tag "${tag.tag_name}"?`)) return;

  await fetch(
    "/api-proxy/games/?gameSlug=blast-alpha&queryKey=tags",
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId: tag.tag_id })
    }
  );

  renderTagsSection(tagState.container);
}

