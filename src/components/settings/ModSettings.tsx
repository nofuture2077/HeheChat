import { Stack, Switch, TagsInput, Fieldset, Text, Space } from '@mantine/core';
import { useContext } from 'react';
import { useForceUpdate } from '@mantine/hooks';
import { ConfigContext } from '@/ApplicationContext';
import { ModActionType } from '@/components/chat/mod/modactions'

const modActions: ModActionType[] = ['ban', 'timeout', 'delete'];

const Messages: Record<ModActionType, string> = {
    "ban": "Banned Users",
    "timeout": "Timeouted Users",
    "delete": "Deleted Messages"
};

export function ModSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();
    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Enable Mod Tool" variant="filled">
                <Switch checked={config.modToolsEnabled} onChange={(event) => config.setModToolsEnabled(event.currentTarget.checked)} label="Mod Tools Enabled" size="lg" />
            </Fieldset>

            <Fieldset legend="Mod Messages" variant="filled">
                <Stack>
                    {modActions.map(eventType => <Switch key={eventType} checked={config.systemMessageInChat[eventType]} onChange={(event) => {config.setSystemMessageInChat(eventType, event.currentTarget.checked);forceUpdate();}} label={Messages[eventType]} size="lg"/>)}
                </Stack>  
            </Fieldset>

            <Fieldset legend="Raid Targets" variant="filled">
                <TagsInput placeholder="" value={config.raidTargets} onChange={(targets) => config.setRaidTargets(targets.map(c => c.toLowerCase().substring(0, 25).trim()))}></TagsInput>
                <Space h="xs" />
                <Text fs="italic" size='14px'>List of potential raid targets. You will see who is online in raid view</Text>
            </Fieldset>
        </Stack>)
}