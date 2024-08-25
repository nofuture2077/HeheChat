import { TagsInput, Switch, Stack, Text } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '../../ApplicationContext';

export function ChatSettings() {
    const config = useContext(ConfigContext);

    return (
    <Stack>
        <Text size='md'>Channelnames</Text>
        <TagsInput placeholder="" value={config.channels} onChange={(channels) => config.setChannels(channels.map(c => c.toLowerCase().trim()))}></TagsInput>
        <Text size='md'>Ignored Users</Text>
        <TagsInput placeholder="" value={config.ignoredUsers} onChange={config.setIgnoredUsers}></TagsInput>
        <Text size='md'>Chat cosmetics</Text>
        <Switch checked={config.showTimestamp} onChange={(event) => config.setShowTimestamp(event.currentTarget.checked)} label="Show Timestamp" size="lg"/>
        <Switch checked={config.showProfilePicture} onChange={(event) => config.setShowProfilePicture(event.currentTarget.checked)} label="Show Profile Picture" size="lg"/>
        <Switch checked={config.showImportantBadges} onChange={(event) => config.setShowImportantBadges(event.currentTarget.checked)} label="Show Important Badges" size="lg"/>
        <Switch checked={config.showSubBadges} onChange={(event) => config.setShowSubBadges(event.currentTarget.checked)} label="Show Sub Badges" size="lg"/>
        <Switch checked={config.showPredictions} onChange={(event) => config.setShowPredictions(event.currentTarget.checked)} label="Show Predictions" size="lg"/>
        <Switch checked={config.showOtherBadges} onChange={(event) => config.setShowOtherBadges(event.currentTarget.checked)} label="Show Other Badges" size="lg"/>
    </Stack>)
}