import { Stack, Text, Switch, TagsInput } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';


export function AlertSettings() {
    const config = useContext(ConfigContext);
    return (
    <Stack>
        <Text size="md">Play Alerts</Text>
        <Switch checked={config.playAlerts} onChange={(event) => config.setPlayAlerts(event.currentTarget.checked)} label="Play Alerts" size="lg"/>
    </Stack>)
}