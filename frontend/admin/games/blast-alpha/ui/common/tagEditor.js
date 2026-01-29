import { Icons } from "../../../../../components/icons.js";

export function createTagEditor({
  container,
  allTags,
  tagsById,
  initialTagIds,
  onChange,
  disableEditing = false,
}) {
  container.dataset.tags = initialTagIds.join(",");

  function render() {
    const list = container.querySelector(".tags-list");
    const ids = (container.dataset.tags || "").split(",").filter(Boolean);

    list.innerHTML = ids.length
      ? ids
          .map((id) => {
            const tag = tagsById[id];
            if (!tag) return "";

            return `
              <span class="tag">
                ${tag.name}
                ${
                  disableEditing
                    ? ""
                    : `
                      <button
                        class="remove-tag"
                        data-tag-id="${id}"
                        type="button"
                      >
                        ${Icons.x}
                      </button>
                    `
                }
              </span>
            `;
          })
          .join("")
      : `<span class="tag muted">No tags</span>`;

    // hide add button when editing disabled
    const addBtn = container.querySelector(".add-tag-button");
    if (addBtn) {
      addBtn.disabled = disableEditing;
      addBtn.classList.toggle("is-hidden", disableEditing);
    }
  }

  function setTags(ids, { rollback } = {}) {
    if (disableEditing) return;

    const prev = container.dataset.tags;
    container.dataset.tags = ids.join(",");
    render();
    onChange(ids, rollback, prev);
  }

  function openInput() {
    if (disableEditing) return;
    if (container.querySelector(".tag-input-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "tag-input-wrapper";

    const input = document.createElement("input");
    input.className = "tag-input";
    input.placeholder = "Add tag…";

    const dropdown = document.createElement("div");
    dropdown.className = "tag-suggestions";

    wrapper.append(input, dropdown);
    container.append(wrapper);

    let index = -1;

    const getIds = () =>
      (container.dataset.tags || "").split(",").filter(Boolean);

    function renderSuggestions() {
      const value = input.value.toLowerCase();
      const used = new Set(getIds());

      const matches = allTags
        .filter(
          (t) =>
            t.name.toLowerCase().includes(value) &&
            !used.has(String(t.id))
        )
        .slice(0, 6);

      dropdown.innerHTML = matches
        .map(
          (t, i) =>
            `<div class="suggestion" data-i="${i}" data-id="${t.id}">
              ${t.name}
            </div>`
        )
        .join("");

      index = -1;
    }

    function commit(id) {
      const ids = getIds();
      if (!ids.includes(id)) {
        setTags([...ids, id]);
      }
      close();
    }

    function close() {
      wrapper.remove();
      document.removeEventListener("mousedown", onOutside);
    }

    function onOutside(e) {
      if (!wrapper.contains(e.target)) close();
    }

    input.addEventListener("input", renderSuggestions);
    input.addEventListener("focus", renderSuggestions);

    input.addEventListener("keydown", (e) => {
      const items = dropdown.children;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        index = Math.min(index + 1, items.length - 1);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        index = Math.max(index - 1, 0);
      }

      if (e.key === "Enter" && items[index]) {
        e.preventDefault();
        commit(items[index].dataset.id);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }

      [...items].forEach((el, i) =>
        el.classList.toggle("active", i === index)
      );
    });

    dropdown.addEventListener("mousedown", (e) => {
      const id = e.target?.dataset?.id;
      if (id) commit(id);
    });

    setTimeout(() => document.addEventListener("mousedown", onOutside));
    input.focus();
  }

  container.addEventListener("click", (e) => {
    if (disableEditing) return;

    const addBtn = e.target.closest(".add-tag-button");
    if (addBtn) openInput();

    const removeBtn = e.target.closest(".remove-tag");
    if (removeBtn) {
      const id = removeBtn.dataset.tagId;
      const ids = (container.dataset.tags || "")
        .split(",")
        .filter((x) => x && x !== id);
      setTags(ids);
    }
  });

  render();
}


