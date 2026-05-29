import { TagsInput, Fieldset, Space, Alert } from '@mantine/core';
import { useContext, useMemo } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { useChannels } from '@/hooks/useChannels';
import { IconInfoCircle } from '@tabler/icons-react';

export function GeneralChannelsSection() {
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
        <Fieldset legend="Channelnames" variant='filled'>
            <TagsInput
                placeholder=""
                value={config.channels}
                onChange={(channels) => config.setChannels(channels.map(c => c.toLowerCase().substring(0, 25).trim()))}
            />
            {unauthorizedChannels.length > 0 && (
                <>
                    <Space h="xs" />
                    <Alert variant="light" color="orange" title="Missing Authorization" icon={<IconInfoCircle />}>
                        Some channels ({unauthorizedChannels.join(', ')}) have not authorized hehechat yet. Please ask them to join or going into a shared chat to see their messages.
                    </Alert>
                </>
            )}
        </Fieldset>
    );
}
