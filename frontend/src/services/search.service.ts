// Frontend client for /api/v1/search/suggest — autocomplete for the search box.
// Returns mixed results across services / specialists / categories so the UI
// can render a grouped dropdown.
import { apiClient } from './api';

export type SuggestionType = 'service' | 'specialist' | 'category';

export interface Suggestion {
  type: SuggestionType;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

class SearchService {
  /**
   * Returns suggestions for the given query (min 2 chars). Cached by the
   * server for 60s so debounced as-you-type calls stay cheap.
   */
  async suggest(q: string, limit = 5): Promise<Suggestion[]> {
    const query = q.trim();
    if (query.length < 2) return [];
    const res = await apiClient.get<{ suggestions: Suggestion[] }>('/search/suggest', {
      params: { q: query, limit },
    });
    return res.data?.suggestions ?? [];
  }
}

export const searchService = new SearchService();
