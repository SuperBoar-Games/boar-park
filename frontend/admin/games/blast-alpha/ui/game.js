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
            const done = hero.total_movies - hero.pending_movies;
            const statusClass = done < 10 ? "incomplete" : "complete";
            return `
          <li class="${statusClass}" data-hero-id="${hero.id}">
            <div class="hero-header">
              <span class="hero-name">${hero.name}</span>
              <span class="movie-count">${done}</span>
            </div>
            <div class="card-actions">
              <button class="edit" title="Edit Hero">✏️</button>
              <button class="delete" data-hero-id="${hero.id}" title="Delete Hero">🗑️</button>
            </div>
          </li>`;
          })
          .join("");

        return `
        <div class="industry-header" data-industry="${industry}">
          <h3>${industry}</h3>
          <button class="add-hero" data-industry="${industry}">Add Hero</button>
        </div>
        <ul class="hero-sublist">${heroList}</ul>
      `;
      })
      .join("");

    contentSection.innerHTML = `
      <h2>Blast Alpha</h2>
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
        alert(`TODO: Open Edit Hero modal for hero ID: ${heroId}`);
        // Here you'd call a modal like: openHeroModal(heroId);
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
        alert(`TODO: Open Add Hero modal for industry: ${industry}`);
        // Here you'd call a modal like: openHeroModal(industry);
      });
    });
  } catch (error) {
    console.error("Failed to render game section", error);
    contentSection.innerHTML = "<p>Error loading game data.</p>";
  }
}
