import { TagsInput, Switch, Stack, Select, Fieldset } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { SystemMessageMainType } from '../../commons/message';

const eventMainTypeValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'streamOnline', 'streamOffline', 'channelPointRedemption'];
const hideEventsValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'channelPointRedemption'];
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
                    <Switch checked={config.hideHypetrain} onChange={(event) => config.setHideHypetrain(event.currentTarget.checked)} label="Hide Hypetrain" size="lg" />
                    <Switch checked={config.hidePrediction} onChange={(event) => config.setHidePrediction(event.currentTarget.checked)} label="Hide Predictions" size="lg" />
                    <Switch checked={config.hidePoll} onChange={(event) => config.setHideePoll(event.currentTarget.checked)} label="Hide Polls" size="lg" />
                    <Switch checked={config.hideShoutout} onChange={(event) => config.setHideShoutout(event.currentTarget.checked)} label="Hide Shoutouts" size="lg" />
                    <Switch checked={config.hideRaid} onChange={(event) => config.setHideRaid(event.currentTarget.checked)} label="Hide Raids" size="lg" />
                    <Switch checked={config.hideAdBreak} onChange={(event) => config.setHideAdBreak(event.currentTarget.checked)} label="Hide Ad Break" size="lg" />
                </Stack>
            </Fieldset>

            <Fieldset legend="Twitch Player"  variant='filled'>
                <Select
                    label="Video Quality"
                    data={['auto', 'source', '1080p60', '1080p', '720p60', '720p', '480p', '360p', '160p']}
                    value={config.videoQuality}
                    onChange={(value) => config.setVideoQuality(value || '480p')}
                />
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
