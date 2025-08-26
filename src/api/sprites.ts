import { UserSpriteAssignment } from '@/commons/events';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Interface for reroll configuration
 */
export interface RerollConfig {
  channel: string;
  bitsAmount: number | null;
  donationAmount: number | null;
  enabled: boolean;
}

/**
 * Get the sprite assignment for a user in a channel
 * @param channel The channel name
 * @param username The username
 * @returns The user's sprite assignment or null if not found
 */
export const getUserSpriteAssignment = async (
  channel: string,
  username: string
): Promise<UserSpriteAssignment | null> => {
  try {
    const response = await fetch(`${BASE_URL}/api/user-sprite/${channel}/${username}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // No assignment found, which is a valid state
        return null;
      }
      throw new Error(`Failed to fetch sprite assignment: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user sprite assignment:', error);
    return null;
  }
};

/**
 * Save a new sprite assignment for a user
 * @param channel The channel name
 * @param username The username
 * @param filename The selected sprite filename
 * @returns Success status
 */
export const saveUserSpriteAssignment = async (
  channel: string,
  username: string,
  filename: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/api/user-sprite/${channel}/${username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedFilename: filename }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save sprite assignment: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user sprite assignment:', error);
    return false;
  }
};

/**
 * Complete a pending reroll for a user
 * @param channel The channel name
 * @param username The username
 * @param newFilename The newly selected filename
 * @returns Success status
 */
export const completeReroll = async (
  channel: string,
  username: string,
  newFilename: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/api/user-sprite/${channel}/${username}/complete-reroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newFilename }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete reroll: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error completing reroll:', error);
    return false;
  }
};

/**
 * Manually trigger a reroll for a user (for testing)
 * @param channel The channel name
 * @param username The username
 * @returns Success status and whether a reroll is now pending
 */
export const triggerReroll = async (
  channel: string,
  username: string
): Promise<{ success: boolean; rerollPending: boolean }> => {
  try {
    const response = await fetch(`${BASE_URL}/api/user-sprite/${channel}/${username}/trigger-reroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'manual' }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger reroll: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      rerollPending: result.rerollPending || false,
    };
  } catch (error) {
    console.error('Error triggering reroll:', error);
    return {
      success: false,
      rerollPending: false,
    };
  }
};

/**
 * Get the reroll configuration for a channel
 * @param channel The channel name
 * @returns The channel's reroll configuration
 */
export const getRerollConfig = async (channel: string): Promise<RerollConfig | null> => {
  try {
    const state = localStorage.getItem('hehe-token_state') || '';
    const response = await fetch(`${BASE_URL}/api/user-sprite/reroll-config/${channel}?token=${state}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reroll config: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reroll config:', error);
    return null;
  }
};

/**
 * Update the reroll configuration for a channel
 * @param channel The channel name
 * @param config The updated configuration
 * @returns Success status and updated configuration
 */
export const updateRerollConfig = async (
  channel: string,
  config: {
    bitsAmount: number | null;
    donationAmount: number | null;
    enabled: boolean;
  }
): Promise<{ success: boolean; config?: RerollConfig }> => {
  try {
    const state = localStorage.getItem('hehe-token_state') || '';
    const response = await fetch(`${BASE_URL}/api/user-sprite/reroll-config/${channel}?token=${state}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update reroll config: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      config: result
    };
  } catch (error) {
    console.error('Error updating reroll config:', error);
    return {
      success: false
    };
  }
};
