import { Stack, Text, Switch, TagsInput } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';


export function ModSettings() {
    const config = useContext(ConfigContext);
    return (
    <Stack>
        <Text size="md">Enable Mod Tools</Text>
        <Switch checked={config.modToolsEnabled} onChange={(event) => config.setModToolsEnabled(event.currentTarget.checked)} label="Mod Tools Enabled" size="lg"/>

        <Text size='md'>Raid Targets</Text>
        <TagsInput placeholder="" value={config.raidTargets} onChange={config.setRaidTargets}></TagsInput>
    </Stack>)
}