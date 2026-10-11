import {
  Stack,
  Fieldset,
  TagsInput,
  Alert,
  Text,
  SegmentedControl,
  Switch,
  Group,
  Badge,
} from '@mantine/core';
import { useContext, useMemo } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { ConfigContext, LoginContextContext } from '@/ApplicationContext';
import { ColorSchemeToggle } from '../../colorscheme/colorscheme';
import { useChannels } from '@/hooks/useChannels';

export function GeneralUISettings() {
  const config = useContext(ConfigContext);
  const login = useContext(LoginContextContext);
  const ownMode = config.channelMode === 'own';
  const ownName = login.user?.name;

  const setMode = (mode: string) => {
    if (mode === 'own' && ownName) {
      config.patchConfig({
        channelMode: 'own',
        manualChannels: config.channels,
        channels: [ownName],
      });
    } else if (mode === 'manual') {
      config.patchConfig({
        channelMode: 'manual',
        channels: config.manualChannels?.length ? config.manualChannels : config.channels,
      });
    }
  };
  const { channels: authorizedChannels, loading } = useChannels();

  const unauthorizedChannels = useMemo(() => {
    if (loading || !authorizedChannels || !config.channels || config.channels.length === 0) {
      return [];
    }
    return config.channels.filter(
      (configChannel) =>
        !authorizedChannels.some((channel) => channel.toLowerCase() === configChannel.toLowerCase())
    );
  }, [authorizedChannels, config.channels, loading]);

  return (
    <Stack mt={30} mb={30} gap={20}>
      <ColorSchemeToggle />
      <Fieldset legend="Channels" variant="filled">
        <Stack gap="sm">
          <SegmentedControl
            value={ownMode ? 'own' : 'manual'}
            onChange={setMode}
            data={[
              { label: 'My Channel', value: 'own', disabled: !ownName },
              { label: 'Manual Channel(s)', value: 'manual' },
            ]}
          />
          {ownMode ? (
            <>
              <Group gap="xs">
                {config.channels.map((c) => (
                  <Badge key={c} variant={c === ownName ? 'filled' : 'light'}>
                    {c}
                  </Badge>
                ))}
              </Group>
              <Switch
                label="Use Shared Chat"
                description="Automatically add and remove channels from your Twitch Shared Chat session."
                checked={!!config.useSharedChat}
                onChange={(e) => config.patchConfig({ useSharedChat: e.currentTarget.checked })}
              />
            </>
          ) : (
            <TagsInput
              placeholder="Add a channel…"
              value={config.channels}
              onChange={(channels) =>
                config.setChannels(channels.map((c) => c.toLowerCase().substring(0, 25).trim()))
              }
            />
          )}
          {unauthorizedChannels.length > 0 ? (
            <Alert
              variant="light"
              color="orange"
              title="Missing Authorization"
              icon={<IconInfoCircle />}
            >
              Some channels ({unauthorizedChannels.join(', ')}) have not authorized hehechat yet.
              Please ask them to join or going into a shared chat to see their messages.
            </Alert>
          ) : (
            <Text size="xs" c="dimmed">
              Channels determine which Twitch chats you read and which alerts you receive.
            </Text>
          )}
        </Stack>
      </Fieldset>
    </Stack>
  );
}
