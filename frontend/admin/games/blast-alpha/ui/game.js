import { fetchData } from "../api.js";
import { loadHeroDetails } from "./hero.js";

const contentSection = document.getElementById("content-section");

export async function renderGameSection() {
  try {
    const gameData = await fetchData(
      "/admin-proxy/games/?gameSlug=blast-alpha"
    );

    const grouped = gameData.reduce((acc, hero) => {
      acc[hero.category] = acc[hero.category] || [];
      acc[hero.category].push(hero);
      return acc;
    }, {});

    const industryHTML = Object.entries(grouped)
      .map(([industry, heroes]) => {
        const heroList = heroes
          .map((hero) => {
            return `
          <li class="hero-card ${
            hero.done?.toLowerCase() || "unknown"
          }" data-hero-id="${hero.id}">
            <div class="hero-header">
              <span class="hero-name">${hero.name}</span>
            </div>
            <div class="hero-details">
              <h5># Movies: ${hero.total_movies - hero.pending_movies || 0}</h5>
              <h5># Cards: ${hero.cards || 0}</h5>
            </div>
            <div class="card-actions">
              <button class="edit" title="Edit Hero">✏️</button>
              <button class="delete" data-hero-id="${
                hero.id
              }" title="Delete Hero">🗑️</button>
            </div>
          </li>`;
          })
          .join("");

        return `
        <div class="industry-header" data-industry="${industry}">
          <h3>${industry}</h3>
        </div>
        <ul class="hero-sublist">${heroList}</ul>
      `;
      })
      .join("");

    contentSection.innerHTML = `
      <div class="title-header">
        <h2>Blast Alpha</h2>
        <button class="add-hero">Add Hero</button>
      </div>
      <section id="game-section">
        <ul id="industry-list">${industryHTML}</ul>
      </section>
    `;
    contentSection.setAttribute("data-section", "game");

    document.querySelectorAll(".delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevent parent click
        const heroId = btn.getAttribute("data-hero-id");
        const heroName = btn
          .closest("li")
          .querySelector(".hero-name")
          .textContent.trim();
        const confirmed = confirm(
          "Are you sure you want to delete the hero: " + heroName + "?"
        );
        if (!confirmed) return;

        // try {
        //   await deleteData(
        //     `/admin-proxy/games/?gameSlug=blast-alpha&heroId=${heroId}`
        //   );
        //   await renderGameSection(); // reload updated list
        // } catch (err) {
        //   console.error("Hero deletion failed:", err);
        //   alert("Failed to delete hero.");
        // }
      });
    });

    // Edit Hero button (not implemented)
    document.querySelectorAll(".edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent parent click
        const heroId = btn.closest("li").getAttribute("data-hero-id");
        const heroName = btn
          .closest("li")
          .querySelector(".hero-name")
          .textContent.trim();

        // Traverse up to the 'ul#industry-list' and then find the preceding 'div.industry-header'
        const industryHeader = btn
          .closest("ul#industry-list")
          .querySelector(`div.industry-header[data-industry]`);

        const industry = industryHeader
          ? industryHeader.getAttribute("data-industry")
          : null;

        const heroData = {
          id: heroId,
          name: heroName,
          industry: industry,
        };
        // Open modal for editing hero
        addOrEditHeroModal(true, heroData);
      });
    });

    // Hero click handler
    document
      .querySelectorAll("#industry-list li[data-hero-id]")
      .forEach((li) => {
        li.addEventListener("click", async () => {
          const heroId = li.getAttribute("data-hero-id");
          const heroName = li.querySelector(".hero-name").textContent.trim();
          await loadHeroDetails(heroId, heroName);
          history.pushState(
            { section: "hero", heroId },
            `Hero ${heroId}`,
            `/admin/games/blast-alpha/?heroId=${heroId}`
          );
        });
      });

    // Add Hero buttons (one per industry)
    document.querySelectorAll(".add-hero").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const industry = e.target.getAttribute("data-industry");
        // Open modal for adding new hero
        addOrEditHeroModal(industry, false);
      });
    });
  } catch (error) {
    console.error("Failed to render game section", error);
    contentSection.innerHTML = "<p>Error loading game data.</p>";
  }
}

function addOrEditHeroModal(editFlag, editData = null) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Hero</h2>
      <form id="hero-form">
        <label for="hero-name">Hero Name:</label>
        <input type="text" id="hero-name" name="hero-name" required value="${
          editFlag ? editData.name : ""
        }">
        <label for="hero-industry">Industry:</label>
        <input type="text" id="hero-industry" name="hero-industry" required value="${
          editFlag ? editData.industry : ""
        }">
        <button type="submit">${editFlag ? "Update" : "Add"} Hero</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").onclick = function () {
    modal.remove();
  };

  modal.querySelector("#hero-form").onsubmit = function (e) {
    e.preventDefault();
    const heroName = e.target["hero-name"].value;
    const heroIndustry = e.target["hero-industry"].value;
    if (editFlag) {
      // Call API to update hero
      console.log(
        `Updating hero: ${editData.id}, Name: ${heroName}, Industry: ${heroIndustry}`
      );
    } else {
      // Call API to add new hero
      console.log(
        `Adding new hero: Name: ${heroName}, Industry: ${heroIndustry}`
      );
    }
    modal.remove();
  };

  modal.querySelector(".close").onclick = function () {
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

  modal.querySelector("#hero-name").focus();
  modal.querySelector("#hero-name").select();
  document.body.style.overflow = "hidden"; // Prevent background scrolling
  modal.scrollIntoView({ behavior: "smooth" });
  document.body.style.overflow = ""; // Restore background scrolling
  return modal;
}
