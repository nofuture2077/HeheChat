import { Box, Text, Loader, Alert, Button, Group } from '@mantine/core';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { useChannels } from '@/hooks/useChannels';

/**
 * Component that displays a list of channels fetched from the backend
 */
export function ChannelList() {
  const { channels, loading, error, refetch, total } = useChannels();

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
      
      {channels.length === 0 ? (
        <Text c="dimmed">No channels found</Text>
      ) : (
        <Box>
          {channels.map((channel, index) => (
            <Box key={index} p="sm" mb="xs" style={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <Text fw={500}>{channel}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
