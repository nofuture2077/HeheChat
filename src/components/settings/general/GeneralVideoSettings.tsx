import { Stack, Fieldset, Select } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function GeneralVideoSettings() {
    const config = useContext(ConfigContext);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Twitch Player" variant='filled'>
                <Select
                    label="Video Quality"
                    data={['auto', 'source', '1080p60', '1080p', '720p60', '720p', '480p', '360p', '160p']}
                    value={config.videoQuality}
                    onChange={(value) => config.setVideoQuality(value || '480p')}
                />
            </Fieldset>
        </Stack>
    );
}
