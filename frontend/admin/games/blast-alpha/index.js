const industryList = document.getElementById("industry-list");

async function loadBlastAlpha() {
    try {
        const res = await fetch("/admin-proxy/games/blast-alpha/");
        const gameData = await res.json();

        industryList.innerHTML = "";

        const grouped = {};

        gameData.forEach((hero) => {
            if (!grouped[hero.category]) {
                grouped[hero.category] = [];
            }
            grouped[hero.category].push(hero);
        });

        Object.entries(grouped).forEach(([industry, heroes]) => {
            const li = document.createElement("li");

            const heroList = heroes
                .map((hero) => {
                    const done = hero.total_movies - hero.pending_movies;
                    const statusClass = done < 10 ? "incomplete" : "complete";

                    return `<li class="${statusClass}" data-hero-id="${hero.id}">
                              <span class="hero-name">${hero.name}</span>
                              <span class="movie-count">${done}</span>
                            </li>`;
                })
                .join("");

            li.innerHTML = `
              <h3>${industry}</h3>
              <ul class="hero-sublist">
                ${heroList}
              </ul>
            `;

            industryList.appendChild(li);
        });

        industryList.querySelectorAll("li[data-hero-id]").forEach((li) => {
            li.addEventListener("click", () => {
                const heroId = li.getAttribute("data-hero-id");

                // Redirect to current path + /hero/[id]
                const baseUrl = window.location.pathname.replace(/\/$/, "");
                window.location.href = `${baseUrl}/hero/${heroId}`;
            });
        });
    } catch (err) {
        console.error("Failed to load game data:", err);
        heroes.innerHTML = "<li>Error loading data</li>";
    }
}

loadBlastAlpha();
