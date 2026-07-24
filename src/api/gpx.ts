// Base URL for the backend API
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api";

/**
 * API client for GPX track related operations
 */
export class GpxApiClient {
  /**
   * Upload a GPX file
   * @param token The auth token
   * @param file The GPX file to upload
   */
  static async upload(token: string, file: File) {
    const formData = new FormData();
    formData.append('gpx', file);
    const response = await fetch(`${API_BASE_URL}/gpx/upload?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  }

  /**
   * Get (or auto-create) the per-user token authenticating the cycling-hud websocket client
   * @param token The auth token
   */
  static async client(token: string) {
    const response = await fetch(`${API_BASE_URL}/gpx/client?token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<{ token: string }>;
  }

  /**
   * List uploaded GPX files
   * @param token The auth token
   */
  static async list(token: string) {
    const response = await fetch(`${API_BASE_URL}/gpx/list?token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  }

  /**
   * Delete a GPX file
   * @param token The auth token
   * @param id The GPX file id
   */
  static async remove(token: string, id: number) {
    const response = await fetch(`${API_BASE_URL}/gpx/${id}?token=${encodeURIComponent(token)}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  }

  /**
   * Mark a GPX file as the active one
   * @param token The auth token
   * @param id The GPX file id
   */
  static async selectActive(token: string, id: number) {
    const response = await fetch(`${API_BASE_URL}/gpx/${id}/select?token=${encodeURIComponent(token)}`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as Promise<{ ok: boolean; active: { id: number } }>;
  }
}
