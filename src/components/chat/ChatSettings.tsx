import { TagsInput, Switch, Stack, Title } from '@mantine/core';
import { ColorSchemeToggle } from '../ColorSchemeToggle/ColorSchemeToggle';
import { useContext } from 'react';
import { ChatConfigContext } from '../../ApplicationContext';


export function ChatSettings() {
    const chatConfig = useContext(ChatConfigContext);

    return (
    <Stack>
        <ColorSchemeToggle/>
        <TagsInput label="Channelnames" placeholder="" value={chatConfig.channels} onChange={chatConfig.setChannels}></TagsInput>
        <TagsInput label="Ignored Users" placeholder="" value={chatConfig.ignoredUsers} onChange={chatConfig.setIgnoredUsers}></TagsInput>
        <Title order={3}>Chat cosmetics</Title>
        <Switch checked={chatConfig.showTimestamp} onChange={(event) => chatConfig.setShowTimestamp(event.currentTarget.checked)} label="Show Timestamp" size="lg"/>
        <Switch checked={chatConfig.showProfilePicture} onChange={(event) => chatConfig.setShowProfilePicture(event.currentTarget.checked)} label="Show Profile Picture" size="lg"/>
        <Switch checked={chatConfig.showImportantBadges} onChange={(event) => chatConfig.setShowImportantBadges(event.currentTarget.checked)} label="Show Important Badges" size="lg"/>
        <Switch checked={chatConfig.showSubBadges} onChange={(event) => chatConfig.setShowSubBadges(event.currentTarget.checked)} label="Show Sub Badges" size="lg"/>
        <Switch checked={chatConfig.showPredictions} onChange={(event) => chatConfig.setShowPredictions(event.currentTarget.checked)} label="Show Predictions" size="lg"/>
        <Switch checked={chatConfig.showOtherBadges} onChange={(event) => chatConfig.setShowOtherBadges(event.currentTarget.checked)} label="Show Other Badges" size="lg"/>
    </Stack>)
}