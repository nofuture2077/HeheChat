import { Stack, Text, Switch, Space, Fieldset } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { AlertSystem } from '../../components/alerts/alertplayer'

export function AlertSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();
    const hasShare = (channel: string) => config.receivedShares.includes(channel);
    const isActive = (channel: string) => config.activatedShares.includes(channel);
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
    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Play Alerts" variant="filled">
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
                return <Fieldset legend={"Alerts " + channel} variant="filled">
                    <Stack key={"alert-config-" + channel}>
                        {Object.values(AlertSystem.alertConfig[channel].data?.alerts || []).reduce((accumulator, value) => accumulator.concat(value), []).map((alert) => {
                            return <Switch disabled={!isActive(channel)} checked={!config.deactivatedAlerts[alert.id]} onChange={(event) => { config.setDeactivatedAlerts(alert.id, !event.currentTarget.checked); forceUpdate() }} key={alert.id} label={alert.name} size="lg" />
                        })}
                    </Stack>
                </Fieldset>
            })}
        </Stack>)
}