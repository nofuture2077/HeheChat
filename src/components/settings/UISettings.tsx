import { Slider, Stack, Text, Space, TextInput, Button, ActionIcon, Modal, Fieldset, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ColorSchemeToggle } from '../ColorSchemeToggle/ColorSchemeToggle';
import { useContext, useState } from 'react';
import { ConfigContext, ProfileContext } from '@/ApplicationContext';
import { IconTrash, IconPencil } from '@tabler/icons-react';
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
    const marks = [11, 12, 13, 14, 15, 16, 17, 18].map(x => ({value: x, label: x + "px"}));
    return (
    <Stack>
        <Text size="md">Profile</Text>
        <TextInput value={profile.name} readOnly disabled rightSection={
                        <ActionIcon size={32} radius="xl" variant='transparent' color='primary' onClick={renameHandler.open}>
                            <IconPencil style={{ width: 14, height: 14 }} stroke={1.5} />
                        </ActionIcon>
                    }></TextInput>
        {renameOpen ? <RenameProfileView profile={profile} close={renameHandler.close}/> : null}
        {confirmDeleteOpen ? <ConfirmProfileDeleteView title='Are you sure to delete Profile?' close={confirmDeleteHandler.close} confirm={() => {profile.deleteProfile(profile.name);props.close();props.openProfileBar()}}/> : null}
        <Button variant="filled" color="pink" leftSection={<IconTrash size={14} />} onClick={confirmDeleteHandler.open}>Delete</Button>
        <Text size="md">Font Size</Text>
        <Slider value={config.fontSize} onChange={config.setFontSize} min={11} max={18} label={(value) => `${value} px`} marks={marks} />
        <Space h={"md"}/>
        <Text size="md">Color Mode</Text>
        <ColorSchemeToggle/>
    </Stack>)
}

export function ConfirmProfileDeleteView(props: {
    title: string;
    close: () => void;
    confirm: () => void;
}) {
    return (
        <Modal opened={true} onClose={props.close} withCloseButton={false}>
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
        <Modal opened={true} onClose={props.close} withCloseButton={false}>
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