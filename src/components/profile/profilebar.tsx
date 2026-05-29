import { useContext, useState } from "react";
import { ChatEmotesContext, ProfileContext } from '@/ApplicationContext'
import { AvatarGroup, Avatar, Text, Paper, ActionIcon, Stack, Modal, Fieldset, TextInput, Group, Button } from '@mantine/core';
import { useDisclosure } from "@mantine/hooks";
import { Profile } from "@/commons/profile";
import { IconPlus } from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from '@hello-pangea/dnd';
import classes from './profilebar.module.css'
import { ChatEmotes } from "@/commons/emotes";

export interface ProfileSelectorProps {
    onProfileSwitched?: () => void;
    onCreateProfileRequested?: () => void;
}

export function ProfileSelector(props: ProfileSelectorProps) {
    const activeProfile = useContext(ProfileContext);
    const emotes = useContext(ChatEmotesContext);
    const [createProfileOpen, createProfileHandler] = useDisclosure(false);

    const [profiles, setProfiles] = useState(activeProfile.listProfiles());

    async function handleOnDragEnd(result: DropResult) {
        if (!result.destination) {
            return
        };

        const items = Array.from(profiles);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        try {
            await activeProfile.setProfiles(items);
            setProfiles(items);
        } catch (error) {
            console.error('Error updating profiles order:', error);
            setProfiles(activeProfile.listProfiles());
        }
    }

    const handleProfileSwitched = () => {
        props.onProfileSwitched?.();
    };

    return (
        <Stack gap="xs">
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="profiles">
                    {(provided) => (
                        ProfileListComp(provided, profiles, activeProfile, emotes, handleProfileSwitched)
                    )}
                </Droppable>
            </DragDropContext>
            <ActionIcon size={32} radius="xl" variant="filled" color='primary' m='0 auto 20px' onClick={createProfileHandler.open}>
                <IconPlus />
            </ActionIcon>
            {createProfileOpen ? <CreateProfileView activeProfile={activeProfile} close={() => { createProfileHandler.close(); props.onCreateProfileRequested?.(); }} /> : null}
        </Stack>
    );
}

function ProfileListComp(provided: DroppableProvided, profiles: Profile[], activeProfile: Profile, emotes: ChatEmotes, close: () => void) {
    return <div className={classes.profiles} {...provided.droppableProps} ref={provided.innerRef}>
        {profiles.map((profile, index) => 
            <Draggable key={profile.guid} draggableId={profile.guid} index={index}>
                {(provided) => ProfileComp(provided, profile, activeProfile, close, emotes)}
            </Draggable>
        )}
        {provided.placeholder}
    </div>;
}

function ProfileComp(provided: DraggableProvided, profile: Profile, activeProfile: Profile, close: () => void, emotes: ChatEmotes) {
    const showChannels = 7;
    const channels = profile.config.channels.slice(0, profile.config.channels.length === showChannels + 1 ? showChannels + 1 : showChannels);
    const more = profile.config.channels.length - channels.length;
    const isActive = profile.guid === activeProfile.guid;
    return (<Paper ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={[classes.profile, isActive ? classes.active : undefined].join(' ')} key={'profile-' + profile.guid} shadow="xs" pt="xs" pb="xs" onClick={async () => { 
        try {
            await activeProfile.switchProfile(profile.guid);
            close();
        } catch (error) {
            console.error('Error switching profile:', error);
            // Could add user notification here
        }
    } }>
        <Text m='auto' ta="center">{profile.name}</Text>
        <AvatarGroup spacing='md' style={{ justifyContent: 'center' }}>
            {channels.map((channel: string, i: number) => <Avatar src={emotes.getLogo(channel)?.props.src} key={channel + i} style={{ zIndex: 10 - i }}></Avatar>)}
            {more ? <Avatar key="channelmore">+{more}</Avatar> : null}
        </AvatarGroup>
    </Paper>);
}

export function CreateProfileView(props: {
    activeProfile: Profile,
    close: () => void;
}) {
    const [profileName, setProfileName] = useState("");
    const error = !props.activeProfile.checkProfileName(profileName);

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={'Create new Profile'}>
                <TextInput label="Profilename" placeholder="" value={profileName} onChange={(ev) => setProfileName(ev.target.value)} error={profileName && error} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' disabled={error} onClick={async () => {
                        try {
                            await props.activeProfile.createProfile(profileName);
                            props.close();
                        } catch (error) {
                            console.error('Error creating profile:', error);
                            // Could add user notification here
                        }
                    }}>Create</Button>
                </Group>
            </Fieldset>
        </Modal>);
}
