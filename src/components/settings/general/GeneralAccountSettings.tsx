import { TextInput, Button, ActionIcon, Modal, Fieldset, Group, Stack, Avatar, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconPencil, IconCopy, IconLogout } from '@tabler/icons-react';
import { useContext, useState } from 'react';
import { ConfigContext, LoginContextContext, ProfileContext } from '@/ApplicationContext';
import { Profile } from '@/commons/profile';

export interface GeneralAccountSettingsProps {
    close: () => void;
    openProfileBar: () => void;
    openUserProfile: () => void;
}

export function GeneralAccountSettings({ close, openProfileBar }: GeneralAccountSettingsProps) {
    const profile = useContext(ProfileContext);
    const loginContext = useContext(LoginContextContext);
    const [confirmDeleteOpen, confirmDeleteHandler] = useDisclosure(false);
    const [renameOpen, renameHandler] = useDisclosure(false);
    const [cloneOpen, cloneHandler] = useDisclosure(false);

    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="User" variant='filled'>
                <Stack gap="sm">
                    <Group gap="sm">
                        <Avatar src={loginContext.user?.profilePictureUrl || ''} radius="xl" size="lg" />
                        <Stack gap={2}>
                            <Text fw={600}>{loginContext.user?.displayName || ''}</Text>
                            <Text size="sm" c="dimmed">{loginContext.user?.description || ''}</Text>
                        </Stack>
                    </Group>
                    <Button
                        variant="light"
                        color="red"
                        leftSection={<IconLogout size={14} />}
                        onClick={() => {
                            localStorage.removeItem('hehe-token');
                            loginContext.setAccessToken(undefined);
                        }}
                    >
                        Logout
                    </Button>
                </Stack>
            </Fieldset>

            <Fieldset legend="Profile" variant='filled'>
                <Stack>
                    <TextInput value={profile.name} readOnly disabled rightSection={
                        <ActionIcon size={32} radius="xl" variant='transparent' color='primary' onClick={renameHandler.open}>
                            <IconPencil style={{ width: 14, height: 14 }} stroke={1.5} />
                        </ActionIcon>
                    } />
                    {renameOpen ? <RenameProfileView profile={profile} close={renameHandler.close} /> : null}
                    {cloneOpen ? <CloneProfileView profile={profile} close={cloneHandler.close} /> : null}
                    {confirmDeleteOpen ? (
                        <ConfirmProfileDeleteView
                            title='Are you sure to delete Profile?'
                            close={confirmDeleteHandler.close}
                            confirm={async () => {
                                try {
                                    await profile.deleteProfile(profile.guid);
                                    close();
                                    openProfileBar();
                                } catch (error) {
                                    console.error('Error deleting profile:', error);
                                }
                            }}
                        />
                    ) : null}
                    <Button variant="filled" color="pink" leftSection={<IconTrash size={14} />} onClick={confirmDeleteHandler.open}>Delete</Button>
                    <Button variant="filled" leftSection={<IconCopy size={14} />} onClick={cloneHandler.open}>Clone</Button>
                </Stack>
            </Fieldset>
        </Stack>
    );
}

function ConfirmProfileDeleteView(props: { title: string; close: () => void; confirm: () => void }) {
    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={props.title}>
                <Group justify="space-around" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button variant="filled" color="pink" onClick={props.confirm}>Delete</Button>
                </Group>
            </Fieldset>
        </Modal>
    );
}

function RenameProfileView(props: { profile: Profile; close: () => void }) {
    const [profileName, setProfileName] = useState("");
    const error = !props.profile.checkProfileName(profileName);

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend='Rename Profile'>
                <TextInput label="Profilename" placeholder="" value={profileName} onChange={(ev) => setProfileName(ev.target.value)} error={profileName && error} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' disabled={error} onClick={async () => {
                        try {
                            await props.profile.setProfileName(profileName);
                            props.close();
                        } catch (error) {
                            console.error('Error renaming profile:', error);
                        }
                    }}>Rename</Button>
                </Group>
            </Fieldset>
        </Modal>
    );
}

function CloneProfileView(props: { profile: Profile; close: () => void }) {
    const [profileName, setProfileName] = useState("");
    const error = !props.profile.checkProfileName(profileName);

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend='Clone Profile'>
                <TextInput label="Profilename" placeholder="" value={profileName} onChange={(ev) => setProfileName(ev.target.value)} error={profileName && error} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' disabled={error} onClick={async () => {
                        try {
                            await props.profile.createProfile(profileName, props.profile);
                            props.close();
                        } catch (error) {
                            console.error('Error cloning profile:', error);
                        }
                    }}>Clone</Button>
                </Group>
            </Fieldset>
        </Modal>
    );
}
