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
   * @returns The 7TV emotes for the user, including emoteSetId and lastModified if available
   */
  static async get7TVEmotes(userId: string, username: string) {
    const response = await fetch(`${API_BASE_URL}/emotes/7tv/${userId}?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch 7TV emotes: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get 7TV emote version information for a user
   * This is a lightweight check to see if emotes have been updated
   * @param userId The Twitch user ID
   * @returns The version information including lastModified timestamp
   */
  static async get7TVEmoteVersion(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/emotes/7tv/${userId}/version`);
      if (!response.ok) {
        // If the endpoint doesn't exist yet, return null
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch 7TV emote version: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching 7TV emote version:', error);
      return null;
    }
  }

  /**
   * Get channel badges
   * @param userId The Twitch user ID
   * @returns The channel badges
   */
  static async getChannelBadges(userId: string) {
    const response = await fetch(`${API_BASE_URL}/badges/channel/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel badges: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get channel emotes
   * @param userId The Twitch user ID
   * @returns The channel emotes
   */
  static async getChannelEmotes(userId: string) {
    const response = await fetch(`${API_BASE_URL}/emotes/channel/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch channel emotes: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get global badges
   * @returns The global badges
   */
  static async getGlobalBadges() {
    const response = await fetch(`${API_BASE_URL}/badges/global`);
    if (!response.ok) {
      throw new Error(`Failed to fetch global badges: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get global emotes
   * @returns The global emotes
   */
  static async getGlobalEmotes() {
    const response = await fetch(`${API_BASE_URL}/emotes/global`);
    if (!response.ok) {
      throw new Error(`Failed to fetch global emotes: ${response.statusText}`);
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
