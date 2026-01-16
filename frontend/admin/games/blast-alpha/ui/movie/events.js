import { state } from "./state.js";
import { api } from "./api.js";
import { removeCard } from "./view.js";
import { openCardModal } from "./modals.js";
import { loadHeroDetails } from "../hero/hero.js";
import { Icons } from "../../../../../components/icons.js"

export function initMovieEvents() {
  const root = state.ui.contentSection;

  root.addEventListener("click", async (e) => {
    if (e.target.closest("#back-to-hero")) {
      console.log("Back to hero clicked, heroId:", state.heroId);
      history.pushState(
        { section: "hero", heroId: state.heroId },
        "",
        `/admin/games/blast-alpha/?heroId=${state.heroId}`
      );
      loadHeroDetails(state.heroId);
      return;
    }

    if (e.target.closest("#add-card")) {
      openCardModal({ edit: false });
      return;
    }

    const cardEl = e.target.closest("[data-card-id]");
    if (!cardEl) return;

    const cardId = Number(cardEl.dataset.cardId);
    const card = state.cards.find(c => c.id === cardId);
    if (!card) return;

    if (e.target.closest(".delete")) {
      if (!confirm("Delete this card?")) return;
      const deleted = await api.deleteCard(cardId);
      const idToRemove = deleted?.id;
      removeCard(idToRemove);
    }

    if (e.target.closest(".edit")) {
      openCardModal({ edit: true, data: card });
    }

    if (e.target.closest(".review-action")) {
      const needReview = card.need_review === "T";
      await api.toggleReview(cardId, needReview);
      card.need_review = needReview ? "F" : "T";
      
      const btn = e.target.closest(".review-action");
      btn.dataset.review = String(!needReview);
      btn.innerHTML = needReview ? Icons.flagRegular : Icons.flagSolid;
    }
  });
}

