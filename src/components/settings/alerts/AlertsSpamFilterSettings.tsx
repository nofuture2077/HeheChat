import { Stack, Switch, Fieldset, Alert, Checkbox, NumberInput } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function AlertsSpamFilterSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Skip spammy/repetitive text before it reaches TTS for cheers, channel point redemptions, donations and !tts. When disabled, no filtering happens at all.
            </Alert>
            <Fieldset legend="Smart Filter" variant='filled'>
                <Stack gap="xs">
                    <Switch
                        checked={config.alertSmartFilter.enabled}
                        onChange={(event) => { config.setAlertSmartFilter({ enabled: event.currentTarget.checked }); forceUpdate(); }}
                        label="Enable Smart Filter"
                        size="lg"
                    />
                    {config.alertSmartFilter.enabled && (
                        <Stack gap="xs" ml="md">
                            <Checkbox
                                checked={config.alertSmartFilter.skipLinks}
                                onChange={(event) => { config.setAlertSmartFilter({ skipLinks: event.currentTarget.checked }); forceUpdate(); }}
                                label="Skip messages with links"
                            />
                            <Checkbox
                                checked={config.alertSmartFilter.skipSpam}
                                onChange={(event) => { config.setAlertSmartFilter({ skipSpam: event.currentTarget.checked }); forceUpdate(); }}
                                label="Skip repetitive/spam messages"
                                description='e.g. "br br br br", copy-pasted messages'
                            />
                            <Checkbox
                                checked={config.alertSmartFilter.skipShort}
                                onChange={(event) => { config.setAlertSmartFilter({ skipShort: event.currentTarget.checked }); forceUpdate(); }}
                                label="Skip short messages"
                            />
                            {config.alertSmartFilter.skipShort && (
                                <NumberInput
                                    ml="md"
                                    w={140}
                                    label="Min. words"
                                    min={1}
                                    max={20}
                                    value={config.alertSmartFilter.minWords}
                                    onChange={(value) => { config.setAlertSmartFilter({ minWords: Number(value) }); forceUpdate(); }}
                                />
                            )}
                            <Checkbox
                                checked={config.alertSmartFilter.skipLong}
                                onChange={(event) => { config.setAlertSmartFilter({ skipLong: event.currentTarget.checked }); forceUpdate(); }}
                                label="Skip long messages"
                            />
                            {config.alertSmartFilter.skipLong && (
                                <NumberInput
                                    ml="md"
                                    w={140}
                                    label="Max. words"
                                    min={1}
                                    max={200}
                                    value={config.alertSmartFilter.maxWords}
                                    onChange={(value) => { config.setAlertSmartFilter({ maxWords: Number(value) }); forceUpdate(); }}
                                />
                            )}
                        </Stack>
                    )}
                </Stack>
            </Fieldset>
        </Stack>
    );
}
