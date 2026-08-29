import { TagsInput, Stack, Select, Fieldset, Image, Alert, Slider, Switch, Text, Checkbox, NumberInput } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function ChatTopSection() {
    const config = useContext(ConfigContext);
    const fontSizeMarks = [14, 18, 22, 26].map(x => ({ value: x, label: x + "px" }));

    return (
        <>
            <Fieldset legend="Chat" variant='filled'>
                <Stack gap="md">
                    <Select label="Max Messages" data={['20', '40', '60', '100', '200', '500']} value={config.maxMessages + ''} onChange={(value) => config.setMaxMessages(Number(value))} />
                    {config.maxMessages === 20 && (
                        <Stack mt="md" align="center">
                            <Alert color="green" title="🥒 You are now in Gurkenmodus 🥒" variant="filled" />
                            <Image src="/simon.avif" alt="Simon in Gurkenmodus" w={200} h={200} fit="contain" radius="md" />
                        </Stack>
                    )}
                    <TagsInput label="Ignored Users" placeholder="" value={config.ignoredUsers} onChange={(users) => config.setIgnoredUsers(users.map(u => u.toLowerCase().substring(0, 25).trim()))} description="Messages from these users (e.g. bots) will not show in your Chat." />

                    <Switch checked={config.reloadOnReturnToApp} onChange={(event) => config.setReloadOnReturnToApp(event.currentTarget.checked)} label="Reload on Return" description="Reload HeheChat on App-Switch to not miss messages" size="lg" />
                    <Switch checked={config.compactMode} onChange={(event) => config.setCompactMode(event.currentTarget.checked)} label="Compact Mode" description="Reduces line height for a denser chat view." size="lg" />
                    <Stack gap={0} mb="md">
                        <Text size="sm">Font Size</Text>
                        <Slider w="calc(100% - 20px)" m="10" value={config.fontSize} onChange={config.setFontSize} min={14} max={26} label={(value) => `${value} px`} marks={fontSizeMarks} />
                    </Stack>
                </Stack>
            </Fieldset>
        </>
    );
}

export function ChatChannelsSettings() {
    const config = useContext(ConfigContext);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="TTS" variant="filled">
                <Stack gap="md">
                    <Alert color="blue" variant="light">
                        All Chat TTS features require a <strong>Read Chat</strong> alert with <strong>TTS Text</strong> options configured in Alert Editor.
                    </Alert>
                    <Switch checked={config.readAllMessages} onChange={(event) => config.setReadAllMessages(event.currentTarget.checked)} label="Read All Messages" description="HeheChatPro required" size="lg" />
                    <Stack gap="xs" ml="md">
                        <Switch checked={config.smartFilter.enabled} onChange={(event) => config.setSmartFilter({ enabled: event.currentTarget.checked })} label="Smart Filter" description="Skip messages that would spam the TTS queue. When disabled, no filtering happens at all." />
                        {config.smartFilter.enabled && (
                            <Stack gap="xs" ml="md">
                                <Checkbox checked={config.smartFilter.skipEmoteOnly} onChange={(event) => config.setSmartFilter({ skipEmoteOnly: event.currentTarget.checked })} label="Skip emote-only messages" />
                                <Checkbox checked={config.smartFilter.skipReplies} onChange={(event) => config.setSmartFilter({ skipReplies: event.currentTarget.checked })} label="Skip replies" />
                                <Checkbox checked={config.smartFilter.skipLinks} onChange={(event) => config.setSmartFilter({ skipLinks: event.currentTarget.checked })} label="Skip messages with links" />
                                <Checkbox checked={config.smartFilter.skipSpam} onChange={(event) => config.setSmartFilter({ skipSpam: event.currentTarget.checked })} label="Skip repetitive/spam messages" description='e.g. "br br br br", copy-pasted messages' />
                                <Checkbox checked={config.smartFilter.skipShort} onChange={(event) => config.setSmartFilter({ skipShort: event.currentTarget.checked })} label="Skip short messages" />
                                {config.smartFilter.skipShort && (
                                    <NumberInput ml="md" w={140} label="Min. words" min={1} max={20} value={config.smartFilter.minWords} onChange={(value) => config.setSmartFilter({ minWords: Number(value) })} />
                                )}
                                <Checkbox checked={config.smartFilter.skipLong} onChange={(event) => config.setSmartFilter({ skipLong: event.currentTarget.checked })} label="Skip long messages" />
                                {config.smartFilter.skipLong && (
                                    <NumberInput ml="md" w={140} label="Max. words" min={1} max={200} value={config.smartFilter.maxWords} onChange={(value) => config.setSmartFilter({ maxWords: Number(value) })} />
                                )}
                            </Stack>
                        )}
                    </Stack>
                    <TagsInput label="!tts Users" placeholder="" value={config.freeTTS} onChange={(freeTTS) => config.setFreeTTS(freeTTS.map(c => c.toLowerCase().substring(0, 50).trim()))} description='Users who can use "!tts" in chat. Use "all" to give everyone free TTS.' />
                    <TagsInput label="Ignore TTS Users" placeholder="" value={config.ignoreTTS} onChange={(ignoreTTS) => config.setIgnoreTTS(ignoreTTS.map(c => c.toLowerCase().substring(0, 50).trim()))} description="Users in this list will be ignored by Read All Messages." />
                </Stack>
            </Fieldset>
        </Stack>
    );
}
