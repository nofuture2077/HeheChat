import { Switch, Stack, Fieldset, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { SystemMessageMainType } from '@/commons/message';

const seventTVMessages: SystemMessageMainType[] = ['sevenTVAdded', 'sevenTVRemoved'];

const Messages: Record<string, string> = {
    "sevenTVAdded": "New 7TV Emotes",
    "sevenTVRemoved": "Removed 7TV Emotes",
};

export function Chat7TVSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Configure how 7TV cosmetics and emote events behave in HeheChat. 7TV Badges in the OBS Browser Source can be toggled separately under Chat › Browser Source.
            </Alert>

            <Fieldset legend="7TV" variant='filled'>
                <Stack>
                    <Switch
                        checked={config.show7TVCosmetics}
                        onChange={(event) => config.setShow7TVCosmetics(event.currentTarget.checked)}
                        label="7TV Username Paints"
                        description="Cosmetics"
                        size="lg"
                    />
                    {seventTVMessages.map(eventType => (
                        <Switch
                            key={eventType}
                            checked={config.systemMessageInChat[eventType]}
                            onChange={(event) => { config.setSystemMessageInChat(eventType, event.currentTarget.checked); forceUpdate(); }}
                            label={Messages[eventType]}
                            description="Chat Events"
                            size="lg"
                        />
                    ))}
                    <Switch
                        checked={config.skip7TVEmotesInTTS}
                        onChange={(event) => { config.setSkip7TVEmotesInTTS(event.currentTarget.checked); forceUpdate(); }}
                        label="Skip 7TV emotes in TTS"
                        description="TTS"
                        size="lg"
                    />
                </Stack>
            </Fieldset>
        </Stack>
    );
}
