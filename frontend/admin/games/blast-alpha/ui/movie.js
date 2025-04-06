import { loadHeroDetails } from "./hero.js";

const contentSection = document.getElementById("content-section");

export async function loadMovieDetails(movieId, heroId) {
  try {
    const res = await fetch(
      `/api/games/?gameSlug=blast-alpha&heroId=${heroId}&movieId=${movieId}`
    );

    if (!res.ok) {
      const message = `Error: ${res.status} - ${res.statusText}`;
      contentSection.innerHTML = `<li>${message}</li>`;
      return;
    }

    const { data: movieDetails } = await res.json();

    contentSection.innerHTML = generateMovieCards(movieDetails);
    contentSection.setAttribute("data-section", "movie");

    // Dropdown button logic
    document.querySelectorAll(".dropdown-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const dropdown = btn.closest(".dropdown");

        document.querySelectorAll(".dropdown.open").forEach((el) => {
          if (el !== dropdown) el.classList.remove("open");
        });

        dropdown.classList.toggle("open");
      });
    });

    document.addEventListener("click", (e) => {
      document.querySelectorAll(".dropdown.open").forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("open");
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".dropdown.open").forEach((dropdown) => {
          dropdown.classList.remove("open");
        });
      }
    });

    // Review flag toggle logic
    document.querySelectorAll(".review-action").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const cardId = btn.getAttribute("data-card-id");
        const needReview = btn.getAttribute("data-need-review") === "true";

        const response = await fetch(
          `/api/games/?gameSlug=blast-alpha&queryKey=card`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cardId,
              need_review: !needReview ? "TRUE" : "FALSE",
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          console.error("Failed to update review status:", data.error);
          alert("Failed to update review status.");
          return;
        }

        btn.setAttribute("data-need-review", !needReview);
        btn.textContent = !needReview ? "Mark Resolved" : "🚩 Mark for Review";

        const flag = btn
          .closest(".movie-card-details")
          .querySelector(".review-flag");
        flag.style.display = !needReview ? "inline" : "none";

        const dropdown = btn.closest(".dropdown");
        if (dropdown) dropdown.classList.remove("open");
      });
    });

    document.getElementById("back-to-movies")?.addEventListener("click", () => {
      history.pushState(
        { section: "hero", heroId },
        `Hero ${heroId}`,
        `/admin/games/blast-alpha/?heroId=${heroId}`
      );
      loadHeroDetails(heroId);
    });

    document.getElementById("add-card")?.addEventListener("click", () => {
      addOrEditCardModal(false, null, movieId, heroId);
    });

    document.querySelectorAll(".edit").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = e.target.closest(".movie-card-details");
        const cardId = card.getAttribute("data-movie-card-id");
        const name = card.querySelector("h1").textContent.trim();
        const callSign = card
          .querySelector(".call-sign-content")
          .textContent.trim();
        const abilityContent = card.querySelector(".ability-content");

        let ability1 = "";
        let ability2 = "";

        if (abilityContent) {
          const spans = abilityContent.querySelectorAll("span");
          ability1 =
            spans[0]?.textContent.replace(/^\d+\.\s*/, "").trim() || "";
          ability2 =
            spans[1]?.textContent.replace(/^\d+\.\s*/, "").trim() || "";
        }

        const type = card.querySelector(".card-type").textContent.trim();

        addOrEditCardModal(
          true,
          {
            id: cardId,
            name,
            call_sign: callSign,
            ability_text: ability1,
            ability_text2: ability2,
            type,
          },
          movieId,
          heroId
        );
      });
    });

    document.querySelectorAll(".delete").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const card = e.target.closest(".movie-card-details");
        const cardId = card.getAttribute("data-movie-card-id");
        const name = card.querySelector("h1").textContent.trim();

        const confirmed = confirm(
          `Are you sure you want to delete the card "${name}"? This action cannot be undone.`
        );

        if (!confirmed) {
          return;
        }

        const response = await fetch(
          `/api/games/?gameSlug=blast-alpha&queryKey=card`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cardId,
            }),
          }
        );
        const message = await response.json();
        if (!response.ok) {
          console.error("Failed to delete card:", message.error);
          alert("Failed to delete card.");
          return;
        }
        await loadMovieDetails(movieId, heroId);
      });
    });
  } catch (error) {
    console.error("Error loading movie details:", error);
    contentSection.innerHTML = `<p>Error loading movie details: ${error.message}</p>`;
  }
}

