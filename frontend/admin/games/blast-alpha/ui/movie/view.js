import { Icons } from "../../../../../components/icons.js";
import { state } from "./state.js";
import { attachTagEditor } from "./tags.js";


export function renderMoviePage() {
  renderHeader();
  renderCards();
}

function renderHeader() {
  const header = state.ui.contentSection.querySelector(".title-header");

  header.innerHTML = `
    <h2>${state.movieTitle || "Movie Details"}</h2>
    <div class="header-actions">
      <button id="back-to-hero">Back</button>
      <button id="add-card">Add Card</button>
    </div>
  `;
}

function renderCards() {
  const wrap = state.ui.cardsContainer;
  wrap.replaceChildren();

  if (!state.cards.length) {
    wrap.innerHTML = `<p class="empty-state">No movie cards found.</p>`;
    return;
  }

  state.cards.forEach(card => wrap.append(cardEl(card)));
}

function cardEl(card) {
  const el = document.createElement("div");
  el.className = "movie-card-details";
  el.dataset.cardId = card.id;

  el.innerHTML = `
    <div class="card-header">
      <span class="card-type">${card.type}</span>
      <div class="card-actions">
        <button class="review-action" data-review="${card.need_review === "T"}">
          ${card.need_review === "T" ? Icons.flagSolid : Icons.flagRegular}
        </button>
        <button class="edit">${Icons.edit}</button>
        <button class="delete">${Icons.delete}</button>
      </div>
    </div>

    <div class="card-body">
      <h1>${card.name}</h1>
      
      <h4>Call Sign:</h4>
      <span class="call-sign-content">${card.call_sign || ""}</span>

      <h4>Ability:</h4>
      <div class="ability-content">
        <span>1. ${card.ability_text || ""}</span>
        ${
          card.ability_text2
            ? `<br /><span>2. ${card.ability_text2}</span>`
            : ""
        }
      </div>

      <div class="card-footer">
        <div class="card-tags">
          <label>Tags</label>
          <div class="tags-list"></div>
          <button type="button" class="add-tag-button">Add Tag</button>
        </div>
      </div>
     </div>
  `;

  const tagContainer = el.querySelector(".card-tags");

  attachTagEditor(tagContainer, card);

  return el;
}

export function appendCard(card) {
  state.cards.push(card);
  state.ui.cardsContainer.append(cardEl(card));
}

export function updateCard(card) {
  const idx = state.cards.findIndex(c => c.id === card.id);
  if (idx !== -1) state.cards[idx] = card;

  const el = state.ui.cardsContainer.querySelector(
    `[data-card-id="${card.id}"]`
  );
  if (!el) return;

  const replacement = cardEl(card);
  el.replaceWith(replacement);
}

export function removeCard(cardId) {
  state.cards = state.cards.filter(c => c.id !== cardId);
  state.ui.cardsContainer
    .querySelector(`[data-card-id="${cardId}"]`)
    ?.remove();
}
