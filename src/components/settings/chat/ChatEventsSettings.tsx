import { Switch, Stack, Fieldset, Alert, Select } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { SystemMessageMainType } from '@/commons/message';

const eventMainTypeValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'streamOnline', 'streamOffline', 'channelPointRedemption', 'blerp', 'kofi', 'streak'];

const Messages: Record<string, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Subs",
    "raid": "Raids",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "streamOnline": "Online Message",
    "streamOffline": "Offline Message",
    "channelPointRedemption": "Channel Points",
    "blerp": "Blerps",
    "kofi": "Ko-fi Events",
    "streak": "Viewer Streak"
};

export function ChatEventsSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Recent Events Panel" variant="filled">
                <Stack>
                    <Select
                        label="Show latest events above chat"
                        data={['Off', '2', '3', '4', '5']}
                        value={config.recentEventsCount === 0 ? 'Off' : config.recentEventsCount + ''}
                        onChange={(value) => { config.setRecentEventsCount(value === 'Off' ? 0 : Number(value)); forceUpdate(); }}
                    />
                </Stack>
            </Fieldset>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Control which Twitch and platform events appear as messages directly in your chat feed. Disable event types you don't want cluttering your chat view — they can still trigger alerts independently.
            </Alert>
            <Fieldset legend="Event Messages" variant='filled'>
                <Stack>
                    {eventMainTypeValues.map(eventType => (
                        <Switch
                            key={eventType}
                            checked={config.systemMessageInChat[eventType]}
                            onChange={(event) => { config.setSystemMessageInChat(eventType, event.currentTarget.checked); forceUpdate(); }}
                            label={Messages[eventType]}
                            size="lg"
                        />
                    ))}
                </Stack>
            </Fieldset>

        </Stack>
    );
}
