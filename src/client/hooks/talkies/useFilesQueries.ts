// React Query hooks for card file fetching

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';
import type { CardFile } from './types';

export function useCardFilesQuery(cardId: number | null) {
  return useQuery({
    queryKey: cardId ? queryKeys.files.card(cardId) : [],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: CardFile[] }>(
        `/api/cards/${cardId}/files`
      );
      return response.data ?? [];
    },
    enabled: cardId !== null,
    staleTime: 1000 * 60 * 5,
  });
}
