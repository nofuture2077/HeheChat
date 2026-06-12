import { Stack, Text, Switch, Fieldset, ActionIcon, Group, TextInput, NumberInput, Select, ColorInput, TagsInput } from '@mantine/core';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

export function ChatBrowserSourceSettings() {
    const config = useContext(ConfigContext);
    const [sink, setSink] = useState<string | undefined>(undefined);

    useEffect(() => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/sink/get?state=' + state)
            .then(res => res.json())
            .then(data => setSink(data.sink));
    }, []);

    const chatUrl = sink
        ? `${new URL('chat.html', import.meta.env.VITE_SINK_URL).href}#token=${encodeURIComponent(sink)}`
        : '';

    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(chatUrl);
            notifications.show({ title: 'Copied!', message: 'Chat browser source URL copied to clipboard', color: 'green' });
        } catch {
            notifications.show({ title: 'Error', message: 'Failed to copy to clipboard', color: 'red' });
        }
    };

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Chat Browser Source" variant="filled">
                <Stack gap="md">
                    <Text fs="italic" size="14px">
                        Add this URL as a browser source in OBS to display chat as an overlay. All settings below are saved to your profile and take effect immediately in the browser source.
                    </Text>

                    {sink ? (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Browser Source URL</Text>
                            <Group gap="xs" align="flex-start">
                                <TextInput
                                    value={chatUrl}
                                    readOnly
                                    style={{ flex: 1, fontFamily: 'monospace' }}
                                    styles={{ input: { fontSize: 11 } }}
                                />
                                <ActionIcon variant="light" color="blue" size="lg" mt={1} onClick={copyUrl} title="Copy URL">
                                    <IconCopy size={16} />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    ) : (
                        <Text size="sm" c="dimmed">Loading token…</Text>
                    )}
                </Stack>
            </Fieldset>

            <Fieldset legend="Appearance" variant="filled">
                <Stack gap="md">
                    <TextInput
                        label="Font Family"
                        description='CSS font-family value, e.g. "Arial" or "Roboto, sans-serif". Leave empty for default.'
                        placeholder="default"
                        value={config.chatBsFontFamily ?? ''}
                        onChange={e => config.setChatBsFontFamily(e.currentTarget.value)}
                    />
                    <NumberInput
                        label="Font Size (px)"
                        value={config.chatBsFontSize ?? 14}
                        onChange={val => config.setChatBsFontSize(Number(val))}
                        min={8}
                        max={48}
                    />
                    <ColorInput
                        label="Text Color"
                        description="Leave empty to use the default chat colors"
                        value={config.chatBsTextColor ?? ''}
                        onChange={val => config.setChatBsTextColor(val)}
                        placeholder="inherit"

                    />
                    <Switch
                        label="Transparent Background"
                        description="No background — ideal for OBS overlays"
                        checked={config.chatBsTransparentBg ?? true}
                        onChange={e => config.setChatBsTransparentBg(e.currentTarget.checked)}
                        size="lg"
                    />
                    <Switch
                        label="Text Shadow"
                        description="Adds a drop shadow behind text for readability on bright backgrounds"
                        checked={config.chatBsTextShadow ?? true}
                        onChange={e => config.setChatBsTextShadow(e.currentTarget.checked)}
                        size="lg"
                    />
                    <Select
                        label="Message Background"
                        description="Adds a semi-transparent box behind each message"
                        value={config.chatBsMsgBackground ?? 'none'}
                        onChange={val => config.setChatBsMsgBackground((val ?? 'none') as 'none' | 'dark' | 'light')}
                        data={[
                            { value: 'none', label: 'None' },
                            { value: 'dark', label: 'Dark (semi-transparent black)' },
                            { value: 'light', label: 'Light (semi-transparent white)' },
                        ]}
                    />
                </Stack>
            </Fieldset>

            <Fieldset legend="Layout" variant="filled">
                <Stack gap="md">
                    <TextInput
                        label="Width"
                        placeholder="100%"
                        value={config.chatBsWidth ?? '100%'}
                        onChange={e => config.setChatBsWidth(e.currentTarget.value)}
                        description="CSS value, e.g. 400px or 100%"
                    />
                    <TextInput
                        label="Height"
                        placeholder="100%"
                        value={config.chatBsHeight ?? '100%'}
                        onChange={e => config.setChatBsHeight(e.currentTarget.value)}
                        description="CSS value, e.g. 600px or 100%"
                    />
                    <NumberInput
                        label="Message Spacing (px)"
                        description="Vertical gap between messages"
                        value={config.chatBsMsgSpacing ?? 2}
                        onChange={val => config.setChatBsMsgSpacing(Number(val))}
                        min={0}
                        max={40}
                    />
                    <NumberInput
                        label="Padding (px)"
                        value={config.chatBsPadding ?? 4}
                        onChange={val => config.setChatBsPadding(Number(val))}
                        min={0}
                        max={80}
                    />
                </Stack>
            </Fieldset>

            <Fieldset legend="Messages" variant="filled">
                <Stack gap="md">
                    <NumberInput
                        label="Max Visible Messages"
                        value={config.chatBsMaxMessages ?? 5}
                        onChange={val => config.setChatBsMaxMessages(Number(val))}
                        min={1}
                        max={100}
                    />
                    <NumberInput
                        label="Message Lifetime (seconds)"
                        description="Messages disappear after this many seconds. Set to 0 to keep forever."
                        value={config.chatBsMessageLifetime ?? 15}
                        onChange={val => config.setChatBsMessageLifetime(Number(val))}
                        min={0}
                        max={300}
                    />
                    <Switch
                        label="Show System Messages"
                        description="Raids, follows, subs, etc."
                        checked={config.chatBsShowSystem ?? false}
                        onChange={e => config.setChatBsShowSystem(e.currentTarget.checked)}
                        size="lg"
                    />
                    <TagsInput
                        label="Ignored Usernames"
                        description="Messages from these users will be hidden. Press Enter to add."
                        placeholder="username"
                        value={config.chatBsIgnoredUsers ?? []}
                        onChange={val => config.setChatBsIgnoredUsers(val)}
                    />
                    <Switch
                        label="Show Username"
                        checked={config.chatBsShowUsername ?? true}
                        onChange={e => config.setChatBsShowUsername(e.currentTarget.checked)}
                        size="lg"
                    />
                </Stack>
            </Fieldset>

            <Fieldset legend="Animations" variant="filled">
                <Stack gap="md">
                    <Select
                        label="Animate In"
                        value={config.chatBsAnimateIn ?? 'slide'}
                        onChange={val => config.setChatBsAnimateIn((val ?? 'slide') as 'slide' | 'fade' | 'none')}
                        data={[
                            { value: 'slide', label: 'Slide up' },
                            { value: 'fade', label: 'Fade in' },
                            { value: 'none', label: 'None' },
                        ]}
                    />
                    <Select
                        label="Animate Out"
                        value={config.chatBsAnimateOut ?? 'fade'}
                        onChange={val => config.setChatBsAnimateOut((val ?? 'fade') as 'fade' | 'none')}
                        data={[
                            { value: 'fade', label: 'Fade out' },
                            { value: 'none', label: 'None' },
                        ]}
                    />
                </Stack>
            </Fieldset>

            <Fieldset legend="Badges" variant="filled">
                <Stack gap="md">
                    <Switch
                        label="Important Badges"
                        description="Moderator, broadcaster, VIP, staff, partner"
                        checked={config.chatBsShowImportantBadges ?? true}
                        onChange={e => config.setChatBsShowImportantBadges(e.currentTarget.checked)}
                        size="lg"
                    />
                    <Switch
                        label="Subscriber Badges"
                        description="Subscriber and founder badges"
                        checked={config.chatBsShowSubBadges ?? true}
                        onChange={e => config.setChatBsShowSubBadges(e.currentTarget.checked)}
                        size="lg"
                    />
                    <Switch
                        label="Other Badges"
                        description="Any badge not in the above categories"
                        checked={config.chatBsShowOtherBadges ?? false}
                        onChange={e => config.setChatBsShowOtherBadges(e.currentTarget.checked)}
                        size="lg"
                    />
                    <Switch
                        label="7TV Badges"
                        description="7TV cosmetic badges"
                        checked={config.chatBsShow7TVBadges ?? true}
                        onChange={e => config.setChatBsShow7TVBadges(e.currentTarget.checked)}
                        size="lg"
                    />
                    <Switch
                        label="HeheChat Badges"
                        description="HeheChat admin and pro badges"
                        checked={config.chatBsShowHeheBadges ?? true}
                        onChange={e => config.setChatBsShowHeheBadges(e.currentTarget.checked)}
                        size="lg"
                    />
                    <NumberInput
                        label="Max Badges"
                        value={config.chatBsMaxBadges ?? 3}
                        onChange={val => config.setChatBsMaxBadges(Number(val))}
                        min={0}
                        max={5}
                    />
                </Stack>
            </Fieldset>
        </Stack>
    );
}
