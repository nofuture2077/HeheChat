import { useChannels } from '@/hooks/useChannels';
import { ChannelPicker, type ChannelPickerProps } from '@/components/chat/ChannelPicker';
import { Loader, Alert, Box } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

/**
 * Props for ConnectedChannelPicker, excluding channels since they're fetched automatically
 */
export interface ConnectedChannelPickerProps extends Omit<ChannelPickerProps, 'channels'> {
  // All props from ChannelPicker except 'channels'
}

/**
 * A connected version of ChannelPicker that automatically fetches channels from the backend
 */
export function ConnectedChannelPicker(props: ConnectedChannelPickerProps) {
  const { channels, loading, error } = useChannels();

  if (loading) {
    return (
      <Box w={32} h={32} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box w={32} h={32} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          color="red"
          p="xs"
          title="Error loading channels"
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Channels are already strings from the API
  const channelNames = channels;

  return (
    <ChannelPicker
      {...props}
      channels={channelNames}
    />
  );
}
