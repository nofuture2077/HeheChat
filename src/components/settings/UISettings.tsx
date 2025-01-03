import { Slider, Stack, TextInput, Button, ActionIcon, Modal, Fieldset, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ColorSchemeToggle } from '../colorscheme/colorscheme';
import { useContext, useState } from 'react';
import { ConfigContext, ProfileContext } from '@/ApplicationContext';
import { IconTrash, IconPencil, IconReload, IconCopy } from '@tabler/icons-react';
import { Profile } from '@/commons/profile';

export interface UISettingProperties {
    close: () => void;
    openProfileBar: () => void;
}

export function UISettings(props: UISettingProperties) {
    const config = useContext(ConfigContext);
    const profile = useContext(ProfileContext);
    const [confirmDeleteOpen, confirmDeleteHandler] = useDisclosure(false);
    const [renameOpen, renameHandler] = useDisclosure(false);
    const [cloneOpen, cloneHandler] = useDisclosure(false);
    const marks = [14, 18, 22, 26].map(x => ({ value: x, label: x + "px" }));
    return (
        <Stack mt={30} mb={30} gap={30}>
            <Fieldset legend="Hehechat" variant='filled'>
                <Stack>
                    <Button variant="light" leftSection={<IconReload size={14}/>} onClick={() => window.location.reload()}>Reload</Button>
                </Stack>
            </Fieldset>
            <Fieldset legend="Profile" variant='filled'>
                <Stack>
                <TextInput value={profile.name} readOnly disabled rightSection={
                    <ActionIcon size={32} radius="xl" variant='transparent' color='primary' onClick={renameHandler.open}>
                        <IconPencil style={{ width: 14, height: 14 }} stroke={1.5} />
                    </ActionIcon>
                }></TextInput>
                {renameOpen ? <RenameProfileView profile={profile} close={renameHandler.close} /> : null}
                {cloneOpen ? <CloneProfileView profile={profile} close={cloneHandler.close} /> : null}
                {confirmDeleteOpen ? <ConfirmProfileDeleteView title='Are you sure to delete Profile?' close={confirmDeleteHandler.close} confirm={() => { profile.deleteProfile(profile.guid); props.close(); props.openProfileBar() }} /> : null}
                <Button variant="filled" color="pink" leftSection={<IconTrash size={14} />} onClick={confirmDeleteHandler.open}>Delete</Button>
                <Button variant="filled" leftSection={<IconCopy size={14} />} onClick={cloneHandler.open}>Clone</Button>
                </Stack>
            </Fieldset>

            <Fieldset legend="Font Size" variant='filled'>
                <Slider w="calc(100% - 20px)" m="10" value={config.fontSize} onChange={config.setFontSize} min={14} max={26} label={(value) => `${value} px`} marks={marks} />
            </Fieldset>

            <Fieldset legend="Color Mode" variant='filled'>
                <ColorSchemeToggle />
            </Fieldset>
        </Stack>)
}

export function ConfirmProfileDeleteView(props: {
    title: string;
    close: () => void;
    confirm: () => void;
}) {
    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={props.title}>
                <Group justify="space-around" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button variant="filled" color="pink" onClick={props.confirm}>Delete</Button>
                </Group>
            </Fieldset>
        </Modal>);
}

export function RenameProfileView(props: {
    profile: Profile,
    close: () => void;
}) {
    const [profileName, setProfileName] = useState("");
    const error = !props.profile.checkProfileName(profileName);

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={'Rename Profile'}>
                <TextInput label="Profilename" placeholder="" value={profileName} onChange={(ev) => setProfileName(ev.target.value)} error={profileName && error} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' disabled={error} onClick={() => {
                        props.profile.setProfileName(profileName);
                        props.close();
                    }}>Rename</Button>
                </Group>
            </Fieldset>
        </Modal>);
}

export function CloneProfileView(props: {
    profile: Profile,
    close: () => void;
}) {
    const [profileName, setProfileName] = useState("");
    const error = !props.profile.checkProfileName(profileName);

    return (
        <Modal zIndex={400} opened={true} onClose={props.close} withCloseButton={false}>
            <Fieldset legend={'Clone Profile'}>
                <TextInput label="Profilename" placeholder="" value={profileName} onChange={(ev) => setProfileName(ev.target.value)} error={profileName && error} />
                <Group justify="flex-end" mt="md">
                    <Button onClick={props.close}>Cancel</Button>
                    <Button color='primary' disabled={error} onClick={() => {
                        props.profile.createProfile(profileName, props.profile);
                        props.close();
                    }}>Clone</Button>
                </Group>
            </Fieldset>
        </Modal>);
}