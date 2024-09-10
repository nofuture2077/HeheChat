import { Stack, Text, Switch, Space } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { SystemMessageMainType } from '@/commons/message'

const eventMainTypeValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'ban', 'timeout', 'delete'];

const Messages: Record<SystemMessageMainType, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Gift Subs",
    "raid": "Raids",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "ban": "Banned Users",
    "timeout": "Timeouted Users",
    "delete": "Deleted Messages"
};

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
    <Stack>
        <Text size="md">Play Alerts</Text>
        <Switch checked={config.playAlerts} onChange={(event) => {config.setPlayAlerts(event.currentTarget.checked);forceUpdate()}} label="Play Alerts" size="lg"/>
        {config.channels.map(channel => <Switch key={channel} checked={isActive(channel)} disabled={!hasShare(channel)} label={channel} onChange={(event) => {changeActive(channel, event.currentTarget.checked);forceUpdate()}} size="lg"/>)}
        <Text fs="italic">(*) Ask other Streams to share their alerts with you.</Text>
        <Space h="sm" />
        <Text size="md">System Messages</Text>

        {eventMainTypeValues.map(eventType => <Switch key={eventType} checked={config.systemMessageInChat[eventType]} onChange={(event) => {config.setSystemMessageInChat(eventType, event.currentTarget.checked);forceUpdate()}} label={Messages[eventType]} size="lg"/>)}
    </Stack>)
}