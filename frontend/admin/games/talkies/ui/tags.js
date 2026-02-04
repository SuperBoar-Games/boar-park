import { Icons } from "../../../../components/icons.js";

const state = {
  raw: [],
  filtered: [],
  sort: { key: "tag_name", dir: "asc" },
  filters: { tag_name: "", card_count: "" },
  root: null,
  tbody: null,
  heroId: null,
  mounted: false,
  modal: null
};

function handleInput(e) {
  const key = e.target.dataset.filter;
  if (!key) return;
  state.filters[key] = e.target.value;
  apply();
  renderBody();
}

async function handleClick(e) {
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

  if (e.target.closest("#clear-tag-filters")) {
    state.filters = { tag_name: "", card_count: "" };
    state.root.querySelectorAll("input[data-filter]").forEach(inp => {
      inp.value = "";
    });
    apply();
    renderBody();
    return;
  }

  const row = e.target.closest("tr[data-id]");
  if (!row) return;

  const tag = state.raw.find(t => String(t.tag_id) === row.dataset.id);
  if (!tag) return;

  if (e.target.closest(".edit")) {
    openModal(tag);
    return;
  }

  if (e.target.closest(".delete")) {
    e.preventDefault();
    await deleteTag(tag);
  }
}

export async function renderTagsSection(container, heroId) {
  if (!container) throw new Error("tags container required");

  state.root = container;
  state.heroId = heroId;

  const res = await fetch(`/api/games/talkies/tags?heroId=${heroId}`);
  const json = await res.json();

  state.raw = (json.data || []);
  apply();

  if (!state.mounted) {
    mount();
    state.mounted = true;
  }

  renderBody();
}

function mount() {
  state.root.innerHTML = `
    <div class="section-separator"></div>
    <div class="tags-header">
      <h2>Tags</h2>
      <div class="tags-header-actions">
        <button id="add-tag" class="btn-primary">${Icons.plus} <span>Add Tag</span></button>
        <button id="clear-tag-filters" class="btn-secondary">${Icons.filter} <span>Clear Filters</span></button>
      </div>
    </div>

    <div class="tags-table-wrapper">
      <table class="tags-table">
        <colgroup>
          <col style="width: 40%;" />
          <col style="width: 25%;" />
          <col style="width: 35%;" />
        </colgroup>
        <thead>
          <tr>
            ${th("Tag", "tag_name")}
            ${th("# Cards", "card_count")}
            <th>Actions</th>
          </tr>
          <tr class="filters">
            ${filterInput("tag_name")}
            ${filterInput("card_count")}
            <th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  state.tbody = state.root.querySelector("tbody");

  state.root.addEventListener("input", handleInput);
  state.root.addEventListener("click", handleClick);
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
        <td>${t.card_count ?? 0}</td>
        <td>
          <div class="tags-table-actions">
            <button class="edit">${Icons.edit}</button>
            <button class="delete">${Icons.delete}</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

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
  const placeholders = {
    tag_name: "Filter by tag name...",
    card_count: "Filter by count..."
  };
  return `
    <th>
      <input data-filter="${key}" placeholder="${placeholders[key] || 'Filter...'}" value="${state.filters[key]}" />
    </th>
  `;
}

function syncSortIcons() {
  state.root.querySelectorAll("th[data-sort]").forEach(th => {
    const key = th.dataset.sort;
    const iconEl = th.querySelector("span");
    if (!iconEl) return;

    iconEl.innerHTML =
      state.sort.key === key
        ? state.sort.dir === "asc"
          ? Icons.sortUp
          : Icons.sortDown
        : Icons.sort;
  });
}

function openModal(tag = null) {
  closeModal();

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${tag ? "Edit" : "Add"} Tag</h3>
      <input id="tag-name" value="${tag ? tag.tag_name : ""}" />
      <div class="actions">
        <button id="save">Save</button>
        <button id="cancel">Cancel</button>
      </div>
    </div>
  `;

  state.modal = modal;
  document.body.appendChild(modal);

  modal.querySelector("#cancel").onclick = closeModal;

  modal.querySelector("#save").onclick = async () => {
    const name = modal.querySelector("#tag-name").value.trim();
    if (!name) return;

    const res = await fetch(
      tag ? `/api/games/talkies/tags/${tag.tag_id}` : `/api/games/talkies/tags`,
      {
        method: tag ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      }
    );

    const json = await res.json();
    if (!json.success || !json.data) return;

    const normalized = {
      tag_id: json.data.id,
      tag_name: json.data.name,
      card_count: tag?.card_count ?? 0
    };

    if (tag) {
      const idx = state.raw.findIndex(t => t.tag_id === tag.tag_id);
      if (idx !== -1) state.raw[idx] = { ...state.raw[idx], ...normalized };
    } else {
      state.raw.push(normalized);
    }

    closeModal();
    apply();
    renderBody();
  };
}

function closeModal() {
  if (state.modal) {
    state.modal.remove();
    state.modal = null;
  }
}

async function deleteTag(tag) {
  if (!confirm(`Delete tag "${tag.tag_name}"?`)) return;

  const res = await fetch(
    `/api/games/talkies/tags/${tag.tag_id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    }
  );

  const json = await res.json();
  if (!json.success) return;

  state.raw = state.raw.filter(t => t.tag_id !== tag.tag_id);
  apply();
  renderBody();
}

export function resetTagsSection() {
  closeModal();
  state.mounted = false;
  state.root = null;
  state.tbody = null;
}

