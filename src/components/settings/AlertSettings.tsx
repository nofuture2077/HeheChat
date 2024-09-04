import { Stack, Text, Switch } from '@mantine/core';
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
    return (
    <Stack>
        <Text size="md">Play Alerts</Text>
        <Switch checked={config.playAlerts} onChange={(event) => {config.setPlayAlerts(event.currentTarget.checked);forceUpdate()}} label="Play Alerts" size="lg"/>
        <Text size="md">System Messages</Text>

        {eventMainTypeValues.map(eventType => <Switch key={eventType} checked={config.systemMessageInChat[eventType]} onChange={(event) => {config.setSystemMessageInChat(eventType, event.currentTarget.checked);forceUpdate()}} label={Messages[eventType]} size="lg"/>)}
    </Stack>)
}