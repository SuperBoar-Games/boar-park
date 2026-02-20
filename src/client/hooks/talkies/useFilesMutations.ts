// React Query mutations for card file upload/delete and movie files-lock

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { queryKeys } from '../../lib/queryKeys';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

// Upload a file — uses raw fetch so browser can set multipart boundary correctly
export function useUploadFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      fileType,
      file,
    }: {
      cardId: number;
      fileType: 1 | 2 | 3;
      file: File;
    }) => {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', String(fileType));

      const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}/files`, {
        method: 'POST',
        // No Content-Type header — browser sets it with multipart boundary
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        let message = `Upload failed: ${response.statusText}`;
        try {
          const err = await response.json();
          if (err.message) message = err.message;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.card(variables.cardId) });
    },
  });
}

// Delete a file
export function useDeleteFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, fileType }: { cardId: number; fileType: 1 | 2 | 3 }) => {
      return apiClient.delete(`/api/cards/${cardId}/files/${fileType}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.card(variables.cardId) });
    },
  });
}

// Toggle files_locked on a movie
export function useToggleFilesLockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movieId, heroId }: { movieId: number; heroId: number }) => {
      return apiClient.patch(`/api/movies/${movieId}/files-lock`, {});
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talkies.movies(variables.heroId) });
    },
  });
}
