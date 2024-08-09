import { useContext, useState } from "react";
import { ChatEmotesContext, ProfileContext } from '@/ApplicationContext'
import { AvatarGroup, Avatar, Text, Paper, ActionIcon, Stack, Modal, Fieldset, TextInput, Group, Button } from '@mantine/core';
import { useDisclosure } from "@mantine/hooks";
import { Profile } from "@/commons/profile";
import { IconPlus, IconX } from '@tabler/icons-react'
import classes from './profilebar.module.css'

export interface ProfileBarProps {
    close: () => void;
    openSettings: () =>  void;
}

export function ProfileBar(props: ProfileBarProps) {
    const profile = useContext(ProfileContext);
    const emotes = useContext(ChatEmotesContext);
    const [createProfileOpen, createProfileHandler] = useDisclosure(false);
    const profiles = profile.listProfiles();

    return <Stack h='100vh' gap={0}>
        <div className={classes.header}>
            <Button onClick={props.close} variant='subtle' color='primary'>
                <IconX/>
            </Button>
        </div>
        <Stack h="100%" justify='space-between' flex="1"><div className={classes.profiles}>{profiles.map((p, i) => {
            const showChannels = 7;
            const channels = p.config.channels.slice(0, p.config.channels.length === showChannels + 1 ? showChannels + 1 : showChannels);
            const more = p.config.channels.length - channels.length;
            const activeProfile = p.name === profile.name;
            return (<Paper className={[classes.profile, activeProfile ? classes.active : undefined].join(' ')} key={'profile-' + p.name} shadow="xs" pt="sm" pb="xl" onClick={() => {profile.switchProfile(p.name);props.close()}}>
                <Text m='auto' ta="center">{p.name}</Text>
                <AvatarGroup spacing='md' style={{ justifyContent: 'center' }}>
                    {channels.map((c, i) =>
                        <Avatar src={emotes.getLogo(c)?.props.src} key={c + i} style={{ zIndex: 10 - i }}></Avatar>
                    )}
                    {more ? <Avatar key="channelmore">+{more}</Avatar> : null}
                </AvatarGroup>
            </Paper>)
        })}</div>
            <ActionIcon size={32} radius="xl" variant="filled" color='primary' m='20px auto' onClick={createProfileHandler.open}>
                <IconPlus />
            </ActionIcon>
            {createProfileOpen ? <CreateProfileView profile={profile} close={() => {props.close();props.openSettings()}} /> : null}
        </Stack>
    </Stack>
}

export function CreateProfileView(props: {
    profile: Profile,
    close: () => void;
}) {
    const [profileName, setProfileName] = useState("");
    const error = !props.profile.checkProfileName(profileName);

    return (
        <Modal opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={'Create new Profile'}>
                <TextInput label="Profilename" placeholder="" value={profileName} onChange={(ev) => setProfileName(ev.target.value)} error={profileName && error} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' disabled={error} onClick={() => {
                        props.profile.createProfile(profileName);
                        props.close();
                    }}>Create</Button>
                </Group>
            </Fieldset>
        </Modal>);
}