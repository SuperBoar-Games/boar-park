import { Icons } from "../../../../components/icons.js";

/* ================= STATE ================= */

const state = {
  raw: [],
  filtered: [],
  sort: { key: "tag_name", dir: "asc" },
  filters: { tag_name: "", card_count: "" },

  root: null,
  tbody: null,
  heroId: null,
  mounted: false,
};

/* ================= PUBLIC ================= */

export async function renderTagsSection(container, heroId) {
  if (!container) throw new Error("tags container required");

  state.root = container;
  state.heroId = heroId;

  const res = await fetch(
    `/api-proxy/games/?gameSlug=blast-alpha&queryKey=tagsCountByHero&heroId=${heroId}`
  );
  const { data } = await res.json();

  state.raw = data || [];
  apply();

  if (!state.mounted) {
    mount();
    bindEvents();
    state.mounted = true;
  }

  renderBody();
}

/* ================= RENDER ================= */

function mount() {
  state.root.innerHTML = `
    <div class="tags-header">
      <h2>Tags</h2>
      <div class="header-actions">
        <button id="add-tag">Add Tag</button>
      </div>
    </div>

    <div class="tags-table-wrapper">
      <table class="tags-table">
        <thead>
          <tr>
            ${th("Tag", "tag_name")}
            ${th("Cards", "card_count")}
            <th>Actions</th>
          </tr>
          <tr class="filters">
            ${filterInput("tag_name")}
            ${filterInput("card_count")}
            <td></td>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  state.tbody = state.root.querySelector("tbody");
}

function renderBody() {
  if (!state.filtered.length) {
    state.tbody.innerHTML =
      `<tr><td colspan="3" class="empty">No tags</td></tr>`;
    return;
  }

  state.tbody.innerHTML = state.filtered
    .map(
      t => `
      <tr data-id="${t.tag_id}">
        <td>${t.tag_name}</td>
        <td>${t.card_count || 0}</td>
        <td>
          <button class="edit">${Icons.edit}</button>
          <button class="delete">${Icons.delete}</button>
        </td>
      </tr>
    `
    )
    .join("");
}

/* ================= SORT / FILTER ================= */

function apply() {
  state.filtered = state.raw.filter(t =>
    Object.keys(state.filters).every(k =>
      String(t[k] ?? "")
        .toLowerCase()
        .includes(state.filters[k].toLowerCase())
    )
  );

  const { key, dir } = state.sort;
  state.filtered.sort((a, b) =>
    dir === "asc"
      ? String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true })
      : String(b[key]).localeCompare(String(a[key]), undefined, { numeric: true })
  );
}

function th(label, key) {
  const icon =
    state.sort.key === key
      ? state.sort.dir === "asc"
        ? Icons.sortUp
        : Icons.sortDown
      : Icons.sort;

  return `
    <th data-sort="${key}" class="sortable">
      ${label} <span>${icon}</span>
    </th>
  `;
}

function filterInput(key) {
  return `
    <td>
      <input data-filter="${key}" value="${state.filters[key]}" />
    </td>
  `;
}

/* ================= EVENTS ================= */

function bindEvents() {
  state.root.addEventListener("input", e => {
    const key = e.target.dataset.filter;
    if (!key) return;
    state.filters[key] = e.target.value;
    apply();
    renderBody();
  });

  state.root.addEventListener("click", e => {
    const sortTh = e.target.closest("th[data-sort]");
    if (sortTh) {
      const key = sortTh.dataset.sort;
      state.sort.dir =
        state.sort.key === key && state.sort.dir === "asc" ? "desc" : "asc";
      state.sort.key = key;
      apply();
      renderBody();
      syncSortIcons();
      return;
    }

    if (e.target.closest("#add-tag")) {
      openModal();
      return;
    }

    const row = e.target.closest("tr[data-id]");
    if (!row) return;

    const tag = state.raw.find(t => String(t.tag_id) === row.dataset.id);
    if (!tag) return;

    if (e.target.closest(".edit")) openModal(tag);
    if (e.target.closest(".delete")) deleteTag(tag);
  });
}

function syncSortIcons() {
  state.root.querySelectorAll("th[data-sort]").forEach(th => {
    const key = th.dataset.sort;
    const iconEl = th.querySelector("span");
    if (!iconEl) return;

    if (state.sort.key !== key) {
      iconEl.innerHTML = Icons.sort;
    } else {
      iconEl.innerHTML =
        state.sort.dir === "asc" ? Icons.sortUp : Icons.sortDown;
    }
  });
}

/* ================= CRUD ================= */

function openModal(tag = null) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${tag ? "Edit" : "Add"} Tag</h3>
      <input id="tag-name" value="${tag?.tag_name || ""}" />
      <div class="actions">
        <button id="save">Save</button>
        <button id="cancel">Cancel</button>
      </div>
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
    await renderTagsSection(state.root, state.heroId);
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

  await renderTagsSection(state.root, state.heroId);
}

export function resetTagsSection() {
  state.mounted = false;
  state.root = null;
  state.tbody = null;
}

