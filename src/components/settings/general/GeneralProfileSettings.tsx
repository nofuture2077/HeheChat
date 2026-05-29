import { TextInput, Button, ActionIcon, Modal, Fieldset, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconPencil, IconCopy } from '@tabler/icons-react';
import { useContext, useState } from 'react';
import { ProfileContext } from '@/ApplicationContext';
import { Profile } from '@/commons/profile';

export function GeneralProfileSettings() {
    const profile = useContext(ProfileContext);
    const [confirmDeleteOpen, confirmDeleteHandler] = useDisclosure(false);
    const [renameOpen, renameHandler] = useDisclosure(false);
    const [cloneOpen, cloneHandler] = useDisclosure(false);

    return (
        <Fieldset legend="Current Profile" variant='filled'>
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
                            } catch (error) {
                                console.error('Error deleting profile:', error);
                            }
                        }}
                    />
                ) : null}
                <Button variant="filled" leftSection={<IconCopy size={14} />} onClick={cloneHandler.open}>Clone</Button>
                <Button variant="filled" color="pink" leftSection={<IconTrash size={14} />} onClick={confirmDeleteHandler.open}>Delete</Button>
            </Stack>
        </Fieldset>
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
