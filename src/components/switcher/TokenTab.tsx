import { useEffect, useState, useContext } from 'react';
import { Stack, TextInput, ActionIcon, Fieldset, Text } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { ConfigContext } from '@/ApplicationContext';
import { getSwitcherClientToken } from '@/api/switcher';

export function TokenTab() {
    const config = useContext(ConfigContext);
    const channel = config.getChatChannel();
    const [obsToken, setObsToken] = useState('');
    const [copied, setCopied] = useState(false);

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
        </Stack>
    );
}
