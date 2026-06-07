import { Stack, Text, Switch, Fieldset, ActionIcon, Group, TextInput, NumberInput } from '@mantine/core';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext } from '@/ApplicationContext';
import { IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

function buildChatUrl(sink: string, opts: {
    fontSize: number;
    maxMessages: number;
    padding: number;
    showSystem: boolean;
    width: string;
    height: string;
}) {
    const base = new URL('chat.html', import.meta.env.VITE_SINK_URL).href;
    const parts = [`token=${encodeURIComponent(sink)}`];
    if (opts.showSystem) parts.push('showSystem');
    parts.push(`maxMessages=${opts.maxMessages}`);
    parts.push(`fontSize=${opts.fontSize}`);
    if (opts.width && opts.width !== '100%') parts.push(`width=${encodeURIComponent(opts.width)}`);
    if (opts.height && opts.height !== '100%') parts.push(`height=${encodeURIComponent(opts.height)}`);
    if (opts.padding !== 4) parts.push(`padding=${opts.padding}`);
    return `${base}#${parts.join('&')}`;
}

export function ChatBrowserSourceSettings() {
    const config = useContext(ConfigContext);
    const [sink, setSink] = useState<string | undefined>(undefined);
    const [fontSize, setFontSize] = useState(config.fontSize ?? 14);
    const [maxMessages, setMaxMessages] = useState(50);
    const [padding, setPadding] = useState(4);
    const [showSystem, setShowSystem] = useState(false);
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');

    useEffect(() => {
        const state = localStorage.getItem('hehe-token_state') || '';
        fetch(import.meta.env.VITE_BACKEND_URL + '/sink/get?state=' + state)
            .then(res => res.json())
            .then(data => setSink(data.sink));
    }, []);

    const chatUrl = sink
        ? buildChatUrl(sink, { fontSize, maxMessages, padding, showSystem, width: width || '100%', height: height || '100%' })
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
                        Add this URL as a browser source in OBS to display chat as an overlay.
                    </Text>

                    <NumberInput
                        label="Font Size (px)"
                        value={fontSize}
                        onChange={val => setFontSize(Number(val))}
                        min={8}
                        max={48}
                    />

                    <NumberInput
                        label="Max Messages"
                        value={maxMessages}
                        onChange={val => setMaxMessages(Number(val))}
                        min={5}
                        max={500}
                    />

                    <NumberInput
                        label="Padding (px)"
                        value={padding}
                        onChange={val => setPadding(Number(val))}
                        min={0}
                        max={80}
                    />

                    <TextInput
                        label="Width"
                        placeholder="100%"
                        value={width}
                        onChange={e => setWidth(e.currentTarget.value)}
                        description="CSS value, e.g. 400px or 100%"
                    />

                    <TextInput
                        label="Height"
                        placeholder="100%"
                        value={height}
                        onChange={e => setHeight(e.currentTarget.value)}
                        description="CSS value, e.g. 600px or 100%"
                    />

                    <Switch
                        label="Show System Messages"
                        description="Raids, follows, subs, etc."
                        checked={showSystem}
                        onChange={e => setShowSystem(e.currentTarget.checked)}
                        size="lg"
                    />

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
        </Stack>
    );
}
