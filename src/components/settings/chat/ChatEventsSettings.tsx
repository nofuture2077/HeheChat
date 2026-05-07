import { Switch, Stack, Fieldset } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { SystemMessageMainType } from '@/commons/message';

const eventMainTypeValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'streamOnline', 'streamOffline', 'channelPointRedemption', 'blerp', 'kofi', 'streak'];
const seventTVMessages: SystemMessageMainType[] = ['sevenTVAdded', 'sevenTVRemoved'];

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
    "sevenTVAdded": "New 7TV Emotes",
    "sevenTVRemoved": "Removed 7TV Emotes",
    "blerp": "Blerps",
    "kofi": "Ko-fi Events",
    "streak": "Viewer Streak"
};

export function ChatEventsSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    return (
        <Stack mt={30} mb={30} gap={30}>
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

            <Fieldset legend="7TV Messages" variant='filled'>
                <Stack>
                    {seventTVMessages.map(eventType => (
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
