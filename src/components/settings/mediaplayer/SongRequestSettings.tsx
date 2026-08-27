import { useContext } from 'react';
import { Stack, Fieldset, Switch, TextInput, Text, Group, ActionIcon, Alert, Select } from '@mantine/core';
import { IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';
import { MusicContext, ConfigContext } from '@/ApplicationContext';

export function SongRequestSettings() {
    const music = useContext(MusicContext);
    const config = useContext(ConfigContext);

    const displayCountSetting = (
        <Select
          label="Requests shown in chat view"
          description="How many pending song requests to show in the chat's media player bar"
          data={['Off', '3', '5', '10']}
          value={config.songRequestDisplayCount === 0 ? 'Off' : `${config.songRequestDisplayCount}`}
          onChange={(value) => config.setSongRequestDisplayCount(value === 'Off' || !value ? 0 : Number(value))}
          allowDeselect={false}
        />
    );

    if (!music.connected) {
        return (
            <Stack mt={30} mb={30} gap={30}>
                <Fieldset legend="Song Requests" variant="filled">
                    {displayCountSetting}
                </Fieldset>
                <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                    Connect your Spotify account under Connect › Spotify to enable song requests.
                </Alert>
            </Stack>
        );
    }

    const pending = music.queue.filter(item => item.status === 'pending');

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Song Requests" variant="filled">
                <Stack gap="md">
                    <Switch
                      label="Enable !songrequest chat command"
                      checked={music.settings.chatCommandEnabled}
                      onChange={(event) => music.updateSettings({
                          chatCommandEnabled: event.currentTarget.checked,
                      })}
                    />
                    <Switch
                      label="Enable channel points song requests"
                      checked={music.settings.channelPointsEnabled}
                      onChange={(event) => music.updateSettings({
                          channelPointsEnabled: event.currentTarget.checked,
                      })}
                    />
                    <TextInput
                      label="Channel points reward title"
                      placeholder="Song Request"
                      value={music.settings.channelPointsRewardTitle}
                      disabled={!music.settings.channelPointsEnabled}
                      onChange={(event) => music.updateSettings({
                          channelPointsRewardTitle: event.currentTarget.value,
                      })}
                    />
                    <Switch
                      label="Auto-approve song requests"
                      description="Skip manual approval and add matched tracks straight to the Spotify queue"
                      checked={music.settings.autoApproveEnabled}
                      onChange={(event) => music.updateSettings({
                          autoApproveEnabled: event.currentTarget.checked,
                      })}
                    />
                    {displayCountSetting}
                </Stack>
            </Fieldset>

            <Fieldset legend="Pending Requests" variant="filled">
                <Stack gap="sm">
                    {pending.length === 0 && (
                        <Text size="sm" c="dimmed">No pending song requests.</Text>
                    )}
                    {pending.map(item => (
                        <Group key={item.id} justify="space-between" wrap="nowrap">
                            <Stack gap={0} style={{ minWidth: 0 }}>
                                <Text size="sm" fw={600} truncate>{item.trackName || item.query}</Text>
                                <Text size="xs" c="dimmed" truncate>
                                    requested by {item.requesterUsername}{item.artistName ? ` · ${item.artistName}` : ''}
                                </Text>
                            </Stack>
                            <Group gap={4} wrap="nowrap">
                                <ActionIcon color="green" variant="light" onClick={() => music.approve(item.id)}>
                                    <IconCheck size={16} />
                                </ActionIcon>
                                <ActionIcon color="red" variant="light" onClick={() => music.reject(item.id)}>
                                    <IconX size={16} />
                                </ActionIcon>
                            </Group>
                        </Group>
                    ))}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
