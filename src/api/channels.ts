// Base URL for the backend API
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api";

/**
 * Interface for the channels API response
 * Backend returns channels as an array of strings
 */
export interface ChannelsResponse {
  total: number;
  channels: string[];
}

/**
 * API client for channel-related operations
 */
export class ChannelApiClient {
  /**
   * Get the list of channels from the backend
   * @returns The list of channels with total count
   */
  static async getChannels(): Promise<ChannelsResponse> {
    const response = await fetch(`${API_BASE_URL}/channels`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.statusText}`);
    }
    
    return response.json();
  }
}
