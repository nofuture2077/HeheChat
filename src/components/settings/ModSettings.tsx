import { Stack, Text, Switch } from '@mantine/core';
import { ColorSchemeToggle } from '../ColorSchemeToggle/ColorSchemeToggle';
import { useContext } from 'react';
import { ChatConfigContext } from '@/ApplicationContext';


export function ModSettings() {
    const chatConfig = useContext(ChatConfigContext);
    return (
    <Stack>
        <Text size="md">Enable Mod Tools</Text>
        <Switch checked={chatConfig.modToolsEnabled} onChange={(event) => chatConfig.setModToolsEnabled(event.currentTarget.checked)} label="Mod Tools Enabled" size="lg"/>
    </Stack>)
}