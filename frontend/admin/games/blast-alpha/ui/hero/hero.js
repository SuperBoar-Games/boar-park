import { renderTagsSection, resetTagsSection } from "../tags.js";
import { state } from "./state.js";
import { api } from "./api.js";
import { preserveScroll, restoreScroll } from "./dom.js";
import { filterMovies, filterCards, applySort } from "./filters.js";
import { renderTableShell, renderTbodyRows, syncHeaderControls } from "./table.js";
import { initDelegatedHandlers } from "./events.js";

const contentSection = document.getElementById("content-section");
let handlersInit = false;

function ensureLayoutContainers() {
  contentSection.replaceChildren();

  const tableContainer = document.createElement("div");
  tableContainer.className = "hero-table-container";
  contentSection.appendChild(tableContainer);

  const separator = document.createElement("div");
  separator.className = "section-separator";
  separator.innerHTML = `<hr/>`;
  contentSection.appendChild(separator);

  const tagsContainer = document.createElement("div");
  tagsContainer.className = "tags-section";
  contentSection.appendChild(tagsContainer);

  state.ui.contentSection = contentSection;
  state.ui.tableContainer = tableContainer;
  state.ui.tagsContainer = tagsContainer;
}

async function loadDataForCurrentView() {
  const res = await api.getHeroDataset(state.viewMode, state.heroId);
  const data = res.data || [];

  if (state.viewMode === "movies") state.movies = data;
  else state.cards = data;
}

async function loadTagsForFilters() {
  const tagsRes = await api.getTags();
  const rawTags = tagsRes.data || [];
  state.tags = rawTags.map((t) => t.name);
}

export function computeAndRenderBody({ syncHeader = false } = {}) {
  const base =
    state.viewMode === "movies"
      ? filterMovies(state.movies, state.filters.movies)
      : filterCards(state.cards, state.filters.cards);

  const processed = applySort(base, state.sort);

  renderTbodyRows(processed);

  if (syncHeader) syncHeaderControls();
}

export async function fullRender({ reloadData = true, reloadTags = true } = {}) {
  preserveScroll();

  // Build containers fresh only when doing a "full render"
  ensureLayoutContainers();

  // Ensure one-time delegated handlers
  if (!handlersInit) {
    initDelegatedHandlers();
    handlersInit = true;
  }

  if (reloadData) {
    try {
      await loadDataForCurrentView();
    } catch (e) {
      state.ui.tableContainer.innerHTML = `<p>Error loading data</p>`;
      return;
    }
  }

  if (reloadTags) {
    try {
      await loadTagsForFilters();
    } catch (e) {
      state.ui.tagsContainer.innerHTML = `<p>Error loading tags</p>`;
      // still render table; tags are separate
    }
  }

  // Render shell ONCE, then tbody only for changes
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

  resetTagsSection();
  await renderTagsSection(state.ui.tagsContainer, heroId);
}

