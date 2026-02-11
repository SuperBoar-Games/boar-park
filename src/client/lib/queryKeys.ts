// Hierarchical query key structure for precise cache invalidation

export const queryKeys = {
  // Talkies game
  talkies: {
    all: ['talkies'] as const,
    heroes: () => [...queryKeys.talkies.all, 'heroes'] as const,
    hero: (heroId: number) => [...queryKeys.talkies.heroes(), heroId] as const,
    movies: (heroId: number) => [...queryKeys.talkies.hero(heroId), 'movies'] as const,
    cards: (heroId: number, movieId?: number) =>
      movieId
        ? [...queryKeys.talkies.hero(heroId), 'cards', movieId] as const
        : [...queryKeys.talkies.hero(heroId), 'cards'] as const,
    tags: {
      all: () => [...queryKeys.talkies.all, 'tags'] as const,
      hero: (heroId: number) => [...queryKeys.talkies.all, 'tags', heroId] as const,
    },
  },

  // Admin
  admin: {
    all: ['admin'] as const,
    users: () => [...queryKeys.admin.all, 'users'] as const,
    user: (userId: number) => [...queryKeys.admin.users(), userId] as const,
    roles: () => [...queryKeys.admin.all, 'roles'] as const,
    games: () => [...queryKeys.admin.all, 'games'] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
} as const;
