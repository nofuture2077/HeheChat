import { TagsInput, Switch, Stack, Select, Fieldset } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { SystemMessageMainType } from '@/commons/message'

const eventMainTypeValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'streamOnline', 'streamOffline', 'channelPointRedemption'];
const seventTVMessages: SystemMessageMainType[] = ['sevenTVAdded', 'sevenTVRemoved'];

const Messages: Record<string, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Subs",
    "raid": "Raids",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "streamOnline": "Online Message",
    "streamOffline": "Offline Message",
    "channelPointRedemption": "Channel Points",
    "sevenTVAdded": "New 7TV Emotes",
    "sevenTVRemoved": "Removed 7TV Emotes"
};

export function ChatSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Channelnames" variant='filled'>
                <TagsInput placeholder="" value={config.channels} onChange={(channels) => config.setChannels(channels.map(c => c.toLowerCase().substring(0, 25).trim()))}></TagsInput>
            </Fieldset>

            <Fieldset legend="Ignored Users" variant='filled'>
                <TagsInput placeholder="" value={config.ignoredUsers} onChange={(users) => config.setIgnoredUsers(users.map(u => u.toLowerCase().substring(0, 25).trim()))}></TagsInput>
            </Fieldset>

            <Fieldset legend="Messages" variant='filled'>
                 <Select label="Max Messages" data={['100', '200', '500']} value={config.maxMessages + ''} onChange={(value) => config.setMaxMessages(Number(value))} />
            </Fieldset>

            <Fieldset legend="Chat cosmetics" variant='filled'>
                <Stack>
                    <Switch checked={config.showVideo} onChange={(event) => config.setShowVideo(event.currentTarget.checked)} label="Video Player" size="lg" />
                    <Switch checked={config.chatEnabled} onChange={(event) => config.setChatEnabled(event.currentTarget.checked)} label="Chat Input" size="lg" />
                    <Switch checked={config.showTimestamp} onChange={(event) => config.setShowTimestamp(event.currentTarget.checked)} label="Timestamp" size="lg" />
                    <Switch checked={config.showProfilePicture} onChange={(event) => config.setShowProfilePicture(event.currentTarget.checked)} label="Profile Picture" size="lg" />
                    <Switch checked={config.showImportantBadges} onChange={(event) => config.setShowImportantBadges(event.currentTarget.checked)} label="Important Badges" size="lg" />
                    <Switch checked={config.showSubBadges} onChange={(event) => config.setShowSubBadges(event.currentTarget.checked)} label="Sub Badges" size="lg" />
                    <Switch checked={config.showPredictions} onChange={(event) => config.setShowPredictions(event.currentTarget.checked)} label="Prediction Badges" size="lg" />
                    <Switch checked={config.showOtherBadges} onChange={(event) => config.setShowOtherBadges(event.currentTarget.checked)} label="Other Badges" size="lg" />
                    <Switch checked={config.hideViewers} onChange={(event) => config.setHideViewers(event.currentTarget.checked)} label="Hide Viewers" size="lg" />
                    <Switch checked={config.hideOwnViewers} onChange={(event) => config.setHideOwnViewers(event.currentTarget.checked)} label="Hide Own Viewers" size="lg" />
                </Stack>
            </Fieldset>

            <Fieldset legend="Event Messages" variant='filled'>
                <Stack>
                    {eventMainTypeValues.map(eventType => <Switch key={eventType} checked={config.systemMessageInChat[eventType]} onChange={(event) => { config.setSystemMessageInChat(eventType, event.currentTarget.checked); forceUpdate(); }} label={Messages[eventType]} size="lg" />)}
                </Stack>
            </Fieldset>

            <Fieldset legend="7TV Messages" variant='filled'>
                <Stack>
                    {seventTVMessages.map(eventType => <Switch key={eventType} checked={config.systemMessageInChat[eventType]} onChange={(event) => { config.setSystemMessageInChat(eventType, event.currentTarget.checked); forceUpdate(); }} label={Messages[eventType]} size="lg" />)}
                </Stack>
            </Fieldset>
        </Stack>)
}