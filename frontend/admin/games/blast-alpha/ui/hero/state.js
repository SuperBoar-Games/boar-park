export const state = {
  heroId: null,
  heroName: null,

  viewMode: localStorage.getItem("blastAlpha.hero.viewMode") || "movies",

  // datasets
  movies: [],
  cards: [],
  tags: [], // array of tag names

  // sorting
  sort: { key: null, dir: "asc" },

  // filters
  filters: {
    movies: {
      title: "",
      totalMin: "",
      reviewMin: "",
      status: "all",
      needReview: "all",
    },
    cards: {
      movieTitle: "",
      name: "",
      type: "",
      callSign: "",
      ability1: "",
      ability2: "",
      tag: "",
      needReview: "all",
    },
  },

  // ui refs (set by renderer)
  ui: {
    contentSection: null,
    tableContainer: null,
    tagsContainer: null,
    tableWrapper: null,
    tableEl: null,
    tbodyEl: null,
  },

  // scroll preservation for reload operations
  scroll: {
    wrapperLeft: 0,
    wrapperTop: 0,
    pageTop: 0,
  },
};

