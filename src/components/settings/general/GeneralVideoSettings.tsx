import { Stack, Fieldset, Select, Switch } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function GeneralVideoSettings() {
    const config = useContext(ConfigContext);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Twitch Player" variant='filled'>
                <Stack>
                    <Switch checked={config.showVideo} onChange={(event) => config.setShowVideo(event.currentTarget.checked)} label="Video Player" size="lg" />
                    <Switch checked={config.desktopVideoMode} onChange={(event) => config.setDesktopVideoMode(event.currentTarget.checked)} label="Desktop Video Mode" size="lg" />
                    <Switch checked={config.hideViewers} onChange={(event) => config.setHideViewers(event.currentTarget.checked)} label="Hide Viewers" size="lg" />
                    <Switch checked={config.hideOwnViewers} onChange={(event) => config.setHideOwnViewers(event.currentTarget.checked)} label="Hide Own Viewers" size="lg" />
                    <Select
                        label="Video Quality"
                        data={['auto', 'source', '1080p60', '1080p', '720p60', '720p', '480p', '360p', '160p']}
                        value={config.videoQuality}
                        onChange={(value) => config.setVideoQuality(value || '480p')}
                    />
                </Stack>
            </Fieldset>
        </Stack>
    );
}
