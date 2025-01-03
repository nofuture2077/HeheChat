import { Stack, Text, Switch, Fieldset, Anchor, Slider, TagsInput } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { AlertSystem } from '../../components/alerts/alertplayer'
import { IconLink } from '@tabler/icons-react'
import { SystemMessageMainType } from '../../commons/message';

const hideEventsValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'channelPointRedemption'];

const Messages: Record<string, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Subs",
    "raid": "Raids",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "channelPointRedemption": "Channel Points"
};


export function AlertSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();
    const [sink, setSink] = useState<string | undefined>(undefined);
    const [ttsExtra, setTTSExtra] = useState<number>(AlertSystem.ttsExtra || 0);
    const [jingleExtra, setJingleExtra] = useState<number>(AlertSystem.jingleExtra || 0);
    const hasShare = (channel: string) => config.receivedShares.includes(channel);
    const isActive = (channel: string) => config.activatedShares.includes(channel);

    useEffect(() => {
        const state = localStorage.getItem('hehe-token_state') || '';

        fetch(import.meta.env.VITE_BACKEND_URL + "/sink/get?state=" + state).then(res => res.json()).then((data) => {
            setSink(data.sink);
        });
    }, []);

    useEffect(() => {
        if (AlertSystem.ttsExtra !== ttsExtra) {
            AlertSystem.setTTSExtra(ttsExtra);
        }
        if (AlertSystem.jingleExtra !== jingleExtra) {
            AlertSystem.setJingleExtra(jingleExtra);
        }
    }, [ttsExtra, jingleExtra])

    const changeActive = (channel: string, active: boolean) => {
        const activatedShares = config.activatedShares;

        if (active) {
            if (!activatedShares.includes(channel)) {
                activatedShares.push(channel);
            }
        } else {
            const index = activatedShares.indexOf(channel);
            if (index > -1) {
                activatedShares.splice(index, 1);
            }
        }
        config.setActivatedShares(activatedShares);
    };

    const marks = [-250, -0, 250, 500].map(x => ({ value: x, label: x + "ms" }));
    return (
        <Stack mt={30} mb={30} gap={30}>
            {sink ? (<>
                <Text span inline key={'browser-source-label'}>Browsersource (visual only) <Anchor inline key={'browser-source-link'} href={import.meta.env.VITE_SINK_URL + "#token=" + sink} target="_blank"><IconLink /></Anchor></Text>
                
            </>) : null}
            <Fieldset legend="Play Alerts" variant="filled" key="playalerts">
                <Stack>
                    <Switch checked={config.playAlerts} onChange={(event) => { config.setPlayAlerts(event.currentTarget.checked); forceUpdate() }} label="Play Alerts" size="lg" />
                    {config.channels.map(channel => <Switch key={channel} checked={isActive(channel)} disabled={!hasShare(channel)} label={channel + (hasShare(channel) ? '' : ' *')} onChange={(event) => { changeActive(channel, event.currentTarget.checked); forceUpdate() }} size="lg" />)}
                    <Text fs="italic" size='14px'>(*) No Permission - Ask other Streams to share their alerts with you.</Text>
                </Stack>
            </Fieldset>


            {Object.keys(AlertSystem.alertConfig).map(channel => {
                if (!AlertSystem.alertConfig[channel] || !config.channels.includes(channel)) {
                    return null;
                }
                return <Fieldset key={"Alerts-" + channel} legend={"Alerts " + channel} variant="filled">
                    <Stack key={"alert-config-" + channel}>
                        {Object.values(AlertSystem.alertConfig[channel].data?.alerts || []).reduce((accumulator, value) => accumulator.concat(value), []).map((alert) => {
                            return <Switch disabled={!isActive(channel)} checked={!config.deactivatedAlerts[alert.id]} onChange={(event) => { config.setDeactivatedAlerts(alert.id, !event.currentTarget.checked); forceUpdate() }} key={alert.id} label={alert.name} size="lg" />
                        })}
                    </Stack>
                </Fieldset>
            })}

            <Fieldset legend="Hide Events" variant='filled'>
                <Stack>
                    {hideEventsValues.map(eventType => <Switch key={eventType} checked={config.hideEvents[eventType]} onChange={(event) => { config.setHideEvents(eventType, event.currentTarget.checked); forceUpdate(); }} label={Messages[eventType]} size="lg" />)}
                </Stack>
            </Fieldset>

            <Fieldset legend="Free TTS User" variant="filled" key="free-tts">
                <TagsInput placeholder="" value={config.freeTTS} onChange={(freeTTS) => config.setFreeTTS(freeTTS.map(c => c.toLowerCase().substring(0, 50).trim()))}></TagsInput>
            </Fieldset>

            <Fieldset legend="Alert Delay" variant="filled" key="tts-delay">
                <Stack>
                    <Text size="sm">Jingle</Text>
                    <Slider w="calc(100% - 20px)" m="10" value={jingleExtra} onChange={setJingleExtra} min={-250} max={500} label={(value) => `${value}ms`} marks={marks} />
                    <Text size="sm">Text to Speech</Text>
                    <Slider w="calc(100% - 20px)" m="10" value={ttsExtra} onChange={setTTSExtra} min={-250} max={500} label={(value) => `${value}ms`} marks={marks} />
                </Stack>
            </Fieldset>
        </Stack>)
}