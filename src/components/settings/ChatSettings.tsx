import { TagsInput, Switch, Stack, Text, Space, Fieldset } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { SystemMessageMainType } from '@/commons/message'

const eventMainTypeValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'streamOnline', 'streamOffline', 'channelPointRedemption'];
const seventTVMessages: SystemMessageMainType[] = ['sevenTVAdded', 'sevenTVRemoved'];

const Messages: Record<string, string> = {
    'sub': 'Subscriptions',
    'subgift': "Gift-Subs",
    "subgiftb": "Received Gift Subs",
    "raid": "Raids",
    "follow": "Follows",
    "donation": "Donations",
    "cheer": "Bit-Donations",
    "streamOnline": "Stream Online Message",
    "streamOffline": "Stream Offline Message",
    "channelPointRedemption": "Channel Point Rewards",
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

            <Fieldset legend="Chat cosmetics" variant='filled'>
                <Stack>
                    <Switch checked={config.chatEnabled} onChange={(event) => config.setChatEnabled(event.currentTarget.checked)} label="Enable Chat Input" size="lg" />
                    <Switch checked={config.showTimestamp} onChange={(event) => config.setShowTimestamp(event.currentTarget.checked)} label="Show Timestamp" size="lg" />
                    <Switch checked={config.showProfilePicture} onChange={(event) => config.setShowProfilePicture(event.currentTarget.checked)} label="Show Profile Picture" size="lg" />
                    <Switch checked={config.showImportantBadges} onChange={(event) => config.setShowImportantBadges(event.currentTarget.checked)} label="Show Important Badges" size="lg" />
                    <Switch checked={config.showSubBadges} onChange={(event) => config.setShowSubBadges(event.currentTarget.checked)} label="Show Sub Badges" size="lg" />
                    <Switch checked={config.showPredictions} onChange={(event) => config.setShowPredictions(event.currentTarget.checked)} label="Show Predictions" size="lg" />
                    <Switch checked={config.showOtherBadges} onChange={(event) => config.setShowOtherBadges(event.currentTarget.checked)} label="Show Other Badges" size="lg" />
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