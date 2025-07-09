const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface NewsMessage {
  id: number;
  headline: string;
  text: string;
  created_at: string;
  active_until: string;
  created_by: string;
  is_active: boolean;
}

export interface CreateNewsRequest {
  headline: string;
  text: string;
  active_hours: number;
}

export interface UpdateNewsRequest {
  headline: string;
  text: string;
  active_hours: number;
}

export interface NewsResponse {
  success: boolean;
  messages: NewsMessage[];
  cached_at?: number;
}

export interface CreateNewsResponse {
  success: boolean;
  message: string;
  data: NewsMessage;
}

export interface UpdateNewsResponse {
  success: boolean;
  message: string;
  data: NewsMessage;
}

export interface DeleteNewsResponse {
  success: boolean;
  message: string;
}

/**
 * API client for news operations
 */
export class NewsApiClient {
  /**
   * Get all active news messages (public endpoint)
   * @returns Active news messages
   */
  static async getActiveNews(): Promise<NewsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/news`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch active news: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all news messages for admin management (including inactive ones)
   * @param token Authentication token
   * @returns All news messages
   */
  static async getAllNews(token: string): Promise<NewsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/news/admin?token=${encodeURIComponent(token)}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all news: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new news message
   * @param token Authentication token
   * @param newsData News message data
   * @returns Created news message
   */
  static async createNews(token: string, newsData: CreateNewsRequest): Promise<CreateNewsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/news?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(newsData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to create news: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update an existing news message
   * @param token Authentication token
   * @param id News message ID
   * @param newsData Updated news message data
   * @returns Updated news message
   */
  static async updateNews(token: string, id: number, newsData: UpdateNewsRequest): Promise<UpdateNewsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/news/${id}?token=${encodeURIComponent(token)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(newsData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to update news: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a news message (soft delete)
   * @param token Authentication token
   * @param id News message ID
   * @returns Delete confirmation
   */
  static async deleteNews(token: string, id: number): Promise<DeleteNewsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/news/${id}?token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to delete news: ${response.statusText}`);
    }

    return response.json();
  }
}
