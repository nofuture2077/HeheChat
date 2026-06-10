import { Stack, Text, Switch, Fieldset, Divider } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { AlertSystem } from '../../alerts/alertplayer';
import { EventAlert } from '@/commons/events';

const Messages: Record<string, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Subs",
    "raid": "Raids",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "channelPointRedemption": "Channel Points",
    "blerp": "Blerps",
    "soundalerts": "SoundAlerts",
    "tts": "!tts Events",
    "hypetrain": "Hypetrain"
};

function formatDescription(alert: EventAlert) {
    let suffix = '';
    switch (alert.type as string) {
        case 'raid': suffix = ' Viewers'; break;
        case 'cheer': suffix = ' Bits'; break;
        case 'sub': suffix = ' Months'; break;
        case 'subgift': suffix = ' Subs'; break;
        case 'subgiftb': suffix = ' Subs'; break;
        case 'hypetrain': suffix = ' Level'; break;
    }
    switch (alert.specifier.type) {
        case 'min': return alert.specifier.amount + "+" + suffix;
        case 'exact': return alert.specifier.amount + suffix;
        case 'matches': return alert.specifier.attribute + ": " + alert.specifier.text;
    }
}

export function AlertsActiveSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    const changeActive = (channel: string, active: boolean) => {
        const activatedShares = config.activatedShares;
        if (active) {
            if (!activatedShares.includes(channel)) activatedShares.push(channel);
        } else {
            const index = activatedShares.indexOf(channel);
            if (index > -1) activatedShares.splice(index, 1);
        }
        config.setActivatedShares(activatedShares);
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Active Alert Channels" variant="filled">
                <Stack>
                    {config.channels.map(channel => (
                        <Switch
                            key={channel}
                            checked={config.activatedShares.includes(channel)}
                            disabled={!config.receivedShares.includes(channel)}
                            label={channel + (config.receivedShares.includes(channel) ? '' : ' *')}
                            onChange={(event) => { changeActive(channel, event.currentTarget.checked); forceUpdate(); }}
                            size="lg"
                        />
                    ))}
                    <Text fs="italic" size='14px'>(*) No Permission - Ask other Streams to share their alerts with you.</Text>
                </Stack>
            </Fieldset>

            {Object.keys(AlertSystem.alertConfig).filter(channel => config.activatedShares.includes(channel)).map(channel => {
                if (!AlertSystem.alertConfig[channel] || !config.channels.includes(channel)) return null;
                return (
                    <Fieldset key={"Alerts-" + channel} legend={"Active Alert Types " + channel} variant="filled">
                        <Stack key={"alert-config-" + channel}>
                            {Object.entries(AlertSystem.alertConfig[channel].data?.alerts || {}).map(([eventMainType, alerts]) => {
                                if (!alerts || alerts.length === 0) return null;
                                return (
                                    <div key={eventMainType}>
                                        <Divider mb="md" label={Messages[eventMainType]} labelPosition="center" mt='xs' />
                                        {alerts.map((alert) => (
                                            <Switch
                                                disabled={!config.activatedShares.includes(channel)}
                                                checked={!config.deactivatedAlerts[alert.id]}
                                                onChange={(event) => { config.setDeactivatedAlerts(alert.id, !event.currentTarget.checked); forceUpdate(); }}
                                                key={alert.id}
                                                label={alert.name}
                                                size="lg"
                                                mb="md"
                                                description={formatDescription(alert)}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                            <Divider label='Blerps' labelPosition="center" mt={0} mb='xs' />
                            <Switch disabled={!config.activatedShares.includes(channel)} checked={!config.deactivatedAlerts["blerp"]} key="blerp" label="Blerps" size="lg" mb="md" description='All Blerps' onChange={(event) => { config.setDeactivatedAlerts("blerp", !event.currentTarget.checked); forceUpdate(); }} />
                            <Divider label='SoundAlerts' labelPosition="center" mt='xs' mb='xs' />
                            <Switch disabled={!config.activatedShares.includes(channel)} checked={!config.deactivatedAlerts["soundalerts"]} key="soundalerts" label="SoundAlerts" size="lg" mb="md" description='All SoundAlerts' onChange={(event) => { config.setDeactivatedAlerts("soundalerts", !event.currentTarget.checked); forceUpdate(); }} />
                        </Stack>
                    </Fieldset>
                );
            })}
        </Stack>
    );
}
