import { useState, useEffect, useContext } from 'react';
import { ChannelApiClient, type ChannelsResponse } from '@/api/channels';
import { ConfigContext } from '@/ApplicationContext';

/**
 * Custom hook to fetch and manage channels data
 */
export function useChannels() {
  const [channels, setChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const config = useContext(ConfigContext);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ChannelsResponse = await ChannelApiClient.getChannels();
      setChannels(response.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
      console.error('Error fetching channels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  return {
    channels,
    loading,
    error,
    refetch: fetchChannels,
    total: channels.length
  };
}
