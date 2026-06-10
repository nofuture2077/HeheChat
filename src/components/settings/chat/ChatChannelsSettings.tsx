import { TagsInput, Stack, Select, Fieldset, Space, Text, Image, Alert, Slider, Switch } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function ChatTopSection() {
    const config = useContext(ConfigContext);
    const fontSizeMarks = [14, 18, 22, 26].map(x => ({ value: x, label: x + "px" }));

    return (
        <>
            <Fieldset legend="Font Size" variant='filled'>
                <Slider w="calc(100% - 20px)" m="10" value={config.fontSize} onChange={config.setFontSize} min={14} max={26} label={(value) => `${value} px`} marks={fontSizeMarks} />
            </Fieldset>

            <Fieldset legend="Messages" variant='filled'>
                <Select label="Max Messages" data={['20', '40', '60', '100', '200', '500']} value={config.maxMessages + ''} onChange={(value) => config.setMaxMessages(Number(value))} />
                {config.maxMessages === 20 && (
                    <Stack mt="md" align="center">
                        <Alert color="green" title="🥒 You are now in Gurkenmodus 🥒" variant="filled" />
                        <Image src="/simon.avif" alt="Simon in Gurkenmodus" w={200} h={200} fit="contain" radius="md" />
                    </Stack>
                )}
            </Fieldset>

            <Fieldset legend="Ignored Users" variant='filled'>
                <TagsInput placeholder="" value={config.ignoredUsers} onChange={(users) => config.setIgnoredUsers(users.map(u => u.toLowerCase().substring(0, 25).trim()))} />
                <Space h="xs" />
                <Text fs="italic" size='14px'>Messages from this users (e.g. bots) will not show in your Chat.</Text>
            </Fieldset>
        </>
    );
}

export function ChatChannelsSettings() {
    const config = useContext(ConfigContext);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Read All Messages" variant="filled">
                <Switch checked={config.readAllMessages} onChange={(event) => config.setReadAllMessages(event.currentTarget.checked)} label="Read All Messages *" size="lg" />
                <Space h="xs" />
                <Text fs="italic" size='14px'>(*) HeheChatPro required</Text>
            </Fieldset>

            <Fieldset legend="!tts Users" variant="filled">
                <TagsInput placeholder="" value={config.freeTTS} onChange={(freeTTS) => config.setFreeTTS(freeTTS.map(c => c.toLowerCase().substring(0, 50).trim()))} />
                <Space h="xs" />
                <Text fs="italic" size='14px'>Users in this list can use e.g. "!tts Forget your phone" in chat. You can give this to thrustful moderators, friends or management for emergency cases. "all" gives everyone free tts</Text>
            </Fieldset>

            <Fieldset legend="Ignore TTS Users" variant="filled">
                <TagsInput placeholder="" value={config.ignoreTTS} onChange={(ignoreTTS) => config.setIgnoreTTS(ignoreTTS.map(c => c.toLowerCase().substring(0, 50).trim()))} />
                <Space h="xs" />
                <Text fs="italic" size='14px'>Users in this list will be ignored from messages triggered by readAllMessages</Text>
            </Fieldset>
        </Stack>
    );
}