function generateMovieCards(movieDetails = []) {
  const cards = movieDetails
    .map(
      (detail) => `
    <div class="movie-card-details" data-movie-card-id="${detail.id}">
      <div class="card-header">
        <span class="card-type">${detail.type}</span>
        <div class="card-actions">
          <button class="review-flag" style="display: ${
            detail.needsReview ? "inline" : "none"
          };" title="Needs Review">🚩</button>
          <button class="edit" title="Edit Card">✏️</button>
          <div class="dropdown">
            <button class="dropdown-button">⋮</button>
            <div class="dropdown-content">
              <button class="review-action" data-card-id="${
                detail.id
              }" data-need-review="${detail.need_review === "TRUE"}">${
        detail.need_review === "TRUE" ? "Mark Resolved" : "🚩 Mark for Review"
      }</button>
              <button class="delete" data-movie-id="${
                detail.id
              }" title="Delete Card">🗑️ Delete</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <h1>${detail.name}</h1>
        <h4>Call Sign:</h4>
        <span class="call-sign-content">${detail.call_sign || ""}</span>
        <h4>Ability:</h4>
        <div class="ability-content">
          <span>1. ${detail.ability_text ?? "No ability text available"}</span>
          ${
            detail.ability_text2
              ? `<br /><span>2. ${detail.ability_text2}</span>`
              : ""
          }
        </div>
      </div>
    </div>
  `
    )
    .join("");

  return `
    <div class="title-header">
      <h2>Movie Details</h2>
      <button id="back-to-movies">Back to Movies</button>
      <button id="add-card">Add Card</button>
    </div>
    <div class="movie-cards-container">
      ${cards || "<p>No movie cards found.</p>"}
    </div>
  `;
}

const cardTypes = ["NONE", "HERO", "VILLAIN", "SR1", "SR2", "WC"];

function addOrEditCardModal(editFlag, editData = null, movieId, heroId) {
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Movie Card</h2>
      <form id="movie-card-form">
        <label for="card-type">Card Type:</label>
        <select id="card-type" name="card-type" required>
          ${cardTypes
            .map(
              (type) =>
                `<option value="${type}" ${
                  editFlag
                    ? editData.type === type
                      ? "selected"
                      : ""
                    : type === "NONE"
                    ? "selected"
                    : ""
                }>${type}</option>`
            )
            .join("")}
        </select>
        <label for="card-name">Card Name:</label>
        <input type="text" id="card-name" name="card-name" required value="${
          editFlag ? editData.name || "" : ""
        }">
        <label for="call-sign">Call Sign (Optional):</label>
        <input type="text" id="call-sign" name="call-sign" value="${
          editFlag ? editData.call_sign || "" : ""
        }">
        <label for="ability1">Ability 1:</label>
        <input type="text" id="ability1" name="ability1" required value="${
          editFlag ? editData.ability_text || "" : ""
        }">
        <label for="ability2">Ability 2 (Optional):</label>
        <input type="text" id="ability2" name="ability2" value="${
          editFlag ? editData.ability_text2 || "" : ""
        }">
        <span id="card-type-error" style="color: red;"></span>
        <button type="submit">${editFlag ? "Update" : "Add"} Card</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").onclick = function () {
    modal.remove();
  };

  modal.querySelector("#movie-card-form").onsubmit = async function (e) {
    e.preventDefault();
    const cardType = e.target["card-type"].value;
    const cardName = e.target["card-name"].value;
    const callSign = e.target["call-sign"].value;
    const ability1 = e.target["ability1"].value;
    const ability2 = e.target["ability2"]?.value || ""; // Get ability2 value, if it exists

    if (cardType === "NONE") {
      const errorSpan = modal.querySelector("#card-type-error");
      errorSpan.textContent = "Card Type cannot be NONE.";
      return;
    }

    if (editFlag) {
      // Call API to update card
      const response = await fetch(
        `/api/games/?gameSlug=blast-alpha&queryKey=card`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cardId: editData.id,
            movieId,
            heroId,
            type: cardType,
            name: cardName,
            call_sign: callSign,
            ability_text: ability1,
            ability_text2: ability2,
          }),
        }
      );
      const message = await response.json();
      if (!response.ok) {
        console.error("Failed to update card:", message.error);
        alert("Failed to update card.");
        return;
      }
      await loadMovieDetails(movieId, heroId);
    } else {
      // Call API to add new card
      const response = await fetch(
        `/api/games/?gameSlug=blast-alpha&queryKey=card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            movieId,
            heroId,
            type: cardType,
            name: cardName,
            call_sign: callSign,
            ability_text: ability1,
            ability_text2: ability2,
          }),
        }
      );
      const message = await response.json();
      if (!response.ok) {
        console.error("Failed to add card:", message.error);
        alert("Failed to add card.");
        return;
      }
      await loadMovieDetails(movieId, heroId);
    }
    modal.remove();
  };

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.remove();
    }
  });

  // Add event listener for Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (document.body.contains(modal)) {
        modal.remove();
      }
    }
  });

  // Set focus on the first input
  modal.querySelector("#card-type").focus();

  document.body.style.overflow = "hidden"; // Prevent background scrolling
  modal.scrollIntoView({ behavior: "smooth" });
  document.body.style.overflow = ""; // Restore background scrolling
  return modal;
}
