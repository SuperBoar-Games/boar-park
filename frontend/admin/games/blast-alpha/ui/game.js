import { loadHeroDetails } from "./hero.js";
import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

export async function renderGameSection() {
  try {
    const res = await fetch("/api-proxy/games/?gameSlug=blast-alpha");

    if (!res.ok) {
      const message = `Error: ${res.status} - ${res.statusText}`;
      contentSection.innerHTML = `<li>${message}</li>`;
      return;
    }

    const { data: gameData } = await res.json();

    if (!gameData?.length) {
      contentSection.innerHTML = "<p>No heroes available.</p>";
      return;
    }

    const grouped = gameData.reduce((acc, hero) => {
      acc[hero.category] = acc[hero.category] || [];
      acc[hero.category].push(hero);
      return acc;
    }, {});

    const industryList = Object.keys(grouped);

    const industryHTML = Object.entries(grouped)
      .map(([industry, heroes]) => {
        const heroList = heroes
          .map((hero) => {
            return `
          <li class="hero-card ${
            hero.done?.toLowerCase() || "unknown"
          }" data-hero-id="${hero.id}">
            <div class="hero-clickable">
              <div class="hero-header">
                <span class="hero-name">${hero.name}</span>
              </div>
              <div class="hero-details">
                <h5># Total Movies: ${hero.total_movies || 0}</h5>
                <h5># Pending Movies: ${hero.pending_movies || 0}</h5>
                <h5># Cards: ${hero.total_cards || 0}</h5>
              </div>
            </div>
            <div class="card-actions">
              <button class="edit" title="Editt Hero">
                ${Icons.edit}
              </button>
              <div class="dropdown">
                <button class="dropdown-button">⋮</button>
                <div class="dropdown-content">
                  <button class="delete" data-hero-id="${
                    hero.id
                  }" title="Delete Card">${Icons.delete} Delete</button>
                </div>
              </div>
            </div>
          </li>`;
          })
          .join("");

        return `
        <li class="industry-block">
          <div class="industry-header" data-industry="${industry}">
            <h3>${industry}</h3>
          </div>
          <ul class="hero-sublist">${heroList}</ul>
        </li>
      `;
      })
      .join("");

    contentSection.innerHTML = `
      <div class="title-header">
        <h2>Blast Alpha</h2>
        <button id="back-to-admin">Back to Admin</button>
        <button class="add-hero">Add Hero</button>
      </div>
      <section id="game-section">
        <ul id="industry-list">${industryHTML}</ul>
      </section>
    `;
    contentSection.setAttribute("data-section", "game");

    // dropdown button
    document.querySelectorAll(".dropdown-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();

        const dropdown = btn.closest(".dropdown");

        // Close all other dropdowns
        document.querySelectorAll(".dropdown.open").forEach((el) => {
          if (el !== dropdown) el.classList.remove("open");
        });

        // Toggle current one
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

        // Call API to delete hero
        const response = await fetch(
          `/api-proxy/games/?gameSlug=blast-alpha&queryKey=hero`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: heroId }),
          }
        );
        const data = await response;
        if (!response.ok) {
          console.error("Failed to delete hero:", data);
          alert("Failed to delete hero.");
          return;
        }
        // Reload the game section to reflect the deleted hero
        await renderGameSection();
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
          industryList: industryList,
        };
        // Open modal for editing hero
        addOrEditHeroModal(true, heroData);
      });
    });

    // Hero click handler
    document.querySelectorAll(".hero-clickable").forEach((li) => {
      li.addEventListener("click", async () => {
        // get heroId from the parent li
        const heroId = li.closest("li").getAttribute("data-hero-id");
        const heroName = li.querySelector(".hero-name").textContent.trim();

        await loadHeroDetails(heroId, heroName);
        history.pushState(
          { section: "hero", heroId },
          `Hero ${heroId}`,
          `/admin/games/blast-alpha/?heroId=${heroId}`
        );
      });
    });

    // Back button
    document.getElementById("back-to-admin")?.addEventListener("click", () => {
      history.pushState({ section: "game" }, "Blast Alpha", "/admin");
      // Reload
      window.location.href = "/admin";
    });

    // Add Hero buttons (one per industry)
    document.querySelectorAll(".add-hero").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const industry = e.target.getAttribute("data-industry");
        // Open modal for adding new hero
        addOrEditHeroModal(false, {
          industryList: industryList,
        });
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

  const industryOptions = editData?.industryList
    .map(
      (industry) =>
        `<option value="${industry}" ${
          editFlag && editData.industry === industry ? "selected" : ""
        }>${industry}</option>`
    )
    .join("");

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
        <select id="hero-industry" name="hero-industry" required>
          ${industryOptions}
          ${!editFlag ? '<option value="new">Add New Industry</option>' : ""}
        </select>
        ${
          !editFlag
            ? `<div id="new-industry-input" style="display: none;">
              <label for="new-industry-name">New Industry Name:</label>
              <input type="text" id="new-industry-name" name="new-industry-name">
            </div>`
            : ""
        }
        <button type="submit">${editFlag ? "Update" : "Add"} Hero</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const newIndustryInput = modal.querySelector("#new-industry-input");
  const industrySelect = modal.querySelector("#hero-industry");

  if (industrySelect) {
    industrySelect.addEventListener("change", function () {
      if (this.value === "new") {
        newIndustryInput.style.display = "block";
      } else {
        newIndustryInput.style.display = "none";
      }
    });
  }

  modal.querySelector(".close").onclick = function () {
    modal.remove();
  };

  modal.querySelector("#hero-form").onsubmit = async function (e) {
    e.preventDefault();
    const heroName = e.target["hero-name"].value;
    let heroIndustry = e.target["hero-industry"].value;

    if (heroIndustry === "new") {
      heroIndustry = e.target["new-industry-name"].value;
    }

    if (editFlag) {
      // Call API to update hero
      const response = await fetch(
        `/api-proxy/games/?gameSlug=blast-alpha&queryKey=hero`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editData.id,
            name: heroName,
            industry: heroIndustry,
          }),
        }
      );
      const data = await response;
      if (!response.ok) {
        console.error("Failed to update hero:", data);
        alert("Failed to update hero.");
        return;
      }
      // Reload the game section to reflect the updated hero
      await renderGameSection();
    } else {
      // Call API to add new hero
      const response = await fetch(
        `/api-proxy/games/?gameSlug=blast-alpha&queryKey=hero`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: heroName,
            industry: heroIndustry,
          }),
        }
      );

      const data = await response;
      if (!response.ok) {
        console.error("Failed to add new hero:", data.error);
        alert("Failed to add new hero.");
        return;
      }
      // Reload the game section to reflect the new hero
      await renderGameSection();
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

  modal.querySelector("#hero-name").focus();
  modal.querySelector("#hero-name").select();
  document.body.style.overflow = "hidden"; // Prevent background scrolling
  modal.scrollIntoView({ behavior: "smooth" });
  document.body.style.overflow = ""; // Restore background scrolling
  return modal;
}
