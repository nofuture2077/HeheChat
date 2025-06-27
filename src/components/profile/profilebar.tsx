import { useContext, useState } from "react";
import { ChatEmotesContext, ProfileContext } from '@/ApplicationContext'
import { AvatarGroup, Avatar, Text, Paper, ActionIcon, Stack, Modal, Fieldset, TextInput, Group, Button, Title, ScrollArea } from '@mantine/core';
import { useDisclosure } from "@mantine/hooks";
import { Profile } from "@/commons/profile";
import { IconPlus, IconX } from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from '@hello-pangea/dnd';
import classes from './profilebar.module.css'
import { ChatEmotes } from "@/commons/emotes";
import { SettingsTab } from "@/components/settings/settings";
import { OverlayDrawer } from "@/pages/Chat.page";

export const ProfileBarDrawer: OverlayDrawer = {
    name: 'profileBar',
    component: ProfileBar,
    size: 280,
    position: 'left',
}

export interface ProfileBarProps {
    close: () => void;
    openSettings: (tab?: SettingsTab) => void;
}

export function ProfileBar(props: ProfileBarProps) {
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
            // Update the profiles on the server first
            await activeProfile.setProfiles(items);
            // Then update local state
            setProfiles(items);
        } catch (error) {
            console.error('Error updating profiles order:', error);
            // Refresh the profiles list from the context to ensure consistency
            setProfiles(activeProfile.listProfiles());
        }
    }

    return <Stack h='100vh' gap={0} className={classes.profileBar}>
        <Group justify="space-between" p="md">
            <Title order={4}>
                Profiles
            </Title>
            <Button onClick={props.close} variant='subtle' color='primary'>
                <IconX />
            </Button>
        </Group>
        <ScrollArea>
            <Stack h="100%" justify='flex-start' flex="1">
                <DragDropContext onDragEnd={handleOnDragEnd}>
                    <Droppable droppableId="profiles">
                        {(provided) => (
                            ProfileListComp(provided, profiles, activeProfile, emotes, props.close)
                        )}
                    </Droppable>
                </DragDropContext>
                <ActionIcon size={32} radius="xl" variant="filled" color='primary' m='0 auto 20px' onClick={createProfileHandler.open}>
                    <IconPlus />
                </ActionIcon>
                {createProfileOpen ? <CreateProfileView activeProfile={activeProfile} close={() => { props.close(); props.openSettings("Chat") }} /> : null}
            </Stack>
        </ScrollArea>
    </Stack>
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
