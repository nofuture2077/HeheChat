// Base URL for the backend API
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api";

/**
 * API client for emote-related operations
 */
export class EmoteApiClient {
  /**
   * Get 7TV emotes for a user
   * @param userId The Twitch user ID
   * @param username The Twitch username
   * @returns The 7TV emotes for the user
   */
  static async get7TVEmotes(userId: string, username: string) {
    const response = await fetch(`${API_BASE_URL}/emotes/7tv/${userId}?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch 7TV emotes: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get channel badges and emotes
   * @param userId The Twitch user ID
   * @returns The channel badges and emotes
   */
  static async getChannelBadgesAndEmotes(userId: string) {
    const response = await fetch(`${API_BASE_URL}/emotes/channel/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel badges and emotes: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get global badges and emotes
   * @returns The global badges and emotes
   */
  static async getGlobalBadgesAndEmotes() {
    const response = await fetch(`${API_BASE_URL}/emotes/global`);
    if (!response.ok) {
      throw new Error(`Failed to fetch global badges and emotes: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get cheer emotes for a channel
   * @param userId The Twitch user ID
   * @returns The cheer emotes for the channel
   */
  static async getCheerEmotes(userId: string) {
    const response = await fetch(`${API_BASE_URL}/emotes/cheer/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cheer emotes: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get user profiles by usernames
   * @param usernames The Twitch usernames
   * @returns The user profiles
   */
  static async getUsersByNames(usernames: string[]) {
    const response = await fetch(`${API_BASE_URL}/users/bynames`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usernames })
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch users by names: ${response.statusText}`);
    }
    return response.json();
  }
}
