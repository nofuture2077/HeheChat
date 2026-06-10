import { Stack, Text, TagsInput, Alert, Fieldset } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useContext, useState, useEffect } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function AlertsSharingSettings() {
    const config = useContext(ConfigContext);
    const [shares, setShares] = useState<string[]>(config.shares);

    useEffect(() => {
        config.loadReceivedShares();
        config.loadShares();
    }, []);

    useEffect(() => {
        if (shares !== config.shares) {
            config.setShares(shares);
        }
    }, [shares]);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Alert variant="transparent" color="blue" icon={<IconInfoCircle />}>
                Share your alert sounds with other streamers so they can use them on their channel, and receive alerts from channels that share with you.
            </Alert>
            <Fieldset legend="Alert Channels" variant="filled">
                <Stack>
                    <TagsInput label="Share alerts with" placeholder="" value={config.shares} onChange={(s) => setShares(s.map(c => c.toLowerCase().substring(0, 25).trim()))} />
                    <Text fs="italic" size='14px'>* Share your alerts with other Streams so they can use your sounds. Be aware: If you use AI-TTS shared alerts will count against your Quota from elevenlabs</Text>
                </Stack>
            </Fieldset>
        </Stack>
    );
}
