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
    users: {
      all: ['admin', 'users'] as const,
      detail: (userId: number) => ['admin', 'users', userId] as const,
    },
    roles: () => [...queryKeys.admin.all, 'roles'] as const,
    games: () => [...queryKeys.admin.all, 'games'] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    currentUser: ['auth', 'currentUser'] as const,
    permissions: ['auth', 'permissions'] as const,
  },

  // Roles & Permissions
  roles: {
    all: ['roles'] as const,
    permissions: {
      all: ['roles', 'permissions'] as const,
      detail: (permissionId: number) => ['roles', 'permissions', permissionId] as const,
    },
    roles: {
      all: ['roles', 'system-roles'] as const,
      detail: (roleId: number) => ['roles', 'system-roles', roleId] as const,
    },
    rolesWithPermissions: ['roles', 'system-roles-with-permissions'] as const,
    usersWithRoles: ['roles', 'users-with-roles'] as const,
    userPermissions: (userId: number) => ['roles', 'user-permissions', userId] as const,
    impersonationState: ['roles', 'impersonation-state'] as const,
  },
} as const;
