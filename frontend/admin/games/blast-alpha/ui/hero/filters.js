export function applySort(data, sort) {
  if (!sort.key) return data;

  const dir = sort.dir === "asc" ? 1 : -1;

  return [...data].sort((a, b) => {
    const A = a[sort.key] ?? "";
    const B = b[sort.key] ?? "";
    if (A < B) return -1 * dir;
    if (A > B) return 1 * dir;
    return 0;
  });
}

export function filterMovies(data, f) {
  return data.filter((m) => {
    if (f.title && !String(m.title || "").toLowerCase().includes(f.title.toLowerCase())) return false;

    if (f.totalMin !== "" && (m.total_cards || 0) < Number(f.totalMin)) return false;
    if (f.reviewMin !== "" && (m.total_cards_need_review || 0) < Number(f.reviewMin)) return false;

    if (f.status !== "all") {
      const isDone = m.done === "T";
      if (f.status === "done" && !isDone) return false;
      if (f.status === "pending" && isDone) return false;
    }

    if (f.needReview !== "all") {
      const needs = m.need_review === "T";
      if (f.needReview === "yes" && !needs) return false;
      if (f.needReview === "no" && needs) return false;
    }

    return true;
  });
}

export function filterCards(data, f) {
  return data.filter((c) => {
    const movieTitle = String(c.movie_title || "").toLowerCase();
    const name = String(c.name || "").toLowerCase();
    const type = String(c.type || "");
    const callSign = String(c.call_sign || "").toLowerCase();
    const a1 = String(c.ability_text || "").toLowerCase();
    const a2 = String(c.ability_text2 || "").toLowerCase();
    const tags = String(c.tags || "").toLowerCase();

    if (f.movieTitle && !movieTitle.includes(f.movieTitle.toLowerCase())) return false;
    if (f.name && !name.includes(f.name.toLowerCase())) return false;
    if (f.type && type !== f.type) return false;
    if (f.callSign && !callSign.includes(f.callSign.toLowerCase())) return false;
    if (f.ability1 && !a1.includes(f.ability1.toLowerCase())) return false;
    if (f.ability2 && !a2.includes(f.ability2.toLowerCase())) return false;

    if (f.tag) {
      const wanted = f.tag.toLowerCase();
      const list = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (!list.includes(wanted)) return false;
    }

    if (f.needReview !== "all") {
      const needs = c.need_review === "T";
      if (f.needReview === "yes" && !needs) return false;
      if (f.needReview === "no" && needs) return false;
    }

    return true;
  });
}

