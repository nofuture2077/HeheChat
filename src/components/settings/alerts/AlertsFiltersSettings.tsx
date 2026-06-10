import { Stack, Switch, Fieldset, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { SystemMessageMainType } from '@/commons/message';

const hideEventsValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'streak', 'follow', 'donation', 'cheer', 'channelPointRedemption', 'blerp', 'soundalerts', 'tts'];

const Messages: Record<string, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Subs",
    "raid": "Raids",
    "streak": "Viewer Streak",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "channelPointRedemption": "Channel Points",
    "blerp": "Blerps",
    "soundalerts": "SoundAlerts",
    "tts": "!tts Events"
};

export function AlertsFiltersSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Choose which event types appear in the sidebar drawer. Events shown here are collected in real time and can be replayed later — useful for reviewing subs, raids, and donations you may have missed during your stream.
            </Alert>
            <Fieldset legend="Hide Events" variant='filled'>
                <Stack>
                    {hideEventsValues.map(eventType => (
                        <Switch
                            key={eventType}
                            checked={config.hideEvents[eventType]}
                            onChange={(event) => { config.setHideEvents(eventType, event.currentTarget.checked); forceUpdate(); }}
                            label={Messages[eventType]}
                            size="lg"
                        />
                    ))}
                    <Switch
                        checked={config.skipEmotesInTTS}
                        onChange={(event) => { config.setSkipEmotesInTTS(event.currentTarget.checked); forceUpdate(); }}
                        label="Skip emotes in TTS"
                        size="lg"
                    />
                    <Switch
                        checked={config.skipGlobalEmotesInTTS}
                        onChange={(event) => { config.setSkipGlobalEmotesInTTS(event.currentTarget.checked); forceUpdate(); }}
                        label="Skip global emotes in TTS"
                        size="lg"
                    />
                </Stack>
            </Fieldset>
        </Stack>
    );
}
