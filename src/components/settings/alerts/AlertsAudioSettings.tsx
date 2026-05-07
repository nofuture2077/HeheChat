import { Stack, Text, Switch, Fieldset, ActionIcon, Group, Slider } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { GradientSegmentedControl } from '../../GradientSegmentedControl/GradientSegmentedControl';
import { IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export function AlertSoundOutputSection() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();
    const [sink, setSink] = useState<string | undefined>(undefined);

    useEffect(() => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + "/sink/get?state=" + state).then(res => res.json()).then((data) => {
            setSink(data.sink);
        });
    }, []);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            notifications.show({ title: 'Copied!', message: `${label} URL copied to clipboard`, color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to copy to clipboard', color: 'red' });
        }
    };

    return (
        <Fieldset legend="Alert Sound Output" variant="filled">
            <Stack>
                <GradientSegmentedControl
                    data={[
                        { label: 'None', value: 'none' },
                        { label: 'Obs', value: 'obs' },
                        { label: 'Hehe', value: 'app' }
                    ]}
                    value={config.playAlerts ? 'app' : config.browserSourceAudio ? 'obs' : 'none'}
                    setValue={(value: string) => {
                        config.setPlayAlerts(value === 'app');
                        config.setBrowserSourceAudio(value === 'obs');
                        forceUpdate();
                    }}
                />
                <Text fs="italic" size='14px'>Select where alert sounds should be played</Text>
                {sink ? (
                    <>
                        <Group gap="xs">
                            <Text size="sm">OBS Browser Source</Text>
                            <ActionIcon variant="light" color="blue" onClick={() => copyToClipboard(import.meta.env.VITE_SINK_URL + "#token=" + sink, "OBS Browser Source")}>
                                <IconCopy size={16} />
                            </ActionIcon>
                        </Group>
                        <Group gap="xs">
                            <Text size="sm">Replay Widget</Text>
                            <ActionIcon variant="light" color="green" onClick={() => copyToClipboard(import.meta.env.VITE_REPLAY_URL + "#token=" + sink, "Replay Widget")}>
                                <IconCopy size={16} />
                            </ActionIcon>
                        </Group>
                    </>
                ) : null}
                <Switch
                    checked={config.checkBrowsersourceConnection}
                    onChange={(event) => { config.setCheckBrowsersourceConnection(event.currentTarget.checked); forceUpdate(); }}
                    label="Check OBS Connection"
                    size="lg"
                />
                <Text fs="italic" size='14px'>Show warnings when Browsersource is not connected but audio is set to OBS</Text>
            </Stack>
        </Fieldset>
    );
}

export function AlertsAudioSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Missed Alerts" variant="filled">
                <Stack>
                    <Switch
                        checked={config.showMissedAlertsButton}
                        onChange={(event) => { config.setShowMissedAlertsButton(event.currentTarget.checked); forceUpdate(); }}
                        label="Show missed alerts button"
                        size="lg"
                    />
                    <Text fs="italic" size='14px'>Show a button when returning to the app if there are unplayed alerts</Text>
                </Stack>
            </Fieldset>

            <Fieldset legend="Visual Alerts" variant="filled">
                <Stack>
                    <Switch
                        checked={config.browserSourceVisual}
                        onChange={(event) => { config.setBrowserSourceVisual(event.currentTarget.checked); forceUpdate(); }}
                        label="Show visual alerts in OBS Browser Source"
                        size="lg"
                    />
                    <Text fs="italic" size='14px'>Enable visual alert overlays in OBS (independent of audio)</Text>
                </Stack>
            </Fieldset>

            <Fieldset legend="Alert Delay" variant="filled">
                <Stack>
                    <Text size="sm">Visual Alert (seconds)</Text>
                    <Slider
                        w="calc(100% - 20px)"
                        m="10"
                        value={config.visualAlertDelay}
                        onChange={(value) => { config.setVisualAlertDelay(value); forceUpdate(); }}
                        min={0}
                        max={15}
                        step={1}
                        label={(value) => `${value}s`}
                        marks={[{ value: 0, label: '0s' }, { value: 5, label: '5s' }, { value: 10, label: '10s' }, { value: 15, label: '15s' }]}
                    />
                    <Text fs="italic" size='14px'>Adjust the timing of visual alerts relative to audio alerts</Text>
                </Stack>
            </Fieldset>

            <Fieldset legend="Alert Volume Boost" variant="filled">
                <Stack>
                    <Text size="sm">Volume Boost</Text>
                    <Slider
                        w="calc(100% - 20px)"
                        m="10"
                        value={config.alertBoost}
                        onChange={(value) => { config.setAlertBoost(value); forceUpdate(); }}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        label={(value) => `${value.toFixed(1)}x`}
                        marks={[{ value: 0.5, label: '0.5x' }, { value: 1.0, label: '1.0x' }, { value: 2.0, label: '2.0x' }, { value: 3.0, label: '3.0x' }, { value: 4.0, label: '4.0x' }, { value: 5.0, label: '5.0x' }]}
                    />
                    <Text fs="italic" size='14px'>Adjust the volume boost for all alert sounds</Text>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
