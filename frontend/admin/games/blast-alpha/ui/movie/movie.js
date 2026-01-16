import { state } from "./state.js";
import { api } from "./api.js";
import { ensureLayout } from "./dom.js";
import { renderMoviePage } from "./view.js";
import { initMovieEvents } from "./events.js";

let eventsInit = false;

export async function loadMovieDetails(movieId, heroId, movieTitle) {
  state.movieId = movieId;
  state.heroId = heroId;
  state.movieTitle = movieTitle;

  state.ui.contentSection = document.getElementById("content-section");

  ensureLayout();

  if (!eventsInit) {
    initMovieEvents();
    eventsInit = true;
  }

  const [cardsRes, tagsRes] = await Promise.all([
    api.getCards(heroId, movieId),
    api.getTags(),
  ]);

  state.cards = cardsRes || [];
  state.tags = tagsRes || [];
  state.tagsById = Object.fromEntries(
    state.tags.map(t => [String(t.id), t])
  );

  renderMoviePage();
}


