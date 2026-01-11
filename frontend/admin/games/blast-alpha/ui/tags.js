import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

let tagState = {
  rawData: [],
  filteredData: [],
  sortState: { key: "name", dir: "asc" },
  filters: { name: "", total_cards: "" }
};

export async function renderTagsSection() {
  const res = await fetch("/api-proxy/games/?gameSlug=blast-alpha&queryKey=tags");
  const { data } = await res.json();
  tagState.rawData = data || [];
  applyFiltersAndSort();
  renderTable();
}

/* ---------------- TABLE ---------------- */

function renderTable() {
  contentSection.innerHTML = `
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

  return tagState.filteredData.map(t => `
    <tr data-id="${t.id}">
      <td>${t.name}</td>
      <td>${t.total_cards || 0}</td>
      <td>
        <button class="edit-btn">${Icons.edit}</button>
        <button class="delete-btn">${Icons.delete}</button>
      </td>
    </tr>
  `).join("");
}

/* ---------------- SORT / FILTER ---------------- */

function th(label, key) {
  const icon =
    tagState.sortState.key === key
      ? (tagState.sortState.dir === "asc" ? Icons.sortUp : Icons.sortDown)
      : Icons.sort;

  return `<th class="sortable" data-sort="${key}">
    ${label} <span>${icon}</span>
  </th>`;
}

function filterInput(key) {
  return `<td>
    <input class="column-filter" data-filter="${key}" value="${tagState.filters[key]}" />
  </td>`;
}

function applyFiltersAndSort() {
  tagState.filteredData = tagState.rawData.filter(t =>
    Object.keys(tagState.filters).every(k =>
      String(t[k] || "").toLowerCase().includes(tagState.filters[k].toLowerCase())
    )
  );

  const { key, dir } = tagState.sortState;
  tagState.filteredData.sort((a, b) =>
    dir === "asc"
      ? String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true })
      : String(b[key]).localeCompare(String(a[key]), undefined, { numeric: true })
  );
}

/* ---------------- EVENTS ---------------- */

function attachEvents() {
  contentSection.querySelectorAll(".column-filter").forEach(i => {
    i.oninput = e => {
      tagState.filters[e.target.dataset.filter] = e.target.value;
      applyFiltersAndSort();
      contentSection.querySelector("tbody").innerHTML = renderRows();
    };
  });

  contentSection.querySelectorAll("th.sortable").forEach(th => {
    th.onclick = () => {
      const key = th.dataset.sort;
      tagState.sortState.dir =
        tagState.sortState.key === key && tagState.sortState.dir === "asc"
          ? "desc"
          : "asc";
      tagState.sortState.key = key;
      applyFiltersAndSort();
      contentSection.querySelector("tbody").innerHTML = renderRows();
    };
  });

  contentSection.querySelector("#add-tag").onclick = () => openModal();

  contentSection.querySelector("tbody").onclick = e => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;
    const tag = tagState.rawData.find(t => t.id == id);

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

    await fetch("/api-proxy/tags", {
      method: tag ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tag ? { id: tag.id, name } : { name })
    });

    modal.remove();
    renderTagsSection();
  };
}

async function deleteTag(tag) {
  if (!confirm(`Delete tag "${tag.name}"?`)) return;

  await fetch("/api-proxy/tags", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: tag.id })
  });

  renderTagsSection();
}

