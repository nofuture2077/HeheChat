import { Stack, Fieldset, TagsInput, Alert, Text } from '@mantine/core';
import { useContext, useMemo } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { ColorSchemeToggle } from '../../colorscheme/colorscheme';
import { useChannels } from '@/hooks/useChannels';
import { IconInfoCircle } from '@tabler/icons-react';

export function GeneralUISettings() {
    const config = useContext(ConfigContext);
    const { channels: authorizedChannels, loading } = useChannels();

    const unauthorizedChannels = useMemo(() => {
        if (loading || !authorizedChannels || !config.channels || config.channels.length === 0) {
            return [];
        }
        return config.channels.filter(configChannel =>
            !authorizedChannels.some(channel => channel.toLowerCase() === configChannel.toLowerCase())
        );
    }, [authorizedChannels, config.channels, loading]);

    return (
        <Stack mt={30} mb={30} gap={20}>
            <ColorSchemeToggle />
            <Fieldset legend="Channels" variant='filled'>
                <Stack gap="sm">
                    <TagsInput
                        placeholder="Add a channel…"
                        value={config.channels}
                        onChange={(channels) => config.setChannels(channels.map(c => c.toLowerCase().substring(0, 25).trim()))}
                    />
                    {unauthorizedChannels.length > 0 ? (
                        <Alert variant="light" color="orange" title="Missing Authorization" icon={<IconInfoCircle />}>
                            Some channels ({unauthorizedChannels.join(', ')}) have not authorized hehechat yet. Please ask them to join or going into a shared chat to see their messages.
                        </Alert>
                    ) : (
                        <Text size="xs" c="dimmed">Channels determine which Twitch chats you read and which alerts you receive.</Text>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
