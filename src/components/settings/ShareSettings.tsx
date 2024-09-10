import { TagsInput, Text, Space } from '@mantine/core';
import { useContext, useEffect, useState } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function ShareSettings() {
    const config = useContext(ConfigContext);
    const [shares, setShares] = useState<string[]>(config.shares);

    useEffect(() => {
        if (shares != config.shares) {
            config.setShares(shares);
        }
    }, [shares]);
    return (<>
    <Text size="md">Share Alerts with:</Text>
    <TagsInput placeholder="" value={config.shares} onChange={setShares}></TagsInput>
    <Space h="xs" />
    <Text fs="italic">* Share your alerts with other Streams so they can use your sounds. Be aware: If you use AI-TTS shared alerts will count against your Quota from elevenlabs</Text>
    </>
)
}