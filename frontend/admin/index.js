const heroes = document.getElementById("heroes");

async function loadHeroes() {
    try {
        const res = await fetch("/admin-proxy/games/blast-alpha/heroes");
        const heroesData = await res.json();

        heroes.innerHTML = "";

        heroesData.forEach((hero) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${hero.name}</strong>
                <div class="actions">
                    <a href="#">Open</a>
                </div>
            `;
            heroes.appendChild(li);
        });
    } catch (err) {
        console.error("Failed to load heroes:", err);
        heroes.innerHTML = "<li>Error loading data</li>";
    }
}

loadHeroes();
