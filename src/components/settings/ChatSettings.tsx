import { TagsInput, Switch, Stack, Select, Fieldset, Space, Text, Image, Alert, Box, ComboboxLikeRenderOptionInput, ComboboxStringItem, ComboboxItem } from '@mantine/core';
import { useForceUpdate } from '@mantine/hooks';
import { useContext, useMemo } from 'react';
import { ConfigContext } from '../../ApplicationContext';
import { SystemMessageMainType } from '../../commons/message';
import { useChannels } from '@/hooks/useChannels';
import { IconInfoCircle } from '@tabler/icons-react';

const eventMainTypeValues: SystemMessageMainType[] = ['sub', 'subgift', 'subgiftb', 'raid', 'follow', 'donation', 'cheer', 'streamOnline', 'streamOffline', 'channelPointRedemption', 'blerp', 'kofi', 'streak'];
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
    "sevenTVRemoved": "Removed 7TV Emotes",
    "blerp": "Blerps",
    "kofi": "Ko-fi Events",
    "streak": "Viewer Streak"
};

export function ChatSettings() {
    const config = useContext(ConfigContext);
    const forceUpdate = useForceUpdate();
    const { channels: authorizedChannels, loading } = useChannels();
    
    // Compare fetched channels with channels in config to find unauthorized channels
    const unauthorizedChannels = useMemo(() => {
        if (loading || !authorizedChannels || !config.channels || config.channels.length === 0) {
            return [];
        }
        
        // Find channels in config that are not in the fetched channels list
        return config.channels.filter(configChannel => 
            !authorizedChannels.some(channel => channel.toLowerCase() === configChannel.toLowerCase())
        );
    }, [authorizedChannels, config.channels, loading]);
    
    const hasUnauthorizedChannels = unauthorizedChannels.length > 0;

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Channelnames" variant='filled'>
                <TagsInput 
                    placeholder="" 
                    value={config.channels} 
                    onChange={(channels) => config.setChannels(channels.map(c => c.toLowerCase().substring(0, 25).trim()))}
                />
                
                {hasUnauthorizedChannels && (
                    <>
                        <Space h="xs" />
                        <Alert variant="light" color="orange" title="Missing Authorization" icon={<IconInfoCircle />}>
                            Some channels ({unauthorizedChannels.join(', ')}) have not authorized hehechat yet. Please ask them to join or going into a shared chat to see their messages.
                        </Alert>
                    </>
                )}
            </Fieldset>

            <Fieldset legend="!tts Users" variant="filled" key="free-tts">
                <TagsInput placeholder="" value={config.freeTTS} onChange={(freeTTS) => config.setFreeTTS(freeTTS.map(c => c.toLowerCase().substring(0, 50).trim()))}></TagsInput>
                <Space h="xs" />
                <Text fs="italic" size='14px'>Users in this list can use e.g. "!tts Forget your phone" in chat. You can give this to thrustful moderators, friends or management for emergency cases. "all" gives everyone free tts</Text>
            </Fieldset>

            <Fieldset legend="Ignore TTS Users" variant="filled" key="ignore-tts">
                <TagsInput placeholder="" value={config.ignoreTTS} onChange={(ignoreTTS) => config.setIgnoreTTS(ignoreTTS.map(c => c.toLowerCase().substring(0, 50).trim()))}></TagsInput>
                <Space h="xs" />
                <Text fs="italic" size='14px'>Users in this list will be ignored from messages triggered by readAllMessages</Text>
            </Fieldset>

            <Fieldset legend="Ignored Users" variant='filled'>
                <TagsInput placeholder="" value={config.ignoredUsers} onChange={(users) => config.setIgnoredUsers(users.map(u => u.toLowerCase().substring(0, 25).trim()))}></TagsInput>
                <Space h="xs" />
                <Text fs="italic" size='14px'>Messages from this users (e.g. bots) will not show in your Chat.</Text>
            </Fieldset>

            <Fieldset legend="Raid Targets" variant="filled">
                <TagsInput placeholder="" value={config.raidTargets} onChange={(targets) => config.setRaidTargets(targets.map(c => c.toLowerCase().substring(0, 25).trim()))}></TagsInput>
                <Space h="xs" />
                <Text fs="italic" size='14px'>List of potential raid targets. You will see who is online in raid view</Text>
            </Fieldset>

            <Fieldset legend="Messages" variant='filled'>
                 <Select label="Max Messages" data={['20', '40', '60', '100', '200', '500']} value={config.maxMessages + ''} onChange={(value) => config.setMaxMessages(Number(value))} />
                 {config.maxMessages === 20 && (
                     <Stack mt="md" align="center">
                         <Alert color="green" title="🥒 You are now in Gurkenmodus 🥒" variant="filled">
                         </Alert>
                         <Image 
                             src="/simon.avif" 
                             alt="Simon in Gurkenmodus" 
                             w={200} 
                             h={200} 
                             fit="contain"
                             radius="md"
                         />
                     </Stack>
                 )}
            </Fieldset>

            <Fieldset legend="Chat cosmetics" variant='filled'>
                <Stack>
                    <Switch checked={config.reloadOnReturnToApp} onChange={(event) => config.setReloadOnReturnToApp(event.currentTarget.checked)} label="Reload on Return" size="lg" />
                    <Switch checked={config.showVideo} onChange={(event) => config.setShowVideo(event.currentTarget.checked)} label="Video Player" size="lg" />
                    <Switch checked={config.desktopVideoMode} onChange={(event) => config.setDesktopVideoMode(event.currentTarget.checked)} label="Desktop Video Mode" size="lg" />
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
                    <Switch checked={config.disableEmoteDialog} onChange={(event) => config.setDisableEmoteDialog(event.currentTarget.checked)} label="Disable Emote Dialog" size="lg" />
                    <Switch checked={config.show7TVCosmetics} onChange={(event) => config.setShow7TVCosmetics(event.currentTarget.checked)} label="7TV Username Paints" size="lg" />
                    <Switch checked={config.rainMode} onChange={(event) => config.setRainMode(event.currentTarget.checked)} label="Rain Mode" size="lg" />
                    <Switch checked={config.readAllMessages} onChange={(event) => config.setReadAllMessages(event.currentTarget.checked)} label="Read All Messages *" size="lg" />
                    <Text fs="italic" size='14px'>(*) HeheChatPro required</Text>

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
