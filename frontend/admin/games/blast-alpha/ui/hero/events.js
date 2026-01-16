import { loadMovieDetails } from "../movie.js";
import { renderGameSection } from "../game.js";
import { renderTagsSection } from "../tags.js";
import { Icons } from "../../../../../components/icons.js";

import { state } from "./state.js";
import { api } from "./api.js";
import { preserveScroll } from "./dom.js";
import { computeAndRenderBody, fullRender } from "./hero.js";
import { openMovieModal, openCardModal } from "./modals.js";

export function initDelegatedHandlers() {
  const root = state.ui.contentSection;

  root.addEventListener("click", async (e) => {
    const movieRowEl = e.target.closest("[data-movie-id]");
    const cardRowEl = e.target.closest("[data-card-id]");
    const movieId = movieRowEl?.dataset.movieId;
    const cardId = cardRowEl?.dataset.cardId;

    if (e.target.closest("#clear-filters")) {
      state.filters.movies = {
        title: "",
        totalMin: "",
        reviewMin: "",
        status: "all",
        needReview: "all",
      };
      state.filters.cards = {
        movieTitle: "",
        name: "",
        type: "",
        callSign: "",
        ability1: "",
        ability2: "",
        tag: "",
        needReview: "all",
      };
      state.sort = { key: null, dir: "asc" };
      computeAndRenderBody({ syncHeader: true });
      return;
    }

    if (e.target.closest("#back-to-hero")) {
      history.pushState({}, "", "/admin/games/blast-alpha");
      renderGameSection();
      return;
    }

    if (e.target.closest("#toggle-view")) {
      state.viewMode = state.viewMode === "movies" ? "cards" : "movies";
      localStorage.setItem("blastAlpha.hero.viewMode", state.viewMode);
      state.sort = { key: null, dir: "asc" };
      await fullRender({ reloadData: true, reloadTags: true });
      return;
    }

    if (e.target.closest("#add-item")) {
      if (state.viewMode === "movies") {
        openMovieModal({
          edit: false,
          data: null,
          onDone: (movie) => {
            if (!movie || !movie.id) return;
            
            state.movies.push(movie);
            computeAndRenderBody({ syncHeader: true });
          },
        });
      } else {
        openCardModal({
          edit: false,
          data: null,
          onDone: (card) => {
            if (!card) return;

            state.cards.push(card);
            computeAndRenderBody({ syncHeader: false });
          },
        });
      }
      return;
    }

    // Sorting
    const sortTh = e.target.closest("th[data-sort]");
    if (sortTh) {
      const key = sortTh.dataset.sort;
      state.sort.dir =
        state.sort.key === key && state.sort.dir === "asc" ? "desc" : "asc";
      state.sort.key = key;
      computeAndRenderBody({ syncHeader: true });
      return;
    }

    // Movies mode interactions
    if (state.viewMode === "movies") {
      if (e.target.closest(".movie-clickable") && movieId) {
        history.pushState(
          {},
          "",
          `/admin/games/blast-alpha/?heroId=${state.heroId}&movieId=${movieId}`
        );
        await loadMovieDetails(movieId, state.heroId);
        return;
      }

      const editBtn = e.target.closest(".edit");
      if (editBtn && movieId) {
        const title =
          movieRowEl.querySelector(".movie-title-row")?.textContent || "";
        openMovieModal({
          edit: true,
          data: { id: movieId, title },
          onDone: (movie) => {
            if (!movie) return;

            const idx = state.movies.findIndex(
              m => String(m.id) === String(movie.id)
            );

            if (idx >= 0) state.movies[idx] = movie;
            computeAndRenderBody({ syncHeader: false });
          },
        });
        return;
      }

      const deleteBtn = e.target.closest(".delete");
      if (deleteBtn && movieId) {
        if (!confirm("Delete this movie?")) return;
        preserveScroll();
        await api.deleteMovie(movieId);
        state.movies = state.movies.filter(
          m => String(m.id) !== String(movieId)
        );

        computeAndRenderBody({ syncHeader: false });
        return;
      }

      const reviewBtn = e.target.closest(".review-action");
      if (reviewBtn && movieId) {
        const isReviewed = reviewBtn.dataset.needReview === "true";

        // optimistic UI (same behavior)
        reviewBtn.dataset.needReview = String(!isReviewed);
        reviewBtn.innerHTML = isReviewed ? Icons.flagRegular : Icons.flagSolid;

        const row = reviewBtn.closest("tr");
        const reviewCell = row.querySelector(".need-review-cell");
        if (reviewCell) reviewCell.innerHTML = isReviewed ? "" : Icons.flagSolid;

        await api.toggleMovieReview({
          id: movieId,
          heroId: state.heroId,
          need_review: isReviewed ? "F" : "T",
        });

        // keep in-memory dataset consistent
        const m = state.movies.find((x) => String(x.id) === String(movieId));
        if (m) m.need_review = isReviewed ? "F" : "T";
        return;
      }
    }

    // Cards mode interactions
    if (state.viewMode === "cards") {
      const editBtn = e.target.closest(".edit");
      if (editBtn && cardId) {
        const card = state.cards.find((c) => String(c.id) === String(cardId));
        openCardModal({
          edit: true,
          data: card,
          onDone: (updated) => {
            if (!updated) return;

            const idx = state.cards.findIndex(
              c => String(c.id) === String(updated.id)
            );

            if (idx >= 0) state.cards[idx] = updated;
            computeAndRenderBody({ syncHeader: false });
          },
        });
        return;
      }

      const deleteBtn = e.target.closest(".delete");
      if (deleteBtn && cardId) {
        if (!confirm("Delete this card?")) return;
        preserveScroll();
        await api.deleteCard(cardId);
                state.cards = state.cards.filter(
          c => String(c.id) !== String(cardId)
        );

        computeAndRenderBody({ syncHeader: false });
      }

      const reviewBtn = e.target.closest(".review-action");
      if (reviewBtn && cardId) {
        const isReviewed = reviewBtn.dataset.needReview === "true";

        // optimistic UI
        reviewBtn.dataset.needReview = String(!isReviewed);
        reviewBtn.innerHTML = isReviewed ? Icons.flagRegular : Icons.flagSolid;

        const row = reviewBtn.closest("tr");
        const reviewCell = row.querySelector(".need-review");
        if (reviewCell) reviewCell.innerHTML = isReviewed ? "" : Icons.flagSolid;

        await api.toggleCardReview({
          cardId,
          need_review: isReviewed ? "F" : "T",
        });

        const c = state.cards.find((x) => String(x.id) === String(cardId));
        if (c) c.need_review = isReviewed ? "F" : "T";
        return;
      }
    }
  });

  // Filters (input + change)
  const onFilterChange = (e) => {
    const key = e.target.dataset.filter;
    if (!key) return;
    const [scope, field] = key.split(".");
    state.filters[scope][field] = e.target.value;
    computeAndRenderBody({ syncHeader: false }); // tbody-only update
  };

  root.addEventListener("input", onFilterChange);
  root.addEventListener("change", onFilterChange);
}

