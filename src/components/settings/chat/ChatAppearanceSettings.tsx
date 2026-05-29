import { Switch, Stack, Fieldset, Text } from '@mantine/core';
import { useContext } from 'react';
import { ConfigContext } from '@/ApplicationContext';

export function ChatAppearanceSettings() {
    const config = useContext(ConfigContext);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Chat cosmetics" variant='filled'>
                <Stack>
                    <Switch checked={config.reloadOnReturnToApp} onChange={(event) => config.setReloadOnReturnToApp(event.currentTarget.checked)} label="Reload on Return" size="lg" />
                    <Switch checked={config.chatEnabled} onChange={(event) => config.setChatEnabled(event.currentTarget.checked)} label="Chat Input" size="lg" />
                    <Switch checked={config.showTimestamp} onChange={(event) => config.setShowTimestamp(event.currentTarget.checked)} label="Timestamp" size="lg" />
                    <Switch checked={config.showProfilePicture} onChange={(event) => config.setShowProfilePicture(event.currentTarget.checked)} label="Profile Picture" size="lg" />
                    <Switch checked={config.showImportantBadges} onChange={(event) => config.setShowImportantBadges(event.currentTarget.checked)} label="Important Badges" size="lg" />
                    <Switch checked={config.showSubBadges} onChange={(event) => config.setShowSubBadges(event.currentTarget.checked)} label="Sub Badges" size="lg" />
                    <Switch checked={config.showPredictions} onChange={(event) => config.setShowPredictions(event.currentTarget.checked)} label="Prediction Badges" size="lg" />
                    <Switch checked={config.showOtherBadges} onChange={(event) => config.setShowOtherBadges(event.currentTarget.checked)} label="Other Badges" size="lg" />
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
        </Stack>
    );
}
