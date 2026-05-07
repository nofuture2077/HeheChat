import { useEffect, useState, useContext } from 'react';
import { Stack, TextInput, PasswordInput, ActionIcon, Fieldset, Text, Button } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { ConfigContext } from '@/ApplicationContext';
import { getSwitcherClientToken } from '@/api/switcher';

export function TokenTab() {
    const config = useContext(ConfigContext);
    const channel = config.getChatChannel();
    const [obsToken, setObsToken] = useState('');
    const [copied, setCopied] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const [obsWsUrl, setObsWsUrl] = useState('ws://localhost:4455');
    const [obsWsPassword, setObsWsPassword] = useState('');

    useEffect(() => {
        if (!channel) return;
        getSwitcherClientToken(channel)
            .then(data => setObsToken(data.token))
            .catch(() => {});
    }, [channel]);

    const handleCopy = () => {
        navigator.clipboard.writeText(obsToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyUrl = () => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
        const heheWsUrl = backendUrl.replace(/^http/, 'ws');
        const url = new URL('/switcher.html', window.location.origin);
        url.searchParams.set('heheWsUrl', heheWsUrl);
        url.searchParams.set('obsWsUrl', obsWsUrl);
        if (obsWsPassword) url.searchParams.set('obsPassword', obsWsPassword);
        url.searchParams.set('token', obsToken);
        navigator.clipboard.writeText(url.toString());
        setUrlCopied(true);
        setTimeout(() => setUrlCopied(false), 2000);
    };

    return (
        <Stack mt={16} gap={16} p="md">
            <Fieldset legend="OBS Client Token" variant="filled">
                <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                        Enter this token in the HeheChat OBS plugin to connect your OBS instance.
                    </Text>
                    <TextInput
                        value={obsToken}
                        readOnly
                        rightSection={
                            <ActionIcon variant="subtle" onClick={handleCopy}>
                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                            </ActionIcon>
                        }
                    />
                </Stack>
            </Fieldset>

            <Fieldset legend="OBS Browser Source" variant="filled">
                <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                        Add this page as a browser source in OBS instead of running a separate program.
                        Configure your OBS WebSocket connection below, then copy the URL.
                    </Text>
                    <TextInput
                        label="OBS WebSocket URL"
                        value={obsWsUrl}
                        onChange={e => setObsWsUrl(e.currentTarget.value)}
                        placeholder="ws://localhost:4455"
                    />
                    <PasswordInput
                        label="OBS WebSocket Password"
                        value={obsWsPassword}
                        onChange={e => setObsWsPassword(e.currentTarget.value)}
                        placeholder="Leave empty if no password is set"
                    />
                    <Button
                        variant="light"
                        leftSection={urlCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        onClick={handleCopyUrl}
                        disabled={!obsToken}
                    >
                        {urlCopied ? 'Copied!' : 'Copy Browser Source URL'}
                    </Button>
                    <Text size="xs" c="dimmed">
                        The OBS WebSocket password will be included in the URL. This is safe for local OBS use.
                    </Text>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
