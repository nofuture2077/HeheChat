import { Box, Text, Loader, Alert, Button, Group, Badge } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react';
import { useChannels } from '@/hooks/useChannels';
import { useContext, useMemo } from 'react';
import { ConfigContext } from '@/ApplicationContext';

/**
 * Component that displays a list of channels fetched from the backend
 */
export function ChannelList() {
  const { channels, loading, error, refetch, total } = useChannels();
  const config = useContext(ConfigContext);
  
  // Compare fetched channels with channels in config to find unauthorized channels
  const unauthorizedChannels = useMemo(() => {
    if (!channels || !config.channels || config.channels.length === 0) {
      return [];
    }
    
    // Find channels in config that are not in the fetched channels list
    return config.channels.filter(configChannel => 
      !channels.some(channel => channel.toLowerCase() === configChannel.toLowerCase())
    );
  }, [channels, config.channels]);
  
  const hasUnauthorizedChannels = unauthorizedChannels.length > 0;

  if (loading) {
    return (
      <Box p="md">
        <Group gap="sm">
          <Loader size="sm" />
          <Text>Loading channels...</Text>
        </Group>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="md">
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Error loading channels" 
          color="red"
          mb="md"
        >
          {error}
        </Alert>
        <Button 
          leftSection={<IconRefresh size="1rem" />}
          onClick={refetch}
          variant="light"
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p="md">
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={500}>
          Channels ({total})
        </Text>
        <Button 
          leftSection={<IconRefresh size="1rem" />}
          onClick={refetch}
          variant="light"
          size="sm"
        >
          Refresh
        </Button>
      </Group>
      
      {hasUnauthorizedChannels && (
        <Alert 
          icon={<IconAlertTriangle size="1rem" />} 
          title="Unauthorized Channels" 
          color="yellow"
          mb="md"
        >
          Some channels have not authorized hehechat yet. Please ask them to join or going into a shared chat to see their messages.
        </Alert>
      )}
      
      {channels.length === 0 ? (
        <Text c="dimmed">No channels found</Text>
      ) : (
        <Box>
          {/* Display authorized channels from the API */}
          {channels.map((channel, index) => (
            <Box key={index} p="sm" mb="xs" style={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <Text fw={500}>{channel}</Text>
            </Box>
          ))}
          
          {/* Display unauthorized channels from config with yellow background */}
          {unauthorizedChannels.map((channel, index) => (
            <Box 
              key={`unauthorized-${index}`} 
              p="sm" 
              mb="xs" 
              style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '4px',
                backgroundColor: '#fffbe6' // Light yellow background
              }}
            >
              <Group justify="space-between">
                <Text fw={500}>{channel}</Text>
                <Badge color="yellow">Unauthorized</Badge>
              </Group>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
