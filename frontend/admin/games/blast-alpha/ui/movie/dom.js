import { state } from "./state.js";

export function ensureLayout() {
  const root = state.ui.contentSection;
  root.replaceChildren();

  const header = document.createElement("div");
  header.className = "title-header";

  const cards = document.createElement("div");
  cards.className = "movie-cards-container";

  root.append(header, cards);

  state.ui.cardsContainer = cards;
  return header;
}

